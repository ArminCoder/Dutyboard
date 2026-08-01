import { useMemo } from 'react';
import { Printer, Activity, ShieldAlert, FileText, AlertCircle } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useStore } from '../../app/store';
import { DEMO_TODAY, addDays, formatBs, longBs } from '../../data/generator/dates';
import { KDD_TYPE_LABEL } from '../../data/types';

// Jutarnji brifing — OKC sabira biltene noćne smjene i otvorene upise iz knjige
// događaja u jedan pregled za komesara. Isti ekran koristi OKC i komesar.

export function JutarnjiBilten({ dark = false }: { dark?: boolean }) {
  const w = useScopedWorld();
  const store = useStore();
  const noc = addDays(DEMO_TODAY, -1);

  const stations = useMemo(() => w.orgNodes.filter((n) => n.kind === 'ps'), [w.orgNodes]);
  const allowed = useMemo(() => new Set(stations.map((s) => s.id)), [stations]);

  const rows = useMemo(
    () =>
      stations.map((st) => ({
        station: st,
        bilten: store.biltens.find((b) => b.psId === st.id && b.shiftDate === noc && b.shiftKind === 'II'),
      })),
    [stations, store.biltens, noc],
  );

  const totals = rows.reduce(
    (acc, r) => ({
      dogadjaji: acc.dogadjaji + (r.bilten?.counts.dogadjaji ?? 0),
      intervencije: acc.intervencije + (r.bilten?.counts.intervencije ?? 0),
      prekrsajniNalozi: acc.prekrsajniNalozi + (r.bilten?.counts.prekrsajniNalozi ?? 0),
    }),
    { dogadjaji: 0, intervencije: 0, prekrsajniNalozi: 0 },
  );

  const missing = rows.filter((r) => !r.bilten);

  const openEntries = useMemo(
    () =>
      store.kddEntries
        .filter((e) => allowed.has(e.psId) && e.status !== 'zakljucen')
        .sort((a, b) => b.when.localeCompare(a.when))
        .slice(0, 6),
    [store.kddEntries, allowed],
  );

  const t = dark
    ? { page: 'text-dark-text', card: 'border-dark-border bg-dark-surface', muted: 'text-dark-muted', head: 'text-dark-text' }
    : { page: 'text-ink-800', card: 'border-paper-200 bg-paper-0', muted: 'text-ink-500', head: 'text-ink-800' };

  return (
    <div className={t.page}>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3 print:hidden ${t.card}`}>
        <div>
          <div className="section-label text-brass-500">Jutarnji brifing</div>
          <h1 className={`font-heading text-lg ${t.head}`}>Izvještaj za komesara · {longBs(DEMO_TODAY)}</h1>
        </div>
        <button
          onClick={() => window.print()}
          className={`inline-flex items-center gap-2 border px-3 py-1.5 text-sm transition ${
            dark
              ? 'border-dark-border bg-dark-elevated text-dark-text hover:border-brass-500'
              : 'border-paper-300 bg-paper-0 text-ink-700 hover:border-brass-500'
          }`}
        >
          <Printer className="h-4 w-4" />
          Štampaj
        </button>
      </div>

      <div className="space-y-5 px-6 py-5">
        <section className={`border p-5 ${t.card}`}>
          <div className="section-label mb-3 text-brass-500">
            Zbirno — noćna smjena {formatBs(noc)}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Total icon={<Activity className="h-4 w-4" />} label="Događaji" value={totals.dogadjaji} dark={dark} />
            <Total icon={<ShieldAlert className="h-4 w-4" />} label="Intervencije" value={totals.intervencije} dark={dark} />
            <Total icon={<FileText className="h-4 w-4" />} label="Prekršajni nalozi" value={totals.prekrsajniNalozi} dark={dark} />
          </div>
          {missing.length > 0 ? (
            <p className="mt-3 text-[11px] text-signal-warn">
              Nedostaje bilten: {missing.map((m) => m.station.name).join(', ')}. Zbir je nepotpun.
            </p>
          ) : null}
        </section>

        <section className={`border ${t.card}`}>
          <div className="border-b border-dark-border/30 px-5 py-3">
            <div className="section-label text-brass-500">Po stanicama</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className={`border-b border-dark-border/30 text-left text-[10px] uppercase tracking-wider ${t.muted}`}>
                  <th className="px-5 py-2.5 font-medium">Stanica</th>
                  <th className="px-3 py-2.5 font-medium">Događaji</th>
                  <th className="px-3 py-2.5 font-medium">Intervencije</th>
                  <th className="px-3 py-2.5 font-medium">Nalozi</th>
                  <th className="px-3 py-2.5 font-medium">Napomena</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.station.id} className="border-b border-dark-border/20 last:border-0">
                    <td className={`px-5 py-2.5 font-medium ${t.head}`}>{r.station.name}</td>
                    {r.bilten ? (
                      <>
                        <td className="px-3 py-2.5 font-mono tabular-nums">{r.bilten.counts.dogadjaji}</td>
                        <td className="px-3 py-2.5 font-mono tabular-nums">{r.bilten.counts.intervencije}</td>
                        <td className="px-3 py-2.5 font-mono tabular-nums">{r.bilten.counts.prekrsajniNalozi}</td>
                        <td className={`px-3 py-2.5 text-xs ${t.muted}`}>{r.bilten.note ?? '—'}</td>
                      </>
                    ) : (
                      <td colSpan={4} className="px-3 py-2.5 text-xs text-signal-warn">
                        Bilten nije dostavljen.
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`border ${t.card}`}>
          <div className="border-b border-dark-border/30 px-5 py-3">
            <div className="section-label text-brass-500">Nezaključeni upisi iz knjige događaja</div>
          </div>
          {openEntries.length === 0 ? (
            <div className={`px-5 py-6 text-sm ${t.muted}`}>Nema nezaključenih upisa.</div>
          ) : (
            <ul className="divide-y divide-dark-border/20">
              {openEntries.map((e) => (
                <li key={e.id} className="flex items-start gap-3 px-5 py-2.5">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none text-signal-warn" />
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm ${t.head}`}>{e.description}</div>
                    <div className={`text-[11px] ${t.muted}`}>
                      {e.when.slice(11, 16)} · {KDD_TYPE_LABEL[e.type]}
                      {e.assignedPatrol ? ` · ${e.assignedPatrol}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Total({ icon, label, value, dark }: { icon: React.ReactNode; label: string; value: number; dark: boolean }) {
  return (
    <div className={`border p-4 ${dark ? 'border-dark-border bg-dark-elevated/40' : 'border-paper-200 bg-paper-50'}`}>
      <div className={`mb-1 flex items-center gap-1.5 ${dark ? 'text-dark-muted' : 'text-ink-500'}`}>
        {icon}
        <span className="section-label">{label}</span>
      </div>
      <div className={`font-mono text-3xl font-medium tabular-nums ${dark ? 'text-dark-text' : 'text-ink-800'}`}>{value}</div>
    </div>
  );
}
