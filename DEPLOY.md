# Deploy — Dutyboard demo

## Environment varijable (obavezno)

```
ACCESS_KEYS=demo:DEMO-2026,interno:DEV-2026-LOCAL
SESSION_SECRET=<random 32+ bytes>
PORT=3000
NODE_ENV=production
```

**Nikad ne komituj `.env`.** `ACCESS_KEYS` je jedina barijera.

## Opcija A — DigitalOcean App Platform (jednostavnije)

1. Kreiraj novi App → Deploy from GitHub → izaberi ovaj repo
2. App Platform detektuje Dockerfile automatski
3. Environment varijable: dodaj sve iz gornje liste kao **encrypted** vrijednosti
4. Health check path: `/healthz`
5. Custom domain: dodaj domenu (izbjegavati "mup" u imenu) → DO automatski izdaje Let's Encrypt cert

**Trošak**: Basic $5-12/mj plan je dovoljan.

## Opcija B — DO Droplet + Caddy (jeftinije)

Na postojećem droplet-u:

```bash
# 1. Kloniraj repo
git clone <repo> /opt/dutyboard
cd /opt/dutyboard

# 2. Postavi env fajl (ne commit-uj)
cat > .env <<EOF
ACCESS_KEYS=demo:DEMO-2026,interno:DEV-2026-LOCAL
SESSION_SECRET=$(openssl rand -hex 32)
PORT=3000
NODE_ENV=production
EOF
chmod 600 .env

# 3. Build i pokreni sa Docker-om
docker build -t dutyboard .
docker run -d --name dutyboard --restart=always --env-file .env -p 127.0.0.1:3000:3000 dutyboard
```

Caddyfile (`/etc/caddy/Caddyfile`):

```
demo.tvojadomena.com {
    reverse_proxy 127.0.0.1:3000
    encode gzip
    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        Referrer-Policy no-referrer
    }
}
```

```bash
sudo systemctl reload caddy
```

Caddy auto-TLS uzima certifikat u ~30 sekundi.

## Verifikacija nakon deploya

```bash
curl https://demo.tvojadomena.com/healthz         # → ok
curl https://demo.tvojadomena.com/robots.txt      # → Disallow: /
curl -X POST -H "content-type: application/json" \
     -d '{"key":"DEMO-2026"}' \
     https://demo.tvojadomena.com/api/auth        # → {"label":"demo"}
```

Otvori u incognito → prikazuje se Gate → unesi ključ → E00 birač uloge.

## Preporuke prije prezentacije

- Isprobati cijeli scenarij po `SPEC.md` "Redoslijed demo prezentacije"
- Testirati na telefonu (P01–P05) i na laptopu (K01/N01/N03/M01)
- Ako se demo pravi na projektoru: uvećati font browsera na 110-125%
- Backup: `npm run dev` na laptopu ako internet padne u sali
