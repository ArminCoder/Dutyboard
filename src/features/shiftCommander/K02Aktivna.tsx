import { useEffect, useMemo, useState } from 'react';
import { Radio, MapPin, AlertTriangle, X, UserMinus, UserPlus, Coffee, Siren } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useStore, type ActivePatrolCard } from '../../app/store';
import { checkEligibility } from '../../domain/eligibility';
import { world } from '../../data/world';
import { DEMO_TODAY, demoNow } from '../../data/generator/dates';

export function K02Aktivna() {
  const store = useStore();
  const [reassigning, setReassigning] = useState<ActivePatrolCard | null>(null);
  const [removing, setRemoving] = useState<{ patrol: ActivePatrolCard; officerId: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">Aktivna smjena · II · 19:00 – 07:00</div>
          <h1 className="mt-0.5 text-lg font-heading font-medium text-ink-800">PS Centar — trenutno na terenu</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-signal-ok/15 px-3 py-1 text-xs font-medium text-signal-ok">
            <span className="h-2 w-2 rounded-full bg-signal-ok animate-pulse" />
            live
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-700">
            <Radio className="h-4 w-4" /> Patrole
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {store.activePatrols.map((p) => (
              <PatrolCard
                key={p.id}
                patrol={p}
                onSick={(oId) => setRemoving({ patrol: p, officerId: oId })}
                onReassign={() => setReassigning(p)}
                onStatus={(st, min) => {
                  store.setPatrolStatus(p.id, st, min);
                  setToast(
                    st === 'pauza'
                      ? `${p.callSign}: pauza ${min} min.`
                      : st === 'intervencija'
                        ? `${p.callSign}: upućena na intervenciju.`
                        : `${p.callSign}: ponovo na terenu.`,
                  );
                  setTimeout(() => setToast(null), 3000);
                }}
              />
            ))}
          </div>
        </section>

        <aside>
          <div className=" bg-paper-0 p-4 border border-paper-200">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Dnevnik smjene</div>
            <ol className="space-y-2 text-xs">
              {[...store.shiftLog].reverse().map((e) => (
                <li key={e.id} className="border-l-2 border-paper-200 pl-3">
                  <div className="font-medium text-ink-800">{e.event}</div>
                  <div className="mt-0.5 text-[10px] text-ink-400">
                    {e.when.slice(11, 16)} · {e.who}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      {removing && (
        <RemoveOfficerDialog
          patrol={removing.patrol}
          officerId={removing.officerId}
          onClose={() => setRemoving(null)}
          onConfirm={(reason) => {
            store.markOfficerSick(removing.patrol.id, removing.officerId, reason);
            setRemoving(null);
            setToast('Patrola označena kao NEPOTPUNA — sistem predlaže zamjenu.');
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {reassigning && (
        <ReassignDrawer
          patrol={reassigning}
          onClose={() => setReassigning(null)}
          onDone={() => {
            setReassigning(null);
            setToast('Premješten. Patrola ponovo popunjena, zapis u dnevniku.');
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="rounded-full bg-navy-900 px-4 py-2 text-sm text-paper-50 ">{toast}</div>
        </div>
      )}
    </div>
  );
}


function PatrolCard({
  patrol,
  onSick,
  onReassign,
  onStatus,
}: {
  patrol: ActivePatrolCard;
  onSick: (officerId: string) => void;
  onReassign: () => void;
  onStatus: (status: ActivePatrolCard['status'], minutes?: number) => void;
}) {
  const officers = patrol.officers
    .map((id) => world.officers.find((o) => o.id === id))
    .filter(Boolean) as typeof world.officers;

  const cls =
    patrol.status === 'nepotpuna'
      ? 'border-signal-alarm/40 bg-signal-alarm/5'
      : patrol.status === 'intervencija'
      ? 'border-signal-warn/40 bg-signal-warn/5'
      : 'border-paper-200 bg-paper-0';

  return (
    <div className={` border p-4  ${cls}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-heading font-medium text-ink-800">{patrol.callSign}</div>
          {patrol.vehiclePlate && <div className="text-[11px] text-ink-500">{patrol.vehiclePlate}</div>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={patrol.status} />
          {patrol.status === 'pauza' && patrol.pauzaDo ? <PauzaCountdown until={patrol.pauzaDo} /> : null}
        </div>
      </div>

      {patrol.location && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-ink-500">
          <MapPin className="h-3 w-3" /> {patrol.location}
        </div>
      )}

      {patrol.status === 'nepotpuna' && patrol.incompleteReason && (
        <div className="mb-3 flex items-start gap-2  bg-signal-alarm/10 px-2 py-1.5 text-[11px] text-signal-alarm">
          <AlertTriangle className="mt-0.5 h-3 w-3 flex-none" />
          {patrol.incompleteReason}
        </div>
      )}

      <ul className="mb-3 space-y-1">
        {officers.map((o) => (
          <li key={o.id} className="flex items-center justify-between text-xs">
            <span className="text-ink-800">{o.name}</span>
            <button
              onClick={() => onSick(o.id)}
              className="rounded p-1 text-paper-400 transition hover:bg-signal-alarm/10 hover:text-signal-alarm"
              title="Označi kao napustio smjenu"
            >
              <UserMinus className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Status mijenja šef smjene kad mu se patrola javi. */}
      {patrol.status !== 'nepotpuna' && (
        <div className="mb-3 flex flex-wrap gap-1.5 border-t border-paper-200 pt-3">
          {patrol.status !== 'na_terenu' ? (
            <StatusBtn onClick={() => onStatus('na_terenu')} icon={<Radio className="h-3 w-3" />}>
              Na terenu
            </StatusBtn>
          ) : null}
          {patrol.status !== 'intervencija' ? (
            <StatusBtn onClick={() => onStatus('intervencija')} icon={<Siren className="h-3 w-3" />}>
              Intervencija
            </StatusBtn>
          ) : null}
          {patrol.status !== 'pauza' ? (
            <>
              <StatusBtn onClick={() => onStatus('pauza', 30)} icon={<Coffee className="h-3 w-3" />}>
                Pauza 30
              </StatusBtn>
              <StatusBtn onClick={() => onStatus('pauza', 45)} icon={<Coffee className="h-3 w-3" />}>
                45 min
              </StatusBtn>
            </>
          ) : null}
        </div>
      )}

      {patrol.status === 'nepotpuna' && (
        <button
          onClick={onReassign}
          className="flex w-full items-center justify-center gap-1.5  bg-navy-900 px-3 py-2 text-xs font-medium text-paper-50 transition hover:bg-navy-800"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Predloži zamjenu
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ActivePatrolCard['status'] }) {
  const map = {
    na_terenu: { cls: 'bg-signal-ok/15 text-signal-ok', label: 'na terenu', Icon: Radio },
    pauza: { cls: 'bg-paper-100 text-ink-600', label: 'pauza', Icon: Coffee },
    intervencija: { cls: 'bg-signal-warn/15 text-signal-warn', label: 'intervencija', Icon: Siren },
    nepotpuna: { cls: 'bg-signal-alarm/15 text-signal-alarm font-bold', label: 'NEPOTPUNA', Icon: AlertTriangle },
  } as const;
  const { cls, label, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ReassignDrawer({
  patrol,
  onClose,
  onDone,
}: {
  patrol: ActivePatrolCard;
  onClose: () => void;
  onDone: () => void;
}) {
  const scoped = useScopedWorld();
  const store = useStore();

  const candidates = useMemo(() => {
    // Kandidati: policajci u PS Centru koji nisu već u patroli, sortirani po kvalifikaciji za ulogu
    const pjesackaOnly = scoped.officers
      .filter((o) => !patrol.officers.includes(o.id))
      .filter((o) => o.status === 'aktivan')
      .map((o) => {
        // Simulira slot i shift za eligibility check
        const fakeSlot = { id: `active-${patrol.id}`, requiredRoleId: 'pu-centar:auto', capacity: 2, assignedOfficerIds: patrol.officers };
        const fakeShift = { id: 'active-shift', date: DEMO_TODAY, kind: 'II' as const, psId: 'ps-centar', slots: [fakeSlot] };
        const el = checkEligibility({ officer: o, slot: fakeSlot, shift: fakeShift, world: scoped });
        return { officer: o, el };
      })
      .filter((c) => c.el.eligible)
      .slice(0, 8);
    return pjesackaOnly;
  }, [patrol, scoped]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="flex w-full max-w-md flex-col bg-paper-0 ">
        <header className="border-b border-paper-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-400">Prijedlog zamjene</div>
              <h2 className="mt-0.5 text-lg font-heading font-medium text-ink-800">{patrol.callSign}</h2>
              <div className="mt-1 text-xs text-ink-500">
                Rangirano iz pješačkih patrola, filtrirano po kvalifikacijama.
              </div>
            </div>
            <button onClick={onClose} className=" p-1 text-ink-400 hover:bg-paper-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          <ul className="space-y-2">
            {candidates.length === 0 ? (
              <li className=" border border-dashed border-paper-200 px-3 py-6 text-center text-xs text-ink-400">
                Nema kandidata koji zadovoljavaju uslove.
              </li>
            ) : null}
            {candidates.map(({ officer }) => (
              <li key={officer.id}>
                <button
                  onClick={() => {
                    store.reassignOfficer(patrol.id, officer.id);
                    onDone();
                  }}
                  className="flex w-full items-center justify-between  border border-signal-ok/30 bg-signal-ok/5 px-3 py-3 text-left transition hover:border-signal-ok"
                >
                  <div>
                    <div className="text-sm font-medium text-ink-800">{officer.name}</div>
                    <div className="text-[11px] text-ink-500">{officer.rank.replace('_', ' ')}</div>
                  </div>
                  <span className="rounded-full bg-signal-ok/15 px-2 py-0.5 text-[10px] font-medium uppercase text-signal-ok">
                    Premjesti
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}


function StatusBtn({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 border border-paper-200 bg-paper-50 px-2 py-1 text-[11px] text-ink-700 transition hover:border-navy-500 hover:text-navy-900"
    >
      {icon}
      {children}
    </button>
  );
}

/** Odbrojavanje pauze — računa se prema demo satu, pa je stabilno u demou. */
function PauzaCountdown({ until }: { until: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(int);
  }, []);

  const now = demoNow();
  const mins = minutesBetween(now, until);
  if (mins <= 0) return <span className="text-[10px] text-signal-warn">pauza istekla</span>;
  return (
    <span className="font-mono text-[10px] tabular-nums text-ink-500">
      još {mins} min · do {until.slice(11, 16)}
    </span>
  );
}

function minutesBetween(fromIso: string, toIso: string): number {
  const [, a] = fromIso.split('T');
  const [, b] = toIso.split('T');
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return (bh * 60 + bm) - (ah * 60 + am);
}

/** Uklanjanje iz smjene traži potvrdu i razlog — ostaje trag u dnevniku. */
function RemoveOfficerDialog({
  patrol,
  officerId,
  onClose,
  onConfirm,
}: {
  patrol: ActivePatrolCard;
  officerId: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const officer = world.officers.find((o) => o.id === officerId);
  const REASONS = ['bolovanje', 'povreda na radu', 'hitan porodični slučaj', 'upućen po nalogu'];
  const [reason, setReason] = useState(REASONS[0]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-paper-0 p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-heading text-lg text-ink-800">Uklanjanje iz smjene</h3>
          <button onClick={onClose} aria-label="Zatvori">
            <X className="h-4 w-4 text-ink-500 hover:text-ink-800" />
          </button>
        </div>
        <p className="mb-4 text-sm text-ink-600">
          <span className="font-medium text-ink-800">{officer?.name}</span> se uklanja iz patrole{' '}
          <span className="font-medium text-ink-800">{patrol.callSign}</span>. Patrola će biti označena kao
          NEPOTPUNA dok se ne nađe zamjena.
        </p>

        <div className="mb-4">
          <span className="mb-1 block text-xs font-medium text-ink-600">Razlog</span>
          <div className="grid gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`border px-3 py-2 text-left text-sm capitalize transition ${
                  reason === r ? 'border-navy-900 bg-navy-900 text-paper-50' : 'border-paper-200 bg-paper-50 text-ink-700 hover:border-navy-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm text-ink-600 hover:bg-paper-100">
            Odustani
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="bg-signal-alarm px-3 py-2 text-sm text-paper-50 transition hover:opacity-90"
          >
            Potvrdi uklanjanje
          </button>
        </div>
      </div>
    </div>
  );
}
