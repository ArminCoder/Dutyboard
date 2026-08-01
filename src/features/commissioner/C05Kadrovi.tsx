import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, UserMinus, CalendarClock, TrendingDown, Building2 } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { agePyramid, averageAge, averageService, retirementCliff, staffingByUnit, PENSION_AGE, PENSION_SERVICE_YEARS } from '../../domain/workforce';
import { CHART_COLORS, CHART_TICK, CHART_TOOLTIP, CHART_TOOLTIP_LABEL } from '../../components/chartTheme';

// C05 — kadrovska projekcija: ko odlazi, koliko fali, koga treba zaposliti.
// Isključivo zbirni podaci, bez ličnih imena.

export function C05Kadrovi() {
  const w = useScopedWorld();
  const session = useSession();
  const root = session.scopeNodeId;

  const pyramid = useMemo(() => agePyramid(w, root), [w, root]);
  const cliff = useMemo(() => retirementCliff(w, root), [w, root]);
  const staffing = useMemo(() => staffingByUnit(w, root), [w, root]);

  const totalRetiring = cliff[cliff.length - 1]?.cumulative ?? 0;
  const totalVacancies = staffing.reduce((s, r) => s + r.vacancies, 0);
  const totalNeed = staffing.reduce((s, r) => s + r.hiringNeed, 0);
  const headcount = w.officers.length;

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Kadrovska projekcija</div>
        <h1 className="font-heading text-2xl text-ink-800">Ko odlazi i koga treba zaposliti</h1>
      </div>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-500">
        Uslov za penziju: {PENSION_AGE} godina života ili {PENSION_SERVICE_YEARS} godina staža — šta prije
        nastupi. Prikazuju se isključivo zbirni podaci.
      </p>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Users className="h-4 w-4" />} label="Ukupno policajaca" value={String(headcount)} foot={`prosjek ${averageAge(w, root)} god.`} />
        <Kpi icon={<CalendarClock className="h-4 w-4" />} label="Prosječan staž" value={`${averageService(w, root)} god.`} foot="u službi" />
        <Kpi icon={<UserMinus className="h-4 w-4" />} label="Odlazak u penziju" value={String(totalRetiring)} foot="u naredna 24 mjeseca" tone={totalRetiring > 0 ? 'warn' : undefined} />
        <Kpi icon={<TrendingDown className="h-4 w-4" />} label="Potreba za prijemom" value={String(totalNeed)} foot={`${totalVacancies} upražnjenih + odlasci`} tone={totalNeed > 10 ? 'warn' : undefined} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Starosna struktura</div>
            <div className="font-heading text-base text-ink-800">Broj policajaca po dobnim grupama</div>
          </div>
          <div className="px-4 py-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pyramid} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_COLORS.grid} horizontal={false} />
                  <XAxis type="number" tick={CHART_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={CHART_TICK} axisLine={false} tickLine={false} width={48} />
                  <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} cursor={{ fill: 'rgba(184,147,90,0.08)' }} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 2, 2, 0]}>
                    <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: CHART_COLORS.tickLabel, fontFamily: 'IBM Plex Mono, monospace' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Penzioni greben</div>
            <div className="font-heading text-base text-ink-800">Sticanje uslova po polugodištima</div>
          </div>
          <div className="px-4 py-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cliff} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                  <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} cursor={{ fill: 'rgba(184,147,90,0.08)' }} />
                  <Bar dataKey="count" name="Stiče uslov" fill={CHART_COLORS.secondary} radius={[2, 2, 0, 0]}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: CHART_COLORS.tickLabel, fontFamily: 'IBM Plex Mono, monospace' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-ink-500">
              Ukupno {totalRetiring} u naredna 24 mjeseca. Prijem i obuka traju mjesecima — zato se
              planira unaprijed, a ne kad mjesto ostane prazno.
            </p>
          </div>
        </section>
      </div>

      <section className="mt-6 border border-paper-200 bg-paper-0">
        <div className="border-b border-paper-200 px-5 py-3">
          <div className="section-label text-brass-600">Sistematizacija i potreba po upravama</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-left text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-5 py-2.5 font-medium">Uprava</th>
                <th className="px-3 py-2.5 font-medium">Sistematizacija</th>
                <th className="px-3 py-2.5 font-medium">Stvarno stanje</th>
                <th className="px-3 py-2.5 font-medium">Popunjenost</th>
                <th className="px-3 py-2.5 font-medium">Upražnjeno</th>
                <th className="px-3 py-2.5 font-medium">Penzija 24 mj.</th>
                <th className="px-3 py-2.5 font-medium">Potreba za prijemom</th>
              </tr>
            </thead>
            <tbody>
              {staffing.map((r) => (
                <tr key={r.node.id} className="border-b border-paper-100 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-none items-center justify-center bg-navy-900 text-paper-50">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-ink-800">{r.node.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-600">{r.establishment}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-800">{r.actual}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 flex-none rounded-full ${r.fillPct >= 95 ? 'bg-signal-ok' : r.fillPct >= 85 ? 'bg-signal-warn' : 'bg-signal-alarm'}`} />
                      <span className="font-mono tabular-nums text-ink-800">{r.fillPct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-700">{r.vacancies}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-700">{r.retiring24m}</td>
                  <td className="px-3 py-3 font-mono text-base font-medium tabular-nums text-ink-800">{r.hiringNeed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon, label, value, foot, tone }: { icon: React.ReactNode; label: string; value: string; foot: string; tone?: 'warn' }) {
  return (
    <div className="relative overflow-hidden border border-paper-200 bg-paper-0 p-4">
      {tone === 'warn' ? <span className="absolute left-0 top-0 h-full w-[3px] bg-signal-warn" /> : null}
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-ink-500">{icon}</span>
        <div className="section-label">{label}</div>
      </div>
      <div className={`font-mono text-2xl font-medium tabular-nums ${tone === 'warn' ? 'text-signal-warn' : 'text-ink-800'}`}>{value}</div>
      <div className="mt-1 text-[11px] text-ink-500">{foot}</div>
    </div>
  );
}
