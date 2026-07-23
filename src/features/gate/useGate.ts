import { useCallback, useEffect, useState } from 'react';

type GateStatus = 'checking' | 'unauthenticated' | 'authenticated' | 'locked';

interface SessionResponse {
  authenticated: boolean;
  label?: string;
  lockedUntil?: number;
}

export function useGate() {
  const [status, setStatus] = useState<GateStatus>('checking');
  const [label, setLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockedUntilMs, setLockedUntilMs] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/session', { credentials: 'include' });
      const data = (await res.json()) as SessionResponse;
      if (data.authenticated) {
        setStatus('authenticated');
        setLabel(data.label ?? null);
      } else if (data.lockedUntil && data.lockedUntil > Date.now()) {
        setStatus('locked');
        setLockedUntilMs(data.lockedUntil);
      } else {
        setStatus('unauthenticated');
      }
    } catch {
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(async (key: string): Promise<boolean> => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        const data = (await res.json()) as { label: string };
        setStatus('authenticated');
        setLabel(data.label);
        return true;
      }
      if (res.status === 429) {
        const data = (await res.json().catch(() => ({}))) as { lockedUntil?: number };
        setStatus('locked');
        setLockedUntilMs(data.lockedUntil ?? Date.now() + 15 * 60 * 1000);
        setError('Previše pogrešnih pokušaja. Pokušaj ponovo za 15 minuta.');
      } else if (res.status === 401) {
        setError('Neispravan ključ.');
      } else {
        setError('Greška na serveru. Pokušaj ponovo za trenutak.');
      }
      return false;
    } catch {
      setError('Nema veze sa serverom.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setStatus('unauthenticated');
    setLabel(null);
  }, []);

  return { status, label, error, submitting, lockedUntilMs, submit, refresh, logout };
}
