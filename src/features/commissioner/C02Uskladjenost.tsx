import { useMemo } from 'react';
import { Bar, BarChart, Cell, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, AlertTriangle, Clock, Moon, Building2 } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { childUnitsOf, LAST_COMPLETE_MONTH } from '../../domain/unitStats';
import { overtimeDistribution, workTimeStat } from '../../domain/workTime';
import { CHART_COLORS, CHART_TICK, CHART_TOOLTIP, CHART_TOOLTIP_LABEL } from '../../components/chartTheme';

const MONTHS_BS = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
const monthLabel = (ym: string) => `${MONTHS_BS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}.`;

type Tone = 'ok' | 'warn' | 'alarm';
const DOT: Record<Tone, string> = { ok: 'bg-signal-ok', warn: 'bg-signal-warn', alarm: 'bg-signal-alarm' };
const TXT: Record<Tone, string> = { ok: 'text-signal-ok', warn: 'text-signal-warn', alarm: 'text-signal-alarm' };
const BAR: Record<Tone, string> = { ok: CHART_COLORS.ok, warn: CHART_COLORS.warn, alarm: CHART_COLORS.alarm };

export function C02Uskladjenost() {
  const w = useScopedWorld();
  const session = useSession();
  const root = session.scopeNodeId;

  const summary = useMemo(() => workTimeStat(w, root), [w, root]);
  const perPu = useMemo(
    () => childUnitsOf(w, root).map((c) => workTimeStat(w, c.id)).sort((a, b) => a.compliancePct - b.compliancePct),
    [w, root],
  );
  const dist = useMemo(() => overtimeDistribution(w, root), [w, root]);

  const complianceTone: Tone = summary.compliancePct >= 90 ? 'ok' : summary.compliancePct >= 75 ? 'warn' : 'alarm';
  const compliancePuTone = (v: number): Tone => (v >= 90 ? 'ok' : v >= 75 ? 'warn' : 'alarm');
  const weeklyTone: Tone = summary.avgWeeklyHours <= w.restRules.maxWeeklyHours * 0.9 ? 'ok' : summary.avgWeeklyHours <= w.restRules.maxWeeklyHours ? 'warn' : 'alarm';

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-1 flex items-baseline justify-between">
        <div>
          <div className="section-label text-brass-600">Usklađenost radnog vremena</div>
          <h1 className="font-heading text-2xl text-ink-800">Zaštita odmora i radnog vremena</h1>
        </div>
        <div className="font-mono text-xs text-ink-500">Period: {monthLabel(LAST_COMPLETE_MONTH)}</div>
      </div>
      <p className="mb-6 mt-2 max-w-3xl text-sm text-ink-500">
        EU direktiva o radnom vremenu: maksimalno {w.restRules.maxWeeklyHours} h sedmično, minimum{' '}
        {w.restRules.minRestHours} h odmora između smjena, najviše {w.restRules.maxConsecutiveNights} uzastopne
        noćne. Interni limit prekovremenih: {w.targets.overtimeHoursPerOfficerMax} h/mjesec. Crveno označava
        stvarno prekoračenje.
      </p>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="U skladu s pravilima" value={`${summary.compliancePct}%`} tone={complianceTone} foot={`${summary.compliant}/${summary.withData} policajaca`} />
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Prekoračenja" value={summary.breached} tone={summary.breached > 0 ? 'alarm' : 'ok'} foot={`+ ${summary.atRisk} na granici`} />
        <Kpi icon={<Clock className="h-4 w-4" />} label="Prosj. sedmično radno vrijeme" value={`${summary.avgWeeklyHours} h`} tone={weeklyTone} foot={`od maks. ${w.restRules.maxWeeklyHours} h`} />
        <Kpi icon={<Moon className="h-4 w-4" />} label="Udio noćnog rada" value={`${summary.nightSharePct}%`} tone={summary.nightSharePct > 40 ? 'warn' : undefined} foot="prosjek po policajcu" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Per-PU compliance */}
        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Po upravama — rangirano po usklađenosti</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Jedinica</th>
                  <th className="px-3 py-2.5 font-medium">U skladu</th>
                  <th className="px-3 py-2.5 font-medium">Iznad limita OT</th>
                  <th className="px-3 py-2.5 font-medium">Prekoračenja</th>
                  <th className="px-3 py-2.5 font-medium">Noćni</th>
                </tr>
              </thead>
              <tbody>
                {perPu.map((s) => (
                  <tr key={s.node.id} className="border-b border-paper-100 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-none items-center justify-center bg-navy-900 text-paper-50">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="font-medium text-ink-800">{s.node.name}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 flex-none rounded-full ${DOT[compliancePuTone(s.compliancePct)]}`} />
                        <span className="font-mono tabular-nums text-ink-800">{s.compliancePct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-ink-700">{s.otOverLimit}</td>
                    <td className={`px-3 py-3 font-mono tabular-nums ${s.breached > 0 ? TXT.alarm : 'text-ink-700'}`}>{s.breached}</td>
                    <td className="px-3 py-3 font-mono tabular-nums text-ink-700">{s.nightSharePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Overtime distribution histogram */}
        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Raspodjela prekovremenih sati</div>
            <div className="font-heading text-base text-ink-800">Broj policajaca po opsegu ({monthLabel(LAST_COMPLETE_MONTH).split(' ')[0]})</div>
          </div>
          <div className="px-4 py-5">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                  <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} cursor={{ fill: 'rgba(184,147,90,0.08)' }} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: CHART_COLORS.tickLabel, fontFamily: 'IBM Plex Mono, monospace' }} />
                    {dist.map((b) => (
                      <Cell key={b.label} fill={BAR[b.tone]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-ink-500">
              Interni limit je {w.targets.overtimeHoursPerOfficerMax} h/mjesec — narandžasto je na granici, crveno prekoračuje.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  foot,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  foot: string;
  tone?: Tone;
}) {
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
