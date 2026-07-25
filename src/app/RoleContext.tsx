// Provider + hooks co-located (standard React context pattern); the fast-refresh
// rule is a false positive here since the hooks depend on this file's context.
/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Session } from './session';

interface RoleContextValue {
  session: Session | null;
  setSession: (s: Session | null) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = 'dutyboard.session';

function readStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(s: Session | null) {
  try {
    if (s) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignoriši quota greške; sesija je ionako demo-only
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => readStoredSession());

  const setSession = useCallback((s: Session | null) => {
    writeStoredSession(s);
    setSessionState(s);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, [setSession]);

  const value = useMemo(() => ({ session, setSession, logout }), [session, setSession, logout]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(RoleContext);
  if (!ctx?.session) {
    throw new Error('useSession pozvan bez aktivne sesije — provjeri da si iza gate + role picker-a.');
  }
  return ctx.session;
}

export function useOptionalSession(): Session | null {
  const ctx = useContext(RoleContext);
  return ctx?.session ?? null;
}

export function useRoleActions() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('RoleProvider nije montiran.');
  return { setSession: ctx.setSession, logout: ctx.logout };
}
