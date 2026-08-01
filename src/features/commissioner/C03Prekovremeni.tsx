import { useMemo } from 'react';
import { Bar, BarChart, Cell, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Timer, Scale, Users, Building2, AlertTriangle } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { annualOvertimeHours, annualOvertimeKM, loadedAnnualCostPerOfficer, overtimeFairness } from '../../domain/overtimeCost';
import { overtimeDistribution } from '../../domain/workTime';
import { childUnitsOf } from '../../domain/unitStats';
import { CHART_COLORS, CHART_TICK, CHART_TOOLTIP, CHART_TOOLTIP_LABEL } from '../../components/chartTheme';

// C03 — kontrola prekovremenih: koliko košta i da li je teret pravedno raspoređen.

const km = (n: number) => `${Math.round(n).toLocaleString('bs-BA')} KM`;
type Tone = 'ok' | 'warn' | 'alarm';
const DOT: Record<Tone, string> = { ok: 'bg-signal-ok', warn: 'bg-signal-warn', alarm: 'bg-signal-alarm' };
const TXT: Record<Tone, string> = { ok: 'text-signal-ok', warn: 'text-signal-warn', alarm: 'text-signal-alarm' };
const BAR: Record<'ok' | 'warn' | 'alarm', string> = { ok: CHART_COLORS.ok, warn: CHART_COLORS.warn, alarm: CHART_COLORS.alarm };

export function C03Prekovremeni() {
  const w = useScopedWorld();
  const session = useSession();
  const root = session.scopeNodeId;

  const data = useMemo(() => {
    const perOfficerCost = loadedAnnualCostPerOfficer(w);
    const units = childUnitsOf(w, root).filter((n) => n.kind === 'pu');

    const rows = units.map((node) => {
      const budget = w.finance.unitBudgets.find((b) => b.puId === node.id);
      const costKM = annualOvertimeKM(w, node.id);
      const hours = annualOvertimeHours(w, node.id);
      const fairness = overtimeFairness(w, node.id);
      const util = budget && budget.annualOvertimeKM > 0 ? Math.round((costKM / budget.annualOvertimeKM) * 100) : 0;
      return { node, costKM, hours, fairness, budgetKM: budget?.annualOvertimeKM ?? 0, util };
    });

    const totalKM = rows.reduce((s, r) => s + r.costKM, 0);
    const totalBudget = rows.reduce((s, r) => s + r.budgetKM, 0);
    const kantonFairness = overtimeFairness(w, root);

    return {
      rows,
      totalKM,
      totalBudget,
      utilTotal: totalBudget > 0 ? Math.round((totalKM / totalBudget) * 100) : 0,
      kantonFairness,
      equivalentOfficers: Math.round(totalKM / perOfficerCost),
      dist: overtimeDistribution(w, root),
    };
  }, [w, root]);

  const utilTone: Tone = data.utilTotal > 100 ? 'alarm' : data.utilTotal > 90 ? 'warn' : 'ok';
  const fairTone: Tone = data.kantonFairness.topDecileSharePct > 30 ? 'alarm' : data.kantonFairness.topDecileSharePct > 20 ? 'warn' : 'ok';

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Kontrola prekovremenih</div>
        <h1 className="font-heading text-2xl text-ink-800">Trošak i pravednost raspodjele</h1>
      </div>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-500">
        Prekovremeni rad je i trošak i pitanje pravednosti. Ako ga uvijek nose isti ljudi, to je rizik
        za zdravlje i za povjerenje u raspored — bez obzira što je budžet ispoštovan.
      </p>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Timer className="h-4 w-4" />} label="Godišnji trošak" value={km(data.totalKM)} foot={`budžet ${km(data.totalBudget)}`} />
        <Kpi icon={<Building2 className="h-4 w-4" />} label="Iskorištenost budžeta" value={`${data.utilTotal}%`} tone={utilTone} foot={data.utilTotal > 100 ? 'iznad plana' : 'u okviru plana'} />
        <Kpi icon={<Scale className="h-4 w-4" />} label="Nosi gornjih 10%" value={`${data.kantonFairness.topDecileSharePct}%`} tone={fairTone} foot="udio u ukupnim satima" />
        <Kpi icon={<Users className="h-4 w-4" />} label="U ekvivalentu plata" value={`≈ ${data.equivalentOfficers}`} foot="godišnjih plata policajca" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Po upravama</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Uprava</th>
                  <th className="px-3 py-2.5 font-medium">Trošak</th>
                  <th className="px-3 py-2.5 font-medium">Budžet</th>
                  <th className="px-3 py-2.5 font-medium">Prosjek</th>
                  <th className="px-3 py-2.5 font-medium">Gornjih 10%</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.node.id} className="border-b border-paper-100 last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink-800">{r.node.name}</div>
                      <div className="text-[11px] text-ink-500">{r.hours.toLocaleString('bs-BA')} h godišnje</div>
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-ink-800">{km(r.costKM)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 flex-none rounded-full ${DOT[r.util > 100 ? 'alarm' : r.util > 90 ? 'warn' : 'ok']}`} />
                        <span className={`font-mono tabular-nums ${r.util > 100 ? TXT.alarm : 'text-ink-800'}`}>{r.util}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-ink-700">{r.fairness.avgPerOfficer} h/mj</td>
                    <td className="px-3 py-3 font-mono tabular-nums text-ink-700">{r.fairness.topDecileSharePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.kantonFairness.overLimit > 0 ? (
            <div className="flex items-start gap-2 border-t border-paper-200 px-5 py-3 text-xs text-signal-warn">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <span>
                {data.kantonFairness.overLimit} policajaca je iznad internog limita od{' '}
                {w.targets.overtimeHoursPerOfficerMax} h mjesečno — provjeriti raspored u tim jedinicama.
              </span>
            </div>
          ) : null}
        </section>

        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Raspodjela opterećenja</div>
            <div className="font-heading text-base text-ink-800">Broj policajaca po opsegu sati</div>
          </div>
          <div className="px-4 py-5">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dist} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                  <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} cursor={{ fill: 'rgba(184,147,90,0.08)' }} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: CHART_COLORS.tickLabel, fontFamily: 'IBM Plex Mono, monospace' }} />
                    {data.dist.map((b) => (
                      <Cell key={b.label} fill={BAR[b.tone]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-ink-500">
              Zdrav raspored ima većinu u zelenim opsezima. Dugačak crveni rep znači da nekolicina nosi
              teret cijele jedinice.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, foot, tone }: { icon: React.ReactNode; label: string; value: string; foot: string; tone?: Tone }) {
  return (
    <div className="relative overflow-hidden border border-paper-200 bg-paper-0 p-4">
      {tone ? <span className={`absolute left-0 top-0 h-full w-[3px] ${DOT[tone]}`} /> : null}
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-ink-500">{icon}</span>
        <div className="section-label">{label}</div>
      </div>
      <div className={`font-mono text-2xl font-medium tabular-nums ${tone ? TXT[tone] : 'text-ink-800'}`}>{value}</div>
      <div className="mt-1 text-[11px] text-ink-500">{foot}</div>
    </div>
  );
}
