import { useState } from 'react';
import { useGate } from './useGate';
import { Button } from '../../components/Button';
import { useOrg } from '../../app/OrgContext';

interface Props {
  onAuthenticated: () => void;
}

export function GateScreen({ onAuthenticated }: Props) {
  const gate = useGate();
  const { org } = useOrg();
  const [key, setKey] = useState('');

  if (gate.status === 'checking') {
    return (
      <div className="paper-noise flex min-h-screen items-center justify-center bg-navy-900 text-paper-300">
        <div className="text-sm">Provjera sesije…</div>
      </div>
    );
  }

  if (gate.status === 'authenticated') {
    queueMicrotask(onAuthenticated);
    return null;
  }

  const locked = gate.status === 'locked';
  const lockedMinutesLeft =
    gate.lockedUntilMs != null ? Math.max(0, Math.ceil((gate.lockedUntilMs - Date.now()) / 60000)) : null;

  return (
    <div className="paper-noise relative flex min-h-screen items-center justify-center bg-navy-900 px-4 py-10">
      <BackgroundCrest />

      <div className="relative w-full max-w-md">
        {/* Header nad karticom */}
        <div className="mb-6 text-center">
          <Crest />
          <div className="section-label mt-4 text-brass-300">{org.orgName}</div>
          <h1 className="mt-2 font-heading text-3xl font-medium text-paper-50">{org.productName}</h1>
          <div className="mt-1 text-sm text-paper-300">Sistem za upravljanje ljudstvom</div>
          <div className="mx-auto mt-4 h-[2px] w-16 bg-brass-500" />
        </div>

        {/* Kartica */}
        <div className="border border-paper-200 bg-paper-0 px-8 py-8">
          <p className="mb-6 text-center text-sm leading-relaxed text-ink-600">
            Demo okruženje je zaštićeno. Ključ ste dobili u pozivnom emailu. Svi podaci u demonstraciji su izmišljeni.
          </p>

          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await gate.submit(key.trim());
              if (ok) onAuthenticated();
            }}
          >
            <label className="block">
              <div className="section-label mb-2 text-ink-500">Pristupni ključ</div>
              <input
                type="password"
                autoComplete="off"
                autoFocus
                spellCheck={false}
                className="w-full border border-paper-300 bg-paper-50 px-4 py-3 text-center font-mono text-lg tracking-[0.35em] text-navy-900 outline-none transition placeholder:tracking-normal placeholder:text-paper-400 focus:border-brass-500 focus:bg-paper-0 disabled:opacity-60"
                placeholder="•  •  •  •  •"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={locked || gate.submitting}
                aria-label="Pristupni ključ"
              />
            </label>

            {gate.error ? (
              <div className="border border-signal-alarm/30 bg-signal-alarm-soft px-3 py-2 text-center text-sm text-signal-alarm">
                {gate.error}
              </div>
            ) : null}

            {locked && lockedMinutesLeft != null ? (
              <div className="border border-signal-warn/30 bg-signal-warn-soft px-3 py-2 text-center text-sm text-signal-warn">
                Pristup privremeno zaključan. Pokušaj ponovo za {lockedMinutesLeft} min.
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={locked || gate.submitting || key.trim().length === 0}
            >
              {gate.submitting ? 'Provjera…' : 'Uđi u demo'}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <div className="section-label text-brass-300">Napomena</div>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-paper-300">
            Produkcijski sistem koristi AD/LDAP autentifikaciju sa 2FA i hosting u BiH.
            Ova demonstracija je izolovano okruženje sa isključivo izmišljenim podacima.
          </p>
        </div>
      </div>
    </div>
  );
}

function Crest() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="mx-auto" aria-hidden>
      <path
        d="M28 6 L46 12 V28 C46 39 38 47 28 50 C18 47 10 39 10 28 V12 Z"
        fill="none"
        stroke="var(--color-brass-500)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 28 L26 34 L37 22"
        fill="none"
        stroke="var(--color-brass-300)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackgroundCrest() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 mx-auto h-full w-full opacity-[0.04]"
      viewBox="0 0 800 800"
      aria-hidden
    >
      <path
        d="M400 100 L620 180 V400 C620 540 520 640 400 680 C280 640 180 540 180 400 V180 Z"
        fill="none"
        stroke="var(--color-brass-500)"
        strokeWidth="1"
      />
    </svg>
  );
}
