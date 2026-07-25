import { useMemo } from 'react';
import { Flame, HeartPulse, AlertTriangle, TrendingDown } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import type { Officer } from '../../data/types';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';

type WorkloadTone = 'green' | 'yellow' | 'red';

export function N03Kadar() {
  const world = useScopedWorld();

  const withIndex = useMemo(() => {
    return world.officers.map((o) => {
      const last30 = world.performance.filter((p) => p.officerId === o.id).slice(-1)[0];
      const prekov = last30?.sati.prekovremeni ?? 0;
      const nocni = last30?.sati.nocni ?? 0;
      const risk = riskScore(o, prekov, nocni);
      return { officer: o, prekov, nocni, risk };
    });
  }, [world]);

  const red = withIndex.filter((x) => x.risk === 'red').sort((a, b) => b.prekov + b.nocni - (a.prekov + a.nocni));
  const yellow = withIndex.filter((x) => x.risk === 'yellow');
  const green = withIndex.filter((x) => x.risk === 'green');
  const total = withIndex.length;

  const sickHeatmap = useMemo(() => {
    const days = ['pon', 'uto', 'sri', 'čet', 'pet', 'sub', 'ned'];
    return days.map((d, i) => ({
      day: d,
      cases: Math.max(1, Math.round((withIndex.length / 30) * (i === 0 || i === 4 ? 2.6 : 1.5))),
    }));
  }, [withIndex]);

  const highRisk = withIndex
    .map((x) => ({ ...x, riskNum: riskNumericScore(x.officer, x.prekov, x.nocni) }))
    .sort((a, b) => b.riskNum - a.riskNum)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PageHeader
        eyebrow="Briga o kadru"
        title="Ko izgara prije nego što ode"
        subtitle="Sistem predlaže razgovor kad indeks opterećenja pređe prag. Ovo nije sumnja — ovo je briga."
      />

      <section className="mb-8 grid gap-3 md:grid-cols-3">
        <IndexCard label="Zeleno" count={green.length} total={total} tone="green" />
        <IndexCard label="Žuto" count={yellow.length} total={total} tone="yellow" />
        <IndexCard label="Crveno" count={red.length} total={total} tone="red" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-4">
            <div className="section-label mb-1 text-brass-600">Za razgovor</div>
            <div className="font-heading text-lg text-ink-800">Indeks opterećenja: crveno</div>
          </div>
          <ul className="divide-y divide-paper-200">
            {red.slice(0, 8).map((r) => (
              <li key={r.officer.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-ink-800">{r.officer.name}</div>
                  <div className="text-[11px] text-ink-500">{r.officer.rank.replace('_', ' ')}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums text-ink-700">{r.prekov} h</div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400">prekovremeni</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums text-ink-700">{r.nocni} h</div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400">noćni</div>
                  </div>
                  <StatusBadge tone="alarm">crveno</StatusBadge>
                </div>
              </li>
            ))}
            {red.length === 0 && (
              <li className="px-5 py-10 text-center text-xs text-ink-400">Nema ljudi na crvenom indeksu. Dobro.</li>
            )}
          </ul>
        </section>

        <aside className="space-y-6">
          <section className="border border-paper-200 bg-paper-0">
            <div className="border-b border-paper-200 px-5 py-4">
              <div className="section-label mb-1 text-brass-600">Bolovanja</div>
              <div className="font-heading text-base text-ink-800">Po danu sedmice</div>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-7 gap-1 text-center">
                {sickHeatmap.map((h) => {
                  const intensity = Math.min(1, h.cases / 6);
                  return (
                    <div key={h.day}>
                      <div
                        className="h-14 border border-paper-200"
                        style={{ background: `rgba(184, 147, 90, ${0.15 + intensity * 0.7})` }}
                      />
                      <div className="mt-1.5 text-[10px] uppercase tracking-wider text-ink-400">{h.day}</div>
                      <div className="font-mono text-xs tabular-nums text-ink-700">{h.cases}</div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
                Obrasci pon/pet su prirodni; obrati pažnju samo na uporna odstupanja.
              </p>
            </div>
          </section>

          <section className="border border-paper-200 bg-paper-0">
            <div className="border-b border-paper-200 px-5 py-4">
              <div className="mb-1 flex items-center gap-2 text-brass-600">
                <TrendingDown className="h-3 w-3" />
                <span className="section-label">Rizik odlaska</span>
              </div>
              <div className="font-heading text-base text-ink-800">Rangirano po opterećenju</div>
            </div>
            <ul className="divide-y divide-paper-200">
              {highRisk.map((h) => (
                <li key={h.officer.id} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-ink-800">{h.officer.name}</span>
                  <span className="font-mono text-xs tabular-nums text-ink-500">{h.riskNum.toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function IndexCard({ label, count, total, tone }: { label: string; count: number; total: number; tone: WorkloadTone }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const cfg = {
    green: { border: 'border-signal-ok/30', bar: 'bg-signal-ok', accent: 'bg-signal-ok', Icon: HeartPulse, textCls: 'text-signal-ok' },
    yellow: { border: 'border-signal-warn/40', bar: 'bg-signal-warn', accent: 'bg-signal-warn', Icon: AlertTriangle, textCls: 'text-signal-warn' },
    red: { border: 'border-signal-alarm/40', bar: 'bg-signal-alarm', accent: 'bg-signal-alarm', Icon: Flame, textCls: 'text-signal-alarm' },
  }[tone];

  return (
    <div className={`relative overflow-hidden border ${cfg.border} bg-paper-0 p-5`}>
      <span className={`absolute left-0 top-0 h-full w-[3px] ${cfg.accent}`} />
      <div className={`flex items-center gap-2 ${cfg.textCls}`}>
        <cfg.Icon className="h-4 w-4" />
        <div className="section-label">{label}</div>
      </div>
      <div className={`mt-3 font-mono text-4xl font-medium tabular-nums ${cfg.textCls}`}>{count}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-400">
        {pct.toFixed(0)}% od {total} policajaca
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden bg-paper-200">
        <div className={`h-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function riskScore(officer: Officer, prekov: number, nocni: number): WorkloadTone {
  const score = riskNumericScore(officer, prekov, nocni);
  if (score >= 65) return 'red';
  if (score >= 40) return 'yellow';
  return 'green';
}

function riskNumericScore(officer: Officer, prekov: number, nocni: number): number {
  let s = prekov * 2 + nocni * 0.4;
  if (officer.status === 'bolovanje') s += 25;
  return Math.min(99, s);
}

