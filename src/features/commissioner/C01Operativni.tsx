import { useMemo, useState } from 'react';
import {
  Building2,
  ChevronRight,
  Users,
  Timer,
  HeartPulse,
  ShieldCheck,
  Activity,
  TrendingUp,
  TrendingDown,
  CornerDownRight,
} from 'lucide-react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import {
  childUnitsOf,
  hasChildUnits,
  monthlyIntervencije,
  pathFromRoot,
  unitStat,
  LAST_COMPLETE_MONTH,
} from '../../domain/unitStats';
import { CHART_COLORS, CHART_TICK, CHART_TOOLTIP, CHART_TOOLTIP_LABEL } from '../../components/chartTheme';

const MONTHS_BS = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
const monthLabel = (ym: string) => `${MONTHS_BS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}.`;

type Tone = 'ok' | 'warn' | 'alarm';
const DOT: Record<Tone, string> = { ok: 'bg-signal-ok', warn: 'bg-signal-warn', alarm: 'bg-signal-alarm' };
const TXT: Record<Tone, string> = { ok: 'text-signal-ok', warn: 'text-signal-warn', alarm: 'text-signal-alarm' };

const km = (n: number) => `${Math.round(n).toLocaleString('bs-BA')} KM`;

export function C01Operativni() {
  const w = useScopedWorld();
  const session = useSession();
  const root = session.scopeNodeId;
  const [focusId, setFocusId] = useState(root);

  const targets = w.targets;
  const coverageTone = (v: number): Tone => (v >= targets.coveragePct ? 'ok' : v >= targets.coveragePct - 10 ? 'warn' : 'alarm');
  const sickTone = (v: number): Tone => (v <= targets.sickLeavePctMax ? 'ok' : v <= targets.sickLeavePctMax * 1.6 ? 'warn' : 'alarm');
  const certTone = (v: number): Tone => (v >= targets.certValidityPct ? 'ok' : v >= 90 ? 'warn' : 'alarm');

  const summary = useMemo(() => unitStat(w, focusId), [w, focusId]);
  const rows = useMemo(
    () => childUnitsOf(w, focusId).map((c) => unitStat(w, c.id)).sort((a, b) => a.coveragePct - b.coveragePct),
    [w, focusId],
  );
  const crumbs = useMemo(() => pathFromRoot(w, focusId, root), [w, focusId, root]);
  const trend = useMemo(() => monthlyIntervencije(w, focusId), [w, focusId]);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-1 flex items-baseline justify-between">
        <div>
          <div className="section-label text-brass-600">Operativni pregled · Compstat</div>
          <h1 className="font-heading text-2xl text-ink-800">Od Kantona do konkretne smjene u tri klika</h1>
        </div>
        <div className="font-mono text-xs text-ink-500">
          Period: {monthLabel(LAST_COMPLETE_MONTH)} · Δ prema prethodnom mjesecu
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-5 mt-3 flex flex-wrap items-center gap-1 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={c.id} className="flex items-center gap-1">
              <button
                onClick={() => setFocusId(c.id)}
                disabled={last}
                className={last ? 'font-medium text-ink-800' : 'text-ink-500 transition hover:text-brass-600'}
              >
                {c.id === root ? 'Kanton' : c.name}
              </button>
              {last ? null : <ChevronRight className="h-3.5 w-3.5 text-paper-400" />}
            </span>
          );
        })}
      </nav>

      {/* Summary KPIs for focus */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi icon={<Users className="h-4 w-4" />} label="Popunjenost" value={`${summary.coveragePct}%`} tone={coverageTone(summary.coveragePct)} foot={`${summary.active}/${summary.establishment} · cilj ${targets.coveragePct}%`} />
        <Kpi icon={<Timer className="h-4 w-4" />} label={`Prekovremeni · ${monthLabel(LAST_COMPLETE_MONTH).split(' ')[0]}`} value={km(summary.otKM)} foot={`${summary.otHours} h`} pop={{ v: summary.otHours, prev: summary.otHoursPrev, good: 'down' }} />
        <Kpi icon={<HeartPulse className="h-4 w-4" />} label="Bolovanja" value={`${summary.sickPct}%`} tone={sickTone(summary.sickPct)} foot={`${summary.bolovanje} osoba · cilj ≤${targets.sickLeavePctMax}%`} />
        <Kpi icon={<ShieldCheck className="h-4 w-4" />} label="Certifikati" value={`${summary.certValidPct}%`} tone={certTone(summary.certValidPct)} foot={`važeći · cilj ${targets.certValidityPct}%`} />
        <Kpi icon={<Activity className="h-4 w-4" />} label="Intervencije" value={summary.intervencije.toLocaleString('bs-BA')} foot="zadnji mjesec" pop={{ v: summary.intervencije, prev: summary.intervencijePrev, good: 'up' }} />
      </section>

      {/* Compstat table */}
      <section className="mb-6 border border-paper-200 bg-paper-0">
        <div className="flex items-center justify-between border-b border-paper-200 px-5 py-3">
          <div className="section-label text-brass-600">Jedinice — rangirano po popunjenosti</div>
          <div className="text-[11px] text-ink-400">{rows.length > 0 ? 'Klikni jedinicu za razradu' : 'Najniži nivo'}</div>
        </div>
        {rows.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-8 text-sm text-ink-500">
            <CornerDownRight className="h-4 w-4 text-paper-400" />
            Ovo je najniži nivo razrade ({summary.headcount} policajaca). Vrati se kroz putanju iznad.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Jedinica</th>
                  <th className="px-3 py-2.5 font-medium">Popunjenost</th>
                  <th className="px-3 py-2.5 font-medium">Prekovremeni ({monthLabel(LAST_COMPLETE_MONTH).split(' ')[0]})</th>
                  <th className="px-3 py-2.5 font-medium">Bolovanja</th>
                  <th className="px-3 py-2.5 font-medium">Certifikati</th>
                  <th className="px-3 py-2.5 font-medium">Intervencije</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const drillable = hasChildUnits(w, s.node.id);
                  return (
                    <tr
                      key={s.node.id}
                      onClick={drillable ? () => setFocusId(s.node.id) : undefined}
                      className={`border-b border-paper-100 last:border-0 ${drillable ? 'cursor-pointer transition hover:bg-paper-50' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-none items-center justify-center bg-navy-900 text-paper-50">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-ink-800">{s.node.name}</div>
                            <div className="text-[11px] text-ink-500">{s.headcount} policajaca</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><Cell tone={coverageTone(s.coveragePct)} value={`${s.coveragePct}%`} /></td>
                      <td className="px-3 py-3"><PopCell value={km(s.otKM)} v={s.otHours} prev={s.otHoursPrev} good="down" /></td>
                      <td className="px-3 py-3"><Cell tone={sickTone(s.sickPct)} value={`${s.sickPct}%`} /></td>
                      <td className="px-3 py-3"><Cell tone={certTone(s.certValidPct)} value={`${s.certValidPct}%`} /></td>
                      <td className="px-3 py-3"><PopCell value={s.intervencije.toLocaleString('bs-BA')} v={s.intervencije} prev={s.intervencijePrev} good="up" /></td>
                      <td className="px-3 py-3 text-right">
                        {drillable ? <ChevronRight className="ml-auto h-4 w-4 text-paper-400" /> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Trend for focus scope */}
      <section className="border border-paper-200 bg-paper-0">
        <div className="border-b border-paper-200 px-5 py-3">
          <div className="section-label text-brass-600">Trend intervencija · {crumbs[crumbs.length - 1].id === root ? 'Kanton' : crumbs[crumbs.length - 1].name}</div>
          <div className="font-heading text-base text-ink-800">Učinak po mjesecima (2026.)</div>
        </div>
        <div className="px-4 py-5">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 4, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} cursor={{ stroke: CHART_COLORS.grid }} />
                <Line type="monotone" dataKey="value" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 2, fill: CHART_COLORS.primary }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  foot,
  tone,
  pop,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  foot: string;
  tone?: Tone;
  pop?: { v: number; prev: number; good: 'up' | 'down' };
}) {
  return (
    <div className="relative overflow-hidden border border-paper-200 bg-paper-0 p-4">
      {tone ? <span className={`absolute left-0 top-0 h-full w-[3px] ${DOT[tone]}`} /> : null}
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-ink-500">{icon}</span>
        <div className="section-label">{label}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className={`font-mono text-2xl font-medium tabular-nums ${tone ? TXT[tone] : 'text-ink-800'}`}>{value}</div>
        {pop ? <Pop v={pop.v} prev={pop.prev} good={pop.good} /> : null}
      </div>
      <div className="mt-1 text-[11px] text-ink-500">{foot}</div>
    </div>
  );
}

function Cell({ tone, value }: { tone: Tone; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 flex-none rounded-full ${DOT[tone]}`} />
      <span className="font-mono tabular-nums text-ink-800">{value}</span>
    </div>
  );
}

function PopCell({ value, v, prev, good }: { value: string; v: number; prev: number; good: 'up' | 'down' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono tabular-nums text-ink-800">{value}</span>
      <Pop v={v} prev={prev} good={good} />
    </div>
  );
}

function Pop({ v, prev, good }: { v: number; prev: number; good: 'up' | 'down' }) {
  if (prev === 0 && v === 0) return null;
  const diff = v - prev;
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : v > 0 ? 100 : 0;
  if (pct === 0) return <span className="text-[11px] text-ink-400">–</span>;
  const up = diff > 0;
  const isGood = good === 'up' ? up : !up;
  const color = isGood ? 'text-signal-ok' : 'text-signal-alarm';
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-medium ${color}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}
      {pct}%
    </span>
  );
}
