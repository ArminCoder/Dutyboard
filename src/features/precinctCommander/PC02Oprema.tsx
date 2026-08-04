import { useMemo, useState } from 'react';
import { Search, X, Crosshair, Radio, Shield, BadgeCheck, Car, Wrench } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { EQUIPMENT_LABEL, RANK_LABEL, type EquipmentType } from '../../data/types';
import { DEMO_TODAY, formatBs } from '../../data/generator/dates';

// PC02 — naoružanje, oprema i vozila stanice. Komandir odgovara za zaduženja:
// ko je šta zadužio, po serijskom broju, i šta je na stanju.

const TRACKED: Array<{ type: EquipmentType; icon: typeof Crosshair; label: string }> = [
  { type: 'oruzje', icon: Crosshair, label: 'Službeno oružje' },
  { type: 'radio', icon: Radio, label: 'Radio-stanice' },
  { type: 'prsluk', icon: Shield, label: 'Balistički prsluci' },
  { type: 'znacka', icon: BadgeCheck, label: 'Značke' },
];

export function PC02Oprema() {
  const w = useScopedWorld();
  const session = useSession();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<EquipmentType>('oruzje');

  /** Zaduženja po vrsti — izdato je ono što policajci nose, na stanju ostatak fonda. */
  const stats = useMemo(() => {
    const total = w.officers.length;
    return TRACKED.map((t) => {
      const issued = w.officers.filter((o) => o.equipmentAssigned.some((e) => e.type === t.type)).length;
      return { ...t, issued, missing: total - issued };
    });
  }, [w.officers]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return w.officers
      .map((o) => ({ officer: o, item: o.equipmentAssigned.find((e) => e.type === type) }))
      .filter((r) => (q ? r.officer.name.toLowerCase().includes(q) || (r.item?.identifier ?? '').toLowerCase().includes(q) : true))
      .sort((a, b) => a.officer.name.localeCompare(b.officer.name, 'bs'));
  }, [w.officers, type, query]);

  const vehicles = useMemo(() => w.vehicles.filter((v) => v.kind !== 'helikopter' && v.kind !== 'specijalno'), [w.vehicles]);
  const vehIspravno = vehicles.filter((v) => v.status === 'ispravno').length;

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Naoružanje, oprema i vozila</div>
        <h1 className="font-heading text-2xl text-ink-800">Zaduženja · {session.scopeLabel}</h1>
      </div>
      <p className="mb-5 mt-1 text-sm text-ink-500">
        Svako zaduženje se vodi po serijskom broju. Razlika između ukupnog broja policajaca i izdatog
        pokazuje šta je na stanju.
      </p>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.type}
              onClick={() => setType(s.type)}
              className={`border p-4 text-left transition ${
                type === s.type ? 'border-navy-900 bg-paper-0' : 'border-paper-200 bg-paper-0 hover:border-navy-500'
              }`}
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-ink-500" />
                <span className="section-label">{s.label}</span>
              </div>
              <div className="font-mono text-2xl font-medium tabular-nums text-ink-800">{s.issued}</div>
              <div className="mt-1 text-[11px] text-ink-500">
                izdato · {s.missing > 0 ? `${s.missing} nije zaduženo` : 'svi zaduženi'}
              </div>
            </button>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="border border-paper-200 bg-paper-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-200 px-5 py-3">
            <span className="section-label">{EQUIPMENT_LABEL[type]} — po policajcu</span>
            <div className="flex items-center gap-2 border border-paper-200 bg-paper-50 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 flex-none text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ime ili serijski broj…"
                className="w-56 bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
              />
              {query ? (
                <button onClick={() => setQuery('')} aria-label="Očisti">
                  <X className="h-3.5 w-3.5 text-ink-400 hover:text-ink-700" />
                </button>
              ) : null}
            </div>
          </div>
          <div className="max-h-[52vh] overflow-y-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="sticky top-0 bg-paper-0">
                <tr className="border-b border-paper-200 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Policajac</th>
                  <th className="px-3 py-2.5 font-medium">Čin</th>
                  <th className="px-3 py-2.5 font-medium">Oznaka / serijski broj</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ officer, item }) => (
                  <tr key={officer.id} className="border-b border-paper-100 last:border-0">
                    <td className="px-5 py-2.5 font-medium text-ink-800">{officer.name}</td>
                    <td className="px-3 py-2.5 text-[11px] text-ink-500">{RANK_LABEL[officer.rank]}</td>
                    <td className="px-3 py-2.5">
                      {item ? (
                        <span className="font-mono text-xs text-ink-700">{item.identifier}</span>
                      ) : (
                        <span className="text-[11px] text-signal-warn">nije zaduženo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="flex items-center gap-1.5">
              <Car className="h-4 w-4 text-ink-500" />
              <span className="section-label">Vozila stanice</span>
            </div>
            <div className="mt-0.5 text-[11px] text-ink-500">
              {vehIspravno}/{vehicles.length} ispravno
            </div>
          </div>
          <ul className="max-h-[52vh] divide-y divide-paper-100 overflow-y-auto">
            {vehicles.map((v) => {
              const servisSoon = v.serviceDue && v.serviceDue < DEMO_TODAY;
              return (
                <li key={v.id} className="px-5 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-ink-800">{v.plate}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        v.status === 'ispravno'
                          ? 'bg-signal-ok/15 text-signal-ok'
                          : v.status === 'servis'
                            ? 'bg-signal-warn/15 text-signal-warn'
                            : 'bg-signal-alarm/15 text-signal-alarm'
                      }`}
                    >
                      {v.status === 'servis' ? <Wrench className="h-3 w-3" /> : null}
                      {v.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-500">{v.model}</div>
                  {v.registrationDue ? (
                    <div className="text-[10px] text-ink-400">
                      registracija do {formatBs(v.registrationDue)}
                      {servisSoon ? ' · servis istekao' : ''}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
