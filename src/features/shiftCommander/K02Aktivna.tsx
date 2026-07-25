import { useMemo, useState } from 'react';
import { Radio, MapPin, AlertTriangle, X, UserMinus, UserPlus, Coffee, Siren } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useStore, type ActivePatrolCard } from '../../app/store';
import { checkEligibility } from '../../domain/eligibility';
import { world } from '../../data/world';
import { DEMO_TODAY } from '../../data/generator/dates';

export function K02Aktivna() {
  const store = useStore();
  const [reassigning, setReassigning] = useState<ActivePatrolCard | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">Aktivna smjena · II · 19:00 – 07:00</div>
          <h1 className="mt-0.5 text-lg font-heading font-medium text-ink-800">PS Centar — trenutno na terenu</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-signal-ok/15 px-3 py-1 text-xs font-medium text-signal-ok">
          <span className="h-2 w-2 rounded-full bg-signal-ok animate-pulse" />
          live
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
                onSick={(oId) => {
                  store.markOfficerSick(p.id, oId);
                  setToast('Patrola označena kao NEPOTPUNA — sistem predlaže zamjenu.');
                  setTimeout(() => setToast(null), 3000);
                }}
                onReassign={() => setReassigning(p)}
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
}: {
  patrol: ActivePatrolCard;
  onSick: (officerId: string) => void;
  onReassign: () => void;
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
        <StatusBadge status={patrol.status} />
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
