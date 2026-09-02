// Provider + hooks za građanski portal (odvojen od RoleContext-a).
/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { toCitizenSession, type CitizenAccount, type CitizenSession } from './citizenSession';

interface CitizenContextValue {
  citizen: CitizenSession | null;
  /** Registruje nalog i odmah prijavljuje. Vraća grešku (bs) ili null. */
  register: (input: CitizenAccount) => string | null;
  /** Prijava po JMB + lozinci. Vraća grešku (bs) ili null. */
  login: (jmb: string, password: string) => string | null;
  logout: () => void;
}

const CitizenCtx = createContext<CitizenContextValue | null>(null);

const SESSION_KEY = 'dutyboard.citizen';
const ACCOUNTS_KEY = 'dutyboard.citizen.accounts';

// Seed nalog — da se portal može demonstrirati bez ručne registracije.
const SEED_ACCOUNTS: CitizenAccount[] = [
  { jmb: '0101990171515', name: 'Kenan Hadžić', email: 'kenan.hadzic@email.ba', password: 'demo1234' },
];

function readAccounts(): CitizenAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw) as CitizenAccount[];
  } catch {
    /* ignore */
  }
  return [...SEED_ACCOUNTS];
}

function writeAccounts(list: CitizenAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}

function readSession(): CitizenSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CitizenSession) : null;
  } catch {
    return null;
  }
}

function writeSession(s: CitizenSession | null) {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function CitizenProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<CitizenAccount[]>(() => readAccounts());
  const [citizen, setCitizen] = useState<CitizenSession | null>(() => readSession());

  const persistSession = useCallback((s: CitizenSession | null) => {
    writeSession(s);
    setCitizen(s);
  }, []);

  const register = useCallback(
    (input: CitizenAccount): string | null => {
      if (accounts.some((a) => a.jmb === input.jmb)) return 'Nalog s ovim JMB već postoji.';
      if (accounts.some((a) => a.email === input.email)) return 'Ova e-mail adresa je već registrovana.';
      const next = [...accounts, input];
      setAccounts(next);
      writeAccounts(next);
      persistSession(toCitizenSession(input));
      return null;
    },
    [accounts, persistSession],
  );

  const login = useCallback(
    (jmb: string, password: string): string | null => {
      const acc = accounts.find((a) => a.jmb === jmb.trim());
      if (!acc || acc.password !== password) return 'Neispravan JMB ili lozinka.';
      persistSession(toCitizenSession(acc));
      return null;
    },
    [accounts, persistSession],
  );

  const logout = useCallback(() => persistSession(null), [persistSession]);

  const value = useMemo(
    () => ({ citizen, register, login, logout }),
    [citizen, register, login, logout],
  );
  return <CitizenCtx.Provider value={value}>{children}</CitizenCtx.Provider>;
}

export function useCitizen(): CitizenSession {
  const ctx = useContext(CitizenCtx);
  if (!ctx?.citizen) throw new Error('useCitizen pozvan bez prijavljenog građanina.');
  return ctx.citizen;
}

export function useOptionalCitizen(): CitizenSession | null {
  return useContext(CitizenCtx)?.citizen ?? null;
}

export function useCitizenActions() {
  const ctx = useContext(CitizenCtx);
  if (!ctx) throw new Error('CitizenProvider nije montiran.');
  return { register: ctx.register, login: ctx.login, logout: ctx.logout };
}
