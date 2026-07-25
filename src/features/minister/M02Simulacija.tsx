import { useMemo, useState } from 'react';
import { Users, Timer, HeartPulse, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { establishmentUnder } from '../../data/generator/org';

// M02 — Simulacija „+20 policajaca". Interaktivni what-if za ministra:
// pomjeranjem klizača mijenja se popunjenost, godišnji trošak prekovremenih i indeks opterećenja.
// Model je namjerno jednostavan, monoton i objašnjiv — bez ličnih podataka, samo agregati.

interface SimBase {
  establishment: number;
  activeBase: number;
  otMonthlyForce: number; // ukupni prekovremeni sati sedmično po cijeloj snazi (mjesečno)
  otPerOfficerBase: number;
  sickPct: number;
  otRateKM: number;
  annualPerOfficerKM: number;
  otMaxTarget: number;
  sickMax: number;
}

interface SimResult {
  coveragePct: number;
  otAnnualKM: number;
  otPerOfficer: number;
  burnout: number;
  personnelAddedKM: number;
  otSavingsKM: number;
  netBudgetKM: number;
  unmetPct: number;
}

function simulate(base: SimBase, hire: number, otCap: number): SimResult {
  const A = base.activeBase + hire;
  const baseGap = Math.max(base.establishment - base.activeBase, 0);
  const gap = Math.max(base.establishment - A, 0);
  const gapFactor = baseGap > 0 ? gap / baseGap : 0;

  // Potražnja za prekovremenim pada kako raste popuna (pod 15% je nesmanjiva rezerva).
  const demandOTmonthly = base.otMonthlyForce * (0.15 + 0.85 * gapFactor);
  const capacityOTmonthly = otCap * A;
  const actualOTmonthly = Math.min(demandOTmonthly, capacityOTmonthly);
  const unmet = demandOTmonthly > 0 ? Math.max(demandOTmonthly - capacityOTmonthly, 0) / demandOTmonthly : 0;

  const staffingCoverage = Math.min(A / base.establishment, 1);
  const coveragePct = Math.round(staffingCoverage * (1 - unmet) * 100);

  const otAnnualKM = Math.round(actualOTmonthly * 12 * base.otRateKM);
  const baseOTannualKM = Math.round(base.otMonthlyForce * 12 * base.otRateKM);
  const otPerOfficer = A > 0 ? actualOTmonthly / A : 0;

  const burnout = Math.max(
    0,
    Math.min(100, Math.round((otPerOfficer / base.otMaxTarget) * 70 + Math.min(base.sickPct / base.sickMax, 1) * 20)),
  );

  const personnelAddedKM = hire * base.annualPerOfficerKM;
  const otSavingsKM = baseOTannualKM - otAnnualKM;
  const netBudgetKM = personnelAddedKM - otSavingsKM;

  return {
    coveragePct,
    otAnnualKM,
    otPerOfficer,
    burnout,
    personnelAddedKM,
    otSavingsKM,
    netBudgetKM,
    unmetPct: Math.round(unmet * 100),
  };
}

const km = (n: number) => `${Math.round(n).toLocaleString('bs-BA')} KM`;

function burnoutBand(v: number): { label: string; tone: 'ok' | 'warn' | 'alarm' } {
  if (v < 40) return { label: 'zeleno', tone: 'ok' };
  if (v < 70) return { label: 'žuto', tone: 'warn' };
  return { label: 'crveno', tone: 'alarm' };
}

const TONE_BAR: Record<'ok' | 'warn' | 'alarm', string> = {
  ok: 'bg-signal-ok',
  warn: 'bg-signal-warn',
  alarm: 'bg-signal-alarm',
};
const TONE_TEXT: Record<'ok' | 'warn' | 'alarm', string> = {
  ok: 'text-signal-ok',
  warn: 'text-signal-warn',
  alarm: 'text-signal-alarm',
};

export function M02Simulacija() {
  const w = useScopedWorld();

  const base = useMemo<SimBase>(() => {
    const establishment = establishmentUnder(w.orgNodes, 'mup');
    const activeBase = w.officers.filter((o) => o.status === 'aktivan').length;
    const total = w.officers.length;
    const sickPct = (w.officers.filter((o) => o.status === 'bolovanje').length / total) * 100;

    const p2026 = w.performance.filter((p) => p.yearMonth.startsWith('2026'));
    const months = new Set(p2026.map((p) => p.yearMonth)).size || 1;
    const otHours2026 = p2026.reduce((s, p) => s + p.sati.prekovremeni, 0);
    const otMonthlyForce = otHours2026 / months;

    return {
      establishment,
      activeBase,
      otMonthlyForce,
      otPerOfficerBase: otMonthlyForce / Math.max(activeBase, 1),
      sickPct,
      otRateKM: w.finance.overtimeRateKM,
      annualPerOfficerKM: Math.round(w.finance.avgMonthlyBaseKM * 12 * 1.5),
      otMaxTarget: w.targets.overtimeHoursPerOfficerMax,
      sickMax: w.targets.sickLeavePctMax,
    };
  }, [w]);

  const defaultCap = Math.max(4, Math.min(24, Math.ceil(base.otPerOfficerBase)));
  const [hire, setHire] = useState(0);
  const [otCap, setOtCap] = useState(defaultCap);

  const baseline = useMemo(() => simulate(base, 0, defaultCap), [base, defaultCap]);
  const sim = useMemo(() => simulate(base, hire, otCap), [base, hire, otCap]);

  const reset = () => {
    setHire(0);
    setOtCap(defaultCap);
  };

  const band = burnoutBand(sim.burnout);
  const baseBand = burnoutBand(baseline.burnout);
  const changed = hire !== 0 || otCap !== defaultCap;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <div className="section-label text-brass-600">Podrška odlučivanju</div>
          <h1 className="font-heading text-2xl text-ink-800">Simulacija ljudstva i troška</h1>
        </div>
        {changed ? (
          <button
            onClick={reset}
            className="flex items-center gap-2 border border-paper-300 bg-paper-0 px-3 py-1.5 text-sm text-ink-600 transition hover:border-brass-500 hover:text-navy-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Vrati na trenutno stanje
          </button>
        ) : null}
      </div>
      <p className="mb-6 max-w-2xl text-sm text-ink-500">
        Pomjerite klizače da vidite kako kadrovske i budžetske odluke utiču na popunjenost, prekovremeni
        rad i opterećenje ljudstva. Prikazuju se isključivo zbirni podaci.
      </p>

      {/* Kontrole */}
      <section className="mb-6 grid gap-5 border border-paper-200 bg-paper-0 p-6 md:grid-cols-2">
        <Slider
          label="Dodatni policajci"
          value={hire}
          min={0}
          max={40}
          step={1}
          suffix={hire > 0 ? `+${hire}` : '0'}
          hint={`Aktivnih sada: ${base.activeBase} · sistematizacija: ${base.establishment}`}
          onChange={setHire}
        />
        <Slider
          label="Limit prekovremenih (sati / policajac / mjesec)"
          value={otCap}
          min={4}
          max={24}
          step={1}
          suffix={`${otCap} h`}
          hint="Niži limit smanjuje trošak — ali ako nema dovoljno ljudi, popunjenost pada."
          onChange={setOtCap}
        />
      </section>

      {/* Rezultati */}
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <ResultTile
          icon={<Users className="h-4 w-4" />}
          label="Popunjenost smjena"
          value={`${sim.coveragePct}%`}
          delta={sim.coveragePct - baseline.coveragePct}
          deltaGood="up"
          meter={sim.coveragePct}
          meterTone={sim.coveragePct >= w.targets.coveragePct ? 'ok' : sim.coveragePct >= 75 ? 'warn' : 'alarm'}
          foot={sim.unmetPct > 0 ? `${sim.unmetPct}% potražnje nepokriveno` : `cilj: ${w.targets.coveragePct}%`}
        />
        <ResultTile
          icon={<Timer className="h-4 w-4" />}
          label="Godišnji trošak prekovremenih"
          value={km(sim.otAnnualKM)}
          delta={sim.otAnnualKM - baseline.otAnnualKM}
          deltaGood="down"
          deltaFmt={km}
          meter={baseline.otAnnualKM > 0 ? Math.round((sim.otAnnualKM / baseline.otAnnualKM) * 100) : 0}
          meterTone="warn"
          foot={`${sim.otPerOfficer.toFixed(1)} h/policajac/mj`}
        />
        <ResultTile
          icon={<HeartPulse className="h-4 w-4" />}
          label="Indeks opterećenja"
          value={band.label}
          valueClass={TONE_TEXT[band.tone]}
          delta={sim.burnout - baseline.burnout}
          deltaGood="down"
          deltaSuffix=" bod."
          meter={sim.burnout}
          meterTone={band.tone}
          foot={`baseline: ${baseBand.label} (${baseline.burnout})`}
        />
      </section>

      {/* Budžetski efekat */}
      <section className="mb-6 border border-paper-200 bg-paper-0">
        <div className="border-b border-paper-200 px-6 py-3">
          <div className="section-label text-brass-600">Budžetski efekat (godišnje)</div>
        </div>
        <div className="grid gap-px bg-paper-200 md:grid-cols-3">
          <BudgetCell label="Nove plate" value={`+${km(sim.personnelAddedKM)}`} tone="cost" />
          <BudgetCell
            label="Ušteda na prekovremenom"
            value={`${sim.otSavingsKM >= 0 ? '−' : '+'}${km(Math.abs(sim.otSavingsKM))}`}
            tone="save"
          />
          <BudgetCell
            label="Neto efekat na budžet"
            value={`${sim.netBudgetKM > 0 ? '+' : sim.netBudgetKM < 0 ? '−' : ''}${km(Math.abs(sim.netBudgetKM))}`}
            tone={sim.netBudgetKM > 0 ? 'cost' : 'save'}
            strong
          />
        </div>
      </section>

      {/* Narativ */}
      <section className="border-l-2 border-brass-500 bg-paper-0 px-6 py-4">
        <p className="text-sm leading-relaxed text-ink-700">{narrative(baseline, sim, hire)}</p>
      </section>
    </div>
  );
}

function narrative(baseline: SimResult, sim: SimResult, hire: number): string {
  if (hire === 0 && sim.coveragePct === baseline.coveragePct && sim.otAnnualKM === baseline.otAnnualKM) {
    return `Trenutno stanje: popunjenost ${sim.coveragePct}%, godišnji trošak prekovremenih ${km(
      sim.otAnnualKM,
    )}, indeks opterećenja „${burnoutBand(sim.burnout).label}". Pomjerite klizače da modelirate odluku.`;
  }
  const covWord = sim.coveragePct >= baseline.coveragePct ? 'raste' : 'pada';
  const otPct =
    baseline.otAnnualKM > 0 ? Math.round((1 - sim.otAnnualKM / baseline.otAnnualKM) * 100) : 0;
  const otWord = otPct >= 0 ? `pada za ${otPct}%` : `raste za ${Math.abs(otPct)}%`;
  const netWord =
    sim.netBudgetKM > 0
      ? `neto trošak ${km(sim.netBudgetKM)} godišnje`
      : `neto ušteda ${km(Math.abs(sim.netBudgetKM))} godišnje`;
  const hirePart = hire > 0 ? `${hire} dodatnih policajaca: ` : 'Uz zadate parametre: ';
  return `${hirePart}popunjenost ${covWord} na ${sim.coveragePct}%, prekovremeni ${otWord}, opterećenje „${burnoutBand(
    baseline.burnout,
  ).label}" → „${burnoutBand(sim.burnout).label}". Budžetski: ${netWord}.`;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  hint: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-ink-700">{label}</label>
        <span className="font-mono text-lg font-medium tabular-nums text-navy-900">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-navy-900"
      />
      <p className="mt-1.5 text-[11px] text-ink-400">{hint}</p>
    </div>
  );
}

function ResultTile({
  icon,
  label,
  value,
  valueClass,
  delta,
  deltaGood,
  deltaFmt,
  deltaSuffix,
  meter,
  meterTone,
  foot,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  delta: number;
  deltaGood: 'up' | 'down';
  deltaFmt?: (n: number) => string;
  deltaSuffix?: string;
  meter: number;
  meterTone: 'ok' | 'warn' | 'alarm';
  foot: string;
}) {
  const rounded = Math.round(delta);
  const isGood = deltaGood === 'up' ? rounded > 0 : rounded < 0;
  const isBad = deltaGood === 'up' ? rounded < 0 : rounded > 0;
  const deltaColor = rounded === 0 ? 'text-ink-400' : isGood ? 'text-signal-ok' : 'text-signal-alarm';
  const showDelta = rounded !== 0;
  const deltaText = deltaFmt ? deltaFmt(Math.abs(rounded)) : `${Math.abs(rounded)}${deltaSuffix ?? ''}`;

  return (
    <div className="relative overflow-hidden border border-paper-200 bg-paper-0 p-5">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-ink-500">{icon}</span>
        <div className="section-label">{label}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className={`font-mono text-3xl font-medium tabular-nums ${valueClass ?? 'text-ink-800'}`}>{value}</div>
        {showDelta ? (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${deltaColor}`}>
            {isGood ? <TrendingUp className="h-3 w-3" /> : isBad ? <TrendingDown className="h-3 w-3" /> : null}
            {rounded > 0 ? '+' : '−'}
            {deltaText}
          </span>
        ) : null}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden bg-paper-200">
        <div className={`h-full ${TONE_BAR[meterTone]}`} style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} />
      </div>
      <div className="mt-1.5 text-[11px] text-ink-500">{foot}</div>
    </div>
  );
}

function BudgetCell({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone: 'cost' | 'save';
  strong?: boolean;
}) {
  return (
    <div className="bg-paper-0 px-6 py-5">
      <div className="section-label mb-1">{label}</div>
      <div
        className={`font-mono tabular-nums ${strong ? 'text-2xl font-medium' : 'text-xl'} ${
          tone === 'save' ? 'text-signal-ok' : 'text-ink-800'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
