import { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { useGate } from './useGate';

interface Props {
  onAuthenticated: () => void;
}

export function GateScreen({ onAuthenticated }: Props) {
  const gate = useGate();
  const [key, setKey] = useState('');

  if (gate.status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 text-ink-100">
        <div className="text-sm text-ink-300">Provjera sesije…</div>
      </div>
    );
  }

  if (gate.status === 'authenticated') {
    // Već autentifikovani — signal roditelju.
    queueMicrotask(onAuthenticated);
    return null;
  }

  const locked = gate.status === 'locked';
  const lockedMinutesLeft =
    gate.lockedUntilMs != null ? Math.max(0, Math.ceil((gate.lockedUntilMs - Date.now()) / 60000)) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-ink-900 to-ink-800 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-ink-400">Dutyboard</div>
            <div className="text-lg font-semibold text-ink-900">Demo okruženje</div>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-ink-600">
          Demo okruženje je zaštićeno. Ključ ste dobili u pozivnom emailu.
          Svi podaci u demonstraciji su izmišljeni.
        </p>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await gate.submit(key.trim());
            if (ok) onAuthenticated();
          }}
        >
          <label className="block">
            <div className="mb-2 text-sm font-medium text-ink-700">Pristupni ključ</div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                autoComplete="off"
                autoFocus
                className="w-full rounded-lg border border-ink-200 bg-ink-50 py-2.5 pl-10 pr-3 text-base text-ink-900 outline-none transition focus:border-ink-400 focus:bg-white focus:ring-2 focus:ring-ink-300 disabled:opacity-60"
                placeholder="unesi ključ"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={locked || gate.submitting}
                aria-label="Pristupni ključ"
              />
            </div>
          </label>

          {gate.error ? (
            <div className="rounded-md border border-signal-alarm/20 bg-signal-alarm/10 px-3 py-2 text-sm text-signal-alarm">
              {gate.error}
            </div>
          ) : null}

          {locked && lockedMinutesLeft != null ? (
            <div className="rounded-md border border-signal-warn/20 bg-signal-warn/10 px-3 py-2 text-sm text-signal-warn">
              Pristup privremeno zaključan. Pokušaj ponovo za {lockedMinutesLeft} min.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={locked || gate.submitting || key.trim().length === 0}
            className="w-full rounded-lg bg-ink-900 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {gate.submitting ? 'Provjera…' : 'Uđi u demo'}
          </button>
        </form>

        <div className="mt-6 border-t border-ink-100 pt-4 text-xs leading-relaxed text-ink-400">
          Produkcijski sistem koristi AD/LDAP autentifikaciju sa 2FA i hosting u BiH.
          Ova demonstracija je izolovano okruženje sa isključivo izmišljenim podacima.
        </div>
      </div>
    </div>
  );
}
