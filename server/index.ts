import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-in-prod';
const COOKIE_NAME = 'db_session';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// ACCESS_KEYS format: "label:key,label:key". Ako varijabla nije postavljena, koristimo dev-fallback.
// Ključevi nikad ne izlaze na klijenta — provjera je samo ovdje.
function parseAccessKeys(raw: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  const fallback = 'demo:DEMO-2026,interno:DEV-1234';
  const source = (raw && raw.trim().length > 0 ? raw : fallback).split(',');
  for (const entry of source) {
    const [label, ...rest] = entry.split(':');
    const key = rest.join(':').trim();
    if (label && key) map.set(key, label.trim());
  }
  return map;
}

const KEYS = parseAccessKeys(process.env.ACCESS_KEYS);
if (!IS_PROD) {
  const labels = [...KEYS.values()].join(', ');
  console.log(`[dutyboard] ${KEYS.size} pristupna ključa učitana (${labels}).`);
}

interface RateBucket {
  fails: number;
  lockedUntil: number;
}
const rateByIp = new Map<string, RateBucket>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

function ipOf(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

function checkLockout(ip: string): number | null {
  const b = rateByIp.get(ip);
  if (b && b.lockedUntil > Date.now()) return b.lockedUntil;
  return null;
}

function registerFail(ip: string) {
  const b = rateByIp.get(ip) ?? { fails: 0, lockedUntil: 0 };
  b.fails += 1;
  if (b.fails >= MAX_FAILS) {
    b.lockedUntil = Date.now() + LOCK_MS;
    b.fails = 0;
  }
  rateByIp.set(ip, b);
}

function clearFails(ip: string) {
  rateByIp.delete(ip);
}

function signSession(label: string): string {
  const payload = Buffer.from(JSON.stringify({ label, ts: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySession(cookie: string | undefined): { label: string } | null {
  if (!cookie) return null;
  const [payload, sig] = cookie.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { label: string; ts: number };
    if (Date.now() - parsed.ts > COOKIE_MAX_AGE_MS) return null;
    return { label: parsed.label };
  } catch {
    return null;
  }
}

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());

app.get('/healthz', (_req, res) => {
  res.type('text/plain').send('ok');
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /\n');
});

app.get('/api/session', (req, res) => {
  const session = verifySession(req.cookies[COOKIE_NAME]);
  if (session) {
    res.json({ authenticated: true, label: session.label });
    return;
  }
  const locked = checkLockout(ipOf(req));
  if (locked) {
    res.json({ authenticated: false, lockedUntil: locked });
    return;
  }
  res.json({ authenticated: false });
});

app.post('/api/auth', (req: Request, res: Response) => {
  const ip = ipOf(req);
  const locked = checkLockout(ip);
  if (locked) {
    res.status(429).json({ error: 'locked', lockedUntil: locked });
    return;
  }
  const key = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
  const label = KEYS.get(key);
  if (!label) {
    registerFail(ip);
    const stillLocked = checkLockout(ip);
    if (stillLocked) {
      res.status(429).json({ error: 'locked', lockedUntil: stillLocked });
      return;
    }
    res.status(401).json({ error: 'invalid_key' });
    return;
  }
  clearFails(ip);
  const token = signSession(label);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
  console.log(`[dutyboard] pristup odobren: label=${label} ip=${ip}`);
  res.json({ label });
});

app.post('/api/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// Serviranje SPA — samo u produkciji. U dev-u Vite servira klijent i proxy-a /api ovdje.
if (IS_PROD) {
  const distDir = path.resolve(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    console.warn(`[dutyboard] Upozorenje: ${distDir} ne postoji. Pokreni "npm run build" prije "npm start".`);
  }
  app.use(express.static(distDir, { index: false, maxAge: '1h' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api/')) return next();
    const indexPath = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexPath)) return next();
    res.sendFile(indexPath);
  });
}

app.listen(PORT, () => {
  console.log(`[dutyboard] server sluša na :${PORT} (${IS_PROD ? 'production' : 'development'})`);
});
