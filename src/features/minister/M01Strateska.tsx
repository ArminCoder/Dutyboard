import { useMemo } from 'react';
import { Printer, Users, Timer, HeartPulse, Car, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useOrg } from '../../app/OrgContext';
import { establishmentUnder } from '../../data/generator/org';
import { DEMO_TODAY, yearsBetween } from '../../data/generator/dates';
import { Button } from '../../components/Button';
import { CHART_COLORS, CHART_TICK, CHART_TOOLTIP, CHART_TOOLTIP_LABEL } from '../../components/chartTheme';

const MONTHS_BS = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];

export function M01Strateska() {
  const { org } = useOrg();
  const w = useScopedWorld();

  const stats = useMemo(() => {
    const total = w.officers.length;
    const active = w.officers.filter((o) => o.status === 'aktivan').length;
    const bolovanje = w.officers.filter((o) => o.status === 'bolovanje').length;
    const sistematizacija = establishmentUnder(w.orgNodes, 'mup');
    const popPct = Math.round((active / sistematizacija) * 100);
    const bolPct = Math.round((bolovanje / total) * 100);

    const p2026 = w.performance.filter((p) => p.yearMonth.startsWith('2026'));
    const months2026 = new Set(p2026.map((p) => p.yearMonth)).size || 1;
    const prekovH = p2026.reduce((s, p) => s + p.sati.prekovremeni, 0);
    const prekovKM = prekovH * w.finance.overtimeRateKM;
    const prekovKMmonth = Math.round(prekovKM / months2026);

    const staza = +(w.officers.reduce((s, o) => s + yearsBetween(o.hireDate, DEMO_TODAY), 0) / total).toFixed(1);
    // Penzionisanje u naredna 24 mjeseca: dostiže 60 god. života ili 35 god. staža.
    const penzija24m = w.officers.filter(
      (o) => yearsBetween(o.birthDate, DEMO_TODAY) >= 58 || yearsBetween(o.hireDate, DEMO_TODAY) >= 33,
    ).length;

    const vozUkupno = w.vehicles.length;
    const vozIspravno = w.vehicles.filter((v) => v.status === 'ispravno').length;
    const vozPct = Math.round((vozIspravno / vozUkupno) * 100);

    return { total, sistematizacija, popPct, bolPct, prekovKM, prekovKMmonth, staza, penzija24m, vozPct, vozUkupno, vozIspravno };
  }, [w]);

  const puTrend = useMemo(() => {
    const monthly = new Map<string, number>();
    for (const p of w.performance) {
      if (!p.yearMonth.startsWith('2026')) continue;
      monthly.set(p.yearMonth, (monthly.get(p.yearMonth) ?? 0) + p.sati.prekovremeni);
    }
    return [...monthly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, sati]) => ({ label: MONTHS_BS[Number(ym.slice(5, 7)) - 1].slice(0, 3), trosak: Math.round(sati * w.finance.overtimeRateKM) }));
  }, [w]);

  const print = () => window.print();

  const dateStamp = new Date(DEMO_TODAY).toLocaleDateString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const year = DEMO_TODAY.slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 print:py-0">
      <div className="mb-6 flex justify-end print:hidden">
        <Button variant="primary" icon={<Printer className="h-4 w-4" />} onClick={print}>
          Izvezi u PDF
        </Button>
      </div>

      {/* Cover / Header sekcija — u printu se pokazuje kao "cover page" */}
      <section className="mb-8 border border-paper-200 bg-paper-0 px-8 py-10 print:border-0 print:px-0">
        <div className="text-center">
          <div className="section-label mb-2 text-brass-600">Bosna i Hercegovina</div>
          <div className="text-lg text-ink-800">{org.orgName}</div>
          <div className="mx-auto mt-4 h-[2px] w-16 bg-brass-500" />
          <h2 className="mt-6 font-heading text-4xl leading-tight text-ink-800 md:text-5xl">
            Strateški izvještaj
          </h2>
          <div className="mt-2 font-heading text-2xl text-brass-700">{year}.</div>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ink-600">
            Zbirni prikaz stanja ljudskih i materijalnih resursa Uprave policije,
            pripremljen za razmatranje na Vladi kantona.
            Prikazuju se isključivo zbirni podaci — bez ličnih imena.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs uppercase tracking-wider text-ink-500">
            <div>
              <div className="text-[10px] text-ink-400">Datum</div>
              <div className="font-mono">{dateStamp}</div>
            </div>
            <div className="h-6 w-px bg-paper-300" />
            <div>
              <div className="text-[10px] text-ink-400">Klasifikacija</div>
              <div className="font-mono">Interno</div>
            </div>
          </div>
        </div>
      </section>

      {/* Big stats */}
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <BigStat
          label="Popunjenost prema sistematizaciji"
          value={`${stats.popPct}%`}
          sub={`${stats.total} od ${stats.sistematizacija}`}
          icon={<Users className="h-4 w-4" />}
        />
        <BigStat
          label="Trošak prekovremenih 2026."
          value={`${stats.prekovKM.toLocaleString('bs-BA')} KM`}
          sub={`prosjek ${stats.prekovKMmonth.toLocaleString('bs-BA')} KM/mj`}
          icon={<Timer className="h-4 w-4" />}
        />
        <BigStat
          label="Bolovanja"
          value={`${stats.bolPct}%`}
          sub="kroz cijelu godinu"
          icon={<HeartPulse className="h-4 w-4" />}
        />
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <BigStat label="Prosjek radnog staža" value={`${stats.staza} god.`} icon={<TrendingUp className="h-4 w-4" />} />
        <BigStat label="Projekcija penzionisanja" value={stats.penzija24m} sub="u sljedećih 24 mjeseca" />
        <BigStat
          label="Vozni park"
          value={`${stats.vozPct}%`}
          sub={`${stats.vozIspravno}/${stats.vozUkupno} ispravno`}
          icon={<Car className="h-4 w-4" />}
        />
      </section>

      {/* Chart */}
      <section className="mb-8 border border-paper-200 bg-paper-0">
        <div className="border-b border-paper-200 px-6 py-4">
          <div className="section-label mb-1 text-brass-600">Godišnji trend</div>
          <div className="flex items-baseline justify-between">
            <div className="font-heading text-lg text-ink-800">Trošak prekovremenih po mjesecu</div>
            <div className="font-mono text-xs text-ink-500">{year}. · u KM</div>
          </div>
        </div>
        <div className="px-4 py-5">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={puTrend} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} cursor={{ fill: 'rgba(184,147,90,0.08)' }} />
                <Bar dataKey="trosak" fill={CHART_COLORS.primary} radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Signature block — pojavljuje se u printu */}
      <section className="hidden print:block print-page-break">
        <div className="mt-16 grid grid-cols-2 gap-16">
          <div>
            <div className="mb-1 h-px bg-navy-800" />
            <div className="text-xs text-ink-500">Sarajevo, {dateStamp}</div>
          </div>
          <div>
            <div className="mb-1 h-px bg-navy-800" />
            <div className="text-xs text-ink-500">Ministar unutrašnjih poslova</div>
          </div>
        </div>
      </section>

      <div className="mt-8 border-t border-paper-200 pt-4 text-center text-xs text-ink-500 print:hidden">
        Prikaz je namijenjen za skupštinsko pitanje ili sjednicu Vlade.
        „Izvezi u PDF" koristi print stylesheet browsera (Cmd/Ctrl+P → Save as PDF).
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border border-paper-200 bg-paper-0 p-5 print:border-paper-300">
      <span className="absolute left-0 top-0 h-full w-[3px] bg-brass-500" />
      <div className="mb-2 flex items-center gap-1.5">
        {icon ? <span className="text-ink-500">{icon}</span> : null}
        <div className="section-label">{label}</div>
      </div>
      <div className="font-mono text-3xl font-medium tabular-nums text-ink-800">{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-ink-500">{sub}</div> : null}
    </div>
  );
}
