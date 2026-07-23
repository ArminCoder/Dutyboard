import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { world } from '../../data/world';
import { useSoftić } from './useOfficer';

const MONTH_SHORT_BS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];

export function P03Statistika() {
  const officer = useSoftić();

  const my = useMemo(
    () =>
      world.performance
        .filter((p) => p.officerId === officer.id)
        .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
    [officer.id],
  );

  const totals = useMemo(() => {
    const acc = { hapsenja: 0, prekrsajni: 0, intervencije: 0, asistencije: 0, redovni: 0, nocni: 0, prekovremeni: 0, sud: 0 };
    for (const p of my) {
      acc.hapsenja += p.hapsenja;
      acc.prekrsajni += p.prekrsajni;
      acc.intervencije += p.intervencije;
      acc.asistencije += p.asistencije;
      acc.redovni += p.sati.redovni;
      acc.nocni += p.sati.nocni;
      acc.prekovremeni += p.sati.prekovremeni;
      acc.sud += p.sati.sud;
    }
    return acc;
  }, [my]);

  const chartData = useMemo(
    () =>
      my.map((p) => {
        const monthIdx = Number(p.yearMonth.slice(-2)) - 1;
        return {
          label: MONTH_SHORT_BS[monthIdx],
          hapsenja: p.hapsenja,
          intervencije: p.intervencije,
          prekrsajni: p.prekrsajni,
        };
      }),
    [my],
  );

  const trend = trendFor(my.map((p) => p.intervencije));

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400">Posljednjih 12 mjeseci</div>
        <h1 className="mt-0.5 text-xl font-semibold text-ink-900">Moja statistika</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Hapšenja" value={totals.hapsenja} />
        <KpiCard label="Prekršajni nalozi" value={totals.prekrsajni} />
        <KpiCard label="Intervencije" value={totals.intervencije} trend={trend} />
        <KpiCard label="Asistencije" value={totals.asistencije} />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Aktivnost po mjesecima</h2>
          <div className="flex items-center gap-3 text-[10px] text-ink-500">
            <LegendDot color="bg-ink-900" label="intervencije" />
            <LegendDot color="bg-ink-400" label="hapšenja" />
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7788a0' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#7788a0' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #d3dbe6' }}
                labelStyle={{ color: '#0d1424', fontWeight: 600 }}
              />
              <Bar dataKey="intervencije" fill="#0d1424" radius={[4, 4, 0, 0]} />
              <Bar dataKey="hapsenja" fill="#7788a0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Sati (godišnje)</h2>
        <ul className="divide-y divide-ink-100">
          <HoursRow label="Redovni rad" value={totals.redovni} />
          <HoursRow label="Noćni rad" value={totals.nocni} />
          <HoursRow label="Prekovremeni" value={totals.prekovremeni} />
          <HoursRow label="Sati sa suda" value={totals.sud} accent />
        </ul>
      </section>

      <div className="flex items-start gap-2 rounded-xl bg-ink-100 p-3 text-xs text-ink-600">
        <Info className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          Statistika služi tebi. Komandiri vide agregate po jedinici — nikad pojedinačna imena ako to nije potrebno za dodjelu zadataka.
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'flat';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendCls =
    trend === 'up' ? 'text-signal-ok' : trend === 'down' ? 'text-signal-alarm' : 'text-ink-400';

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
      <div className="text-xs uppercase tracking-wider text-ink-400">{label}</div>
      <div className="mt-1 flex items-end justify-between">
        <div className="text-2xl font-semibold text-ink-900">{value}</div>
        {trend ? <TrendIcon className={`h-4 w-4 ${trendCls}`} /> : null}
      </div>
    </div>
  );
}

function HoursRow({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <span className={`text-sm ${accent ? 'font-medium text-ink-900' : 'text-ink-700'}`}>{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-ink-900' : 'text-ink-800'}`}>
        {value} h
      </span>
    </li>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded ${color}`} />
      <span>{label}</span>
    </span>
  );
}

function trendFor(series: number[]): 'up' | 'down' | 'flat' {
  if (series.length < 4) return 'flat';
  const half = Math.floor(series.length / 2);
  const first = average(series.slice(0, half));
  const second = average(series.slice(half));
  const diff = second - first;
  if (diff > first * 0.05) return 'up';
  if (diff < -first * 0.05) return 'down';
  return 'flat';
}

function average(nums: number[]): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}
