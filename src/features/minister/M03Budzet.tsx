import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Printer, Wallet, Timer, PiggyBank, Users, Building2, GraduationCap, TrendingUp } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { descendantsOf } from '../../data/generator/org';
import { ACADEMY, academyRevenue } from '../../data/academy';
import { documentFeeRevenue } from '../../data/administration';
import { useStore } from '../../app/store';
import { Button } from '../../components/Button';
import { CHART_COLORS, CHART_TICK, CHART_TOOLTIP, CHART_TOOLTIP_LABEL } from '../../components/chartTheme';
import { LAST_COMPLETE_MONTH } from '../../domain/unitStats';

const km = (n: number) => `${Math.round(n).toLocaleString('bs-BA')} KM`;
const kmShort = (n: number) => `${(n / 1000).toFixed(0)}k`;

type Tone = 'ok' | 'warn' | 'alarm';
const DOT: Record<Tone, string> = { ok: 'bg-signal-ok', warn: 'bg-signal-warn', alarm: 'bg-signal-alarm' };
const TXT: Record<Tone, string> = { ok: 'text-signal-ok', warn: 'text-signal-warn', alarm: 'text-signal-alarm' };

export function M03Budzet() {
  const w = useScopedWorld();
  const { documentRequests } = useStore();
  const docFees = useMemo(() => documentFeeRevenue(documentRequests), [documentRequests]);

  const data = useMemo(() => {
    const rate = w.finance.overtimeRateKM;
    const loadedPerOfficer = Math.round(w.finance.avgMonthlyBaseKM * 12 * 1.5);

    const p2026 = w.performance.filter((p) => p.yearMonth.startsWith('2026'));
    const months = new Set(p2026.map((p) => p.yearMonth)).size || 1;

    const annualOtKM = (nodeId: string) => {
      const inScope = descendantsOf(w.orgNodes, nodeId);
      const ids = new Set(w.officers.filter((o) => inScope.has(o.orgNodeId)).map((o) => o.id));
      const h = p2026.filter((p) => ids.has(p.officerId)).reduce((s, p) => s + p.sati.prekovremeni, 0);
      return Math.round((h / months) * 12 * rate);
    };

    const rows = w.finance.unitBudgets.map((ub) => {
      const pu = w.orgNodes.find((n) => n.id === ub.puId)!;
      const inScope = descendantsOf(w.orgNodes, ub.puId);
      const headcount = w.officers.filter((o) => inScope.has(o.orgNodeId)).length;
      const otActual = annualOtKM(ub.puId);
      const personnelActual = headcount * loadedPerOfficer;
      const otUtil = ub.annualOvertimeKM > 0 ? Math.round((otActual / ub.annualOvertimeKM) * 100) : 0;
      return {
        pu,
        headcount,
        personnelBudget: ub.annualPersonnelKM,
        personnelActual,
        otBudget: ub.annualOvertimeKM,
        otActual,
        otUtil,
        perOfficer: headcount > 0 ? Math.round((personnelActual + otActual) / headcount) : 0,
      };
    });

    const totalPersonnelActual = rows.reduce((s, r) => s + r.personnelActual, 0);
    const totalOtActual = rows.reduce((s, r) => s + r.otActual, 0);
    const totalOtBudget = rows.reduce((s, r) => s + r.otBudget, 0);
    const totalPersonnelBudget = rows.reduce((s, r) => s + r.personnelBudget, 0);
    const totalHeadcount = rows.reduce((s, r) => s + r.headcount, 0);
    const totalCost = totalPersonnelActual + totalOtActual;
    // Trošak prekovremenih izražen u ekvivalentu plata — argument za zapošljavanje.
    const equivalentOfficers = Math.round(totalOtActual / loadedPerOfficer);

    // Vlastiti prihod — MUP Akademija (pretplata na edukaciju/provjeru znanja).
    // Deterministički izveden iz broja policajaca; umanjuje neto trošak ljudstva.
    const academy = academyRevenue(totalHeadcount);

    return {
      rows,
      totalPersonnelActual,
      totalOtActual,
      totalOtBudget,
      totalPersonnelBudget,
      totalHeadcount,
      totalCost,
      academy,
      otPct: totalCost > 0 ? +((totalOtActual / totalCost) * 100).toFixed(1) : 0,
      otUtilTotal: totalOtBudget > 0 ? Math.round((totalOtActual / totalOtBudget) * 100) : 0,
      perCapita: totalHeadcount > 0 ? Math.round(totalCost / totalHeadcount) : 0,
      equivalentOfficers,
    };
  }, [w]);

  const chartData = data.rows.map((r) => ({ label: r.pu.name.replace('PU ', ''), budzet: r.otBudget, trosak: r.otActual }));
  const otTotTone: Tone = data.otUtilTotal > 100 ? 'alarm' : data.otUtilTotal > 90 ? 'warn' : 'ok';
  const puOtTone = (util: number): Tone => (util > 100 ? 'alarm' : util > 90 ? 'warn' : 'ok');

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 print:py-0">
      <div className="mb-6 flex items-start justify-between print:hidden">
        <div>
          <div className="section-label text-brass-600">Budžet i troškovi ljudstva</div>
          <h1 className="font-heading text-2xl text-ink-800">Godišnji trošak ljudstva Uprave policije</h1>
        </div>
        <Button variant="primary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
          Izvezi u PDF
        </Button>
      </div>

      {/* Cover (print) */}
      <div className="mb-6 hidden text-center print:block">
        <div className="section-label text-brass-600">Ministarstvo unutrašnjih poslova · Demo kanton</div>
        <h1 className="mt-2 font-heading text-3xl text-ink-800">Trošak ljudstva — {LAST_COMPLETE_MONTH.slice(0, 4)}.</h1>
        <div className="mx-auto mt-3 h-[2px] w-16 bg-brass-500" />
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Wallet className="h-4 w-4" />} label="Godišnji trošak ljudstva" value={km(data.totalCost)} foot={`budžet ${km(data.totalPersonnelBudget + data.totalOtBudget)}`} />
        <Kpi icon={<Timer className="h-4 w-4" />} label="Trošak prekovremenih" value={km(data.totalOtActual)} foot={`${data.otPct}% ukupnog troška`} />
        <Kpi icon={<Building2 className="h-4 w-4" />} label="Iskorištenost OT budžeta" value={`${data.otUtilTotal}%`} tone={otTotTone} foot={`${km(data.totalOtActual)} / ${km(data.totalOtBudget)}`} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Trošak po policajcu" value={km(data.perCapita)} foot="godišnje, prosjek" />
      </section>

      {/* Vlastiti prihodi — Akademija (pretplata) + naknade za dokumente građana */}
      {(() => {
        const ownRevenue = data.academy.annualKM + docFees.annualProjection;
        const netCost = data.totalCost - ownRevenue;
        return (
          <section className="mb-6 border border-brass-300 bg-brass-100/40">
            <div className="flex items-center gap-2 border-b border-brass-300 px-5 py-3">
              <TrendingUp className="h-4 w-4 text-brass-700" />
              <div className="section-label text-brass-700">Vlastiti prihodi — umanjuju neto trošak</div>
            </div>
            <div className="grid gap-0 sm:grid-cols-3">
              {/* Akademija */}
              <div className="border-b border-brass-300/60 p-5 sm:border-b-0 sm:border-r">
                <div className="mb-1.5 flex items-center gap-1.5 text-brass-700">
                  <GraduationCap className="h-4 w-4" />
                  <div className="section-label text-brass-700">MUP Akademija</div>
                </div>
                <div className="font-mono text-2xl font-medium tabular-nums text-brass-700">{km(data.academy.annualKM)}</div>
                <div className="mt-0.5 text-[11px] text-ink-500">
                  {data.academy.totalSubs.toLocaleString('bs-BA')} pretplatnika · {ACADEMY.monthlyKM} KM/mj
                </div>
                <div className="mt-1 text-[11px] text-ink-400">FBiH projekcija {km(data.academy.fbihAnnualKM)}</div>
              </div>
              {/* Naknade za dokumente */}
              <div className="border-b border-brass-300/60 p-5 sm:border-b-0 sm:border-r">
                <div className="mb-1.5 flex items-center gap-1.5 text-brass-700">
                  <Printer className="h-4 w-4" />
                  <div className="section-label text-brass-700">Naknade za dokumente</div>
                </div>
                <div className="font-mono text-2xl font-medium tabular-nums text-brass-700">{km(docFees.annualProjection)}</div>
                <div className="mt-0.5 text-[11px] text-ink-500">lične karte, vozačke, pristup informacijama</div>
                <div className="mt-1 text-[11px] text-ink-400">projekcija, godišnje</div>
              </div>
              {/* Neto trošak */}
              <div className="p-5">
                <div className="section-label">Neto trošak ljudstva</div>
                <div className="font-mono text-2xl font-medium tabular-nums text-ink-800">{km(netCost)}</div>
                <div className="mt-0.5 text-[11px] text-ink-500">= {km(data.totalCost)} − {km(ownRevenue)} vlastitih prihoda</div>
              </div>
            </div>
            <p className="border-t border-brass-300/60 px-5 py-3 text-sm leading-relaxed text-ink-600">
              Zvanične aplikacije (edukacija za policajce/kadete i portal za dokumente građana) vraćaju
              sredstva u budžet umjesto da ga isključivo troše — vlastiti prihod od oko {km(ownRevenue)} godišnje.
            </p>
          </section>
        );
      })()}

      {/* Per-PU budget table */}
      <section className="mb-6 border border-paper-200 bg-paper-0">
        <div className="border-b border-paper-200 px-5 py-3">
          <div className="section-label text-brass-600">Trošak po upravama (godišnje)</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-left text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-5 py-2.5 font-medium">Uprava</th>
                <th className="px-3 py-2.5 font-medium">Budžet plata</th>
                <th className="px-3 py-2.5 font-medium">Trošak plata</th>
                <th className="px-3 py-2.5 font-medium">Budžet OT</th>
                <th className="px-3 py-2.5 font-medium">Trošak OT</th>
                <th className="px-3 py-2.5 font-medium">Iskorištenost OT</th>
                <th className="px-3 py-2.5 font-medium">KM / policajac</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.pu.id} className="border-b border-paper-100 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-none items-center justify-center bg-navy-900 text-paper-50">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-ink-800">{r.pu.name}</div>
                        <div className="text-[11px] text-ink-500">{r.headcount} policajaca</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-600">{km(r.personnelBudget)}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-800">{km(r.personnelActual)}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-600">{km(r.otBudget)}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-800">{km(r.otActual)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 flex-none rounded-full ${DOT[puOtTone(r.otUtil)]}`} />
                      <span className={`font-mono tabular-nums ${r.otUtil > 100 ? TXT.alarm : 'text-ink-800'}`}>{r.otUtil}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-800">{km(r.perOfficer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* OT budget vs actual chart */}
        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Prekovremeni: budžet vs. trošak</div>
            <div className="font-heading text-base text-ink-800">Po upravama (godišnje, KM)</div>
          </div>
          <div className="px-4 py-5">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                  <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={kmShort} />
                  <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} cursor={{ fill: 'rgba(184,147,90,0.08)' }} formatter={(value) => km(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar name="Budžet" dataKey="budzet" fill={CHART_COLORS.tertiary} radius={[2, 2, 0, 0]} />
                  <Bar name="Trošak" dataKey="trosak" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Savings / argument */}
        <section className="flex flex-col border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Argument za budžet</div>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center bg-brass-100 text-brass-700">
                <PiggyBank className="h-5 w-5" />
              </div>
              <div>
                <div className="section-label">Trošak prekovremenih u ekvivalentu plata</div>
                <div className="font-mono text-2xl font-medium tabular-nums text-ink-800">
                  ≈ {data.equivalentOfficers} {data.equivalentOfficers === 1 ? 'plata' : 'plate'}
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-ink-600">
              Godišnji trošak prekovremenog rada ({km(data.totalOtActual)}) odgovara plati oko{' '}
              {data.equivalentOfficers} policajca. Umjesto trajnog oslanjanja na prekovremeni, ta sredstva mogu
              finansirati nova zapošljavanja — čime se smanjuje i prekovremeni i opterećenje ljudstva. Simulacija
              «+20 policajaca» pokazuje neto efekat takve odluke.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-8 border-t border-paper-200 pt-4 text-center text-xs text-ink-500 print:hidden">
        Prikaz je namijenjen za budžetski zahtjev i sjednicu Vlade. „Izvezi u PDF" koristi print stylesheet browsera.
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
  value: string;
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
