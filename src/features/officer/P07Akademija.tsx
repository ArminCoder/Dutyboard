import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GraduationCap, Shield, Scale, Car, Gavel, Target, Award, Clock,
  CheckCircle2, XCircle, ChevronRight, RotateCcw, ArrowLeft, TrendingUp, Sparkles,
} from 'lucide-react';
import { ACADEMY, ACADEMY_OBLASTI, type AcademyOblast } from '../../data/academy';
import { useCurrentOfficer } from './useOfficer';
import { useStore } from '../../app/store';
import type { AcademyAttempt } from '../../app/store';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { formatBs, DEMO_TODAY } from '../../data/generator/dates';

const ICONS = { shield: Shield, scale: Scale, car: Car, gavel: Gavel, target: Target } as const;

const pct = (correct: number, total: number) => (total > 0 ? Math.round((correct / total) * 100) : 0);
const passed = (correct: number, total: number) => correct / total >= ACADEMY.passThreshold;

/** Najbolji pokušaj po oblasti za datog policajca. */
function bestFor(attempts: AcademyAttempt[], oblastId: string): AcademyAttempt | undefined {
  return attempts
    .filter((a) => a.oblastId === oblastId)
    .sort((a, b) => b.correct / b.total - a.correct / a.total)[0];
}

type View =
  | { kind: 'list' }
  | { kind: 'quiz'; oblast: AcademyOblast }
  | { kind: 'result'; oblast: AcademyOblast; answers: number[]; seconds: number };

export function P07Akademija() {
  const officer = useCurrentOfficer();
  const { academyAttempts, recordAcademyAttempt } = useStore();
  const [view, setView] = useState<View>({ kind: 'list' });

  const mine = useMemo(
    () => academyAttempts.filter((a) => a.officerId === officer.id),
    [academyAttempts, officer.id],
  );

  if (view.kind === 'quiz') {
    return (
      <QuizRunner
        oblast={view.oblast}
        onCancel={() => setView({ kind: 'list' })}
        onFinish={(answers, seconds) => {
          const correct = answers.reduce((s, a, i) => s + (a === view.oblast.questions[i].correctIndex ? 1 : 0), 0);
          recordAcademyAttempt({ officerId: officer.id, oblastId: view.oblast.id, correct, total: view.oblast.questions.length });
          setView({ kind: 'result', oblast: view.oblast, answers, seconds });
        }}
      />
    );
  }

  if (view.kind === 'result') {
    return (
      <ResultView
        oblast={view.oblast}
        answers={view.answers}
        seconds={view.seconds}
        officerName={officer.name}
        onRetry={() => setView({ kind: 'quiz', oblast: view.oblast })}
        onBack={() => setView({ kind: 'list' })}
      />
    );
  }

  return <ListView attempts={mine} onStart={(o) => setView({ kind: 'quiz', oblast: o })} />;
}

// ─────────────────────────────────────────────────────────────── LIST ─────

function ListView({ attempts, onStart }: { attempts: AcademyAttempt[]; onStart: (o: AcademyOblast) => void }) {
  const attemptedOblasti = ACADEMY_OBLASTI.filter((o) => bestFor(attempts, o.id));
  const certCount = ACADEMY_OBLASTI.filter((o) => {
    const b = bestFor(attempts, o.id);
    return b && passed(b.correct, b.total);
  }).length;
  const avgBest = attemptedOblasti.length
    ? Math.round(
        attemptedOblasti.reduce((s, o) => {
          const b = bestFor(attempts, o.id)!;
          return s + pct(b.correct, b.total);
        }, 0) / attemptedOblasti.length,
      )
    : 0;

  return (
    <div className="px-4 py-6 sm:px-6">
      <header className="mb-5">
        <div className="section-label text-brass-600">MUP Akademija</div>
        <h1 className="mt-0.5 font-heading text-2xl text-ink-800">Edukacija i provjera znanja</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
          Osvježite znanje iz propisa i postupanja i pripremite se za napredovanje u čin. Isti moduli su
          obavezni dio obuke novih kadeta.
        </p>
      </header>

      {/* Pretplata / licenca — diskretno, u duhu zvanične aplikacije */}
      <div className="mb-5 flex items-center gap-3 border border-brass-300 bg-brass-100/60 px-4 py-2.5">
        <Sparkles className="h-4 w-4 flex-none text-brass-700" />
        <div className="min-w-0 text-xs text-ink-700">
          <span className="font-medium text-brass-700">Aktivna licenca</span> — MUP Akademija je uključena u
          vašu službenu pretplatu ({ACADEMY.monthlyKM} KM/mj po korisniku, snosi je organizacija).
        </div>
      </div>

      {/* Napredak */}
      <section className="mb-6 grid grid-cols-3 gap-3">
        <ProgressStat icon={<CheckCircle2 className="h-4 w-4" />} value={`${certCount}/${ACADEMY_OBLASTI.length}`} label="Položeno oblasti" />
        <ProgressStat icon={<Award className="h-4 w-4" />} value={String(certCount)} label={certCount === 1 ? 'Certifikat' : 'Certifikata'} />
        <ProgressStat icon={<TrendingUp className="h-4 w-4" />} value={attemptedOblasti.length ? `${avgBest}%` : '—'} label="Prosječan rezultat" />
      </section>

      {/* Oblasti */}
      <div className="mb-2 section-label text-ink-500">Oblasti</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ACADEMY_OBLASTI.map((o) => {
          const best = bestFor(attempts, o.id);
          const isPassed = best ? passed(best.correct, best.total) : false;
          const Icon = ICONS[o.icon];
          return (
            <article key={o.id} className="flex flex-col border border-paper-200 bg-paper-0 p-4">
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 flex-none items-center justify-center bg-navy-900 text-paper-50">
                  <Icon className="h-5 w-5" />
                </div>
                {best ? (
                  isPassed ? (
                    <StatusBadge tone="ok" size="sm" icon={<CheckCircle2 className="h-3 w-3" />}>Položeno</StatusBadge>
                  ) : (
                    <StatusBadge tone="warn" size="sm">Pokušano</StatusBadge>
                  )
                ) : (
                  <StatusBadge tone="neutral" size="sm">Novo</StatusBadge>
                )}
              </div>
              <h3 className="font-heading text-base leading-tight text-ink-800">{o.title}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-500">{o.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[11px] text-ink-500">
                  {o.questions.length} pitanja
                  {best ? <span className="ml-2 font-mono tabular-nums text-ink-700">· najbolje {pct(best.correct, best.total)}%</span> : null}
                </div>
                <Button size="sm" variant={best ? 'secondary' : 'primary'} iconRight={<ChevronRight className="h-3.5 w-3.5" />} onClick={() => onStart(o)}>
                  {best ? 'Ponovi' : 'Započni'}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-6 border-t border-paper-200 pt-3 text-center text-[11px] text-ink-400">
        Demo baza pitanja — u produkciji je održava i ovjerava pravna služba MUP-a.
      </p>
    </div>
  );
}

function ProgressStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="border border-paper-200 bg-paper-0 p-3 text-center">
      <div className="mb-1 flex justify-center text-brass-600">{icon}</div>
      <div className="font-mono text-xl font-medium tabular-nums text-ink-800">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── QUIZ ─────

function QuizRunner({
  oblast,
  onFinish,
  onCancel,
}: {
  oblast: AcademyOblast;
  onFinish: (answers: number[], seconds: number) => void;
  onCancel: () => void;
}) {
  const total = oblast.questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(-1));
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  // Štoperica testa — stvarno vrijeme interakcije (nije domenski podatak).
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const q = oblast.questions[idx];
  const chosen = answers[idx];
  const isLast = idx === total - 1;

  const choose = (i: number) => setAnswers((prev) => prev.map((a, k) => (k === idx ? i : a)));
  const next = () => {
    if (isLast) onFinish(answers, Math.floor((Date.now() - startRef.current) / 1000));
    else setIdx((i) => i + 1);
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onCancel} className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800">
          <ArrowLeft className="h-3.5 w-3.5" /> Prekini
        </button>
        <div className="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums text-ink-600">
          <Clock className="h-3.5 w-3.5" /> {fmtTime(elapsed)}
        </div>
      </div>

      <div className="mb-1 flex items-baseline justify-between">
        <div className="section-label text-brass-600">{oblast.short}</div>
        <div className="text-xs text-ink-500">Pitanje {idx + 1} / {total}</div>
      </div>
      <div className="mb-5 h-1 w-full overflow-hidden bg-paper-200">
        <div className="h-full bg-brass-500 transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      <h2 className="font-heading text-lg leading-snug text-ink-800">{q.text}</h2>

      <div className="mt-4 flex flex-col gap-2.5">
        {q.options.map((opt, i) => {
          const active = chosen === i;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`flex items-center gap-3 border px-4 py-3 text-left text-sm transition ${
                active ? 'border-navy-700 bg-navy-900 text-paper-50' : 'border-paper-200 bg-paper-0 text-ink-700 hover:border-navy-300 hover:bg-paper-100'
              }`}
            >
              <span className={`flex h-6 w-6 flex-none items-center justify-center border text-xs font-medium ${active ? 'border-paper-50/40 text-paper-50' : 'border-paper-300 text-ink-500'}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="leading-snug">{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-[11px] text-ink-400">Prag prolaznosti: {Math.round(ACADEMY.passThreshold * 100)}%</div>
        <Button variant="primary" disabled={chosen === -1} iconRight={<ChevronRight className="h-4 w-4" />} onClick={next}>
          {isLast ? 'Završi test' : 'Sljedeće'}
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────── RESULT ────

function ResultView({
  oblast,
  answers,
  seconds,
  officerName,
  onRetry,
  onBack,
}: {
  oblast: AcademyOblast;
  answers: number[];
  seconds: number;
  officerName: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  const total = oblast.questions.length;
  const correct = answers.reduce((s, a, i) => s + (a === oblast.questions[i].correctIndex ? 1 : 0), 0);
  const isPassed = passed(correct, total);
  const percentage = pct(correct, total);

  return (
    <div className="px-4 py-6 sm:px-6">
      {/* Rezultat */}
      <div className={`border p-6 text-center ${isPassed ? 'border-signal-ok/30 bg-signal-ok-soft' : 'border-signal-warn/30 bg-signal-warn-soft'}`}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-paper-0">
          {isPassed ? <Award className="h-6 w-6 text-signal-ok" /> : <RotateCcw className="h-6 w-6 text-signal-warn" />}
        </div>
        <div className={`font-mono text-4xl font-semibold tabular-nums ${isPassed ? 'text-signal-ok' : 'text-signal-warn'}`}>{percentage}%</div>
        <div className="mt-1 text-sm text-ink-700">{correct} / {total} tačnih · vrijeme {fmtTime(seconds)}</div>
        <div className="mt-2 text-sm font-medium text-ink-800">
          {isPassed ? 'Test položen — čestitamo!' : 'Test nije položen. Pregledajte odgovore i pokušajte ponovo.'}
        </div>
      </div>

      {/* Certifikat */}
      {isPassed ? (
        <div className="mt-4 border-2 border-brass-400 bg-paper-0 p-5">
          <div className="flex items-center justify-between">
            <div className="section-label text-brass-600">Certifikat o položenoj provjeri</div>
            <GraduationCap className="h-5 w-5 text-brass-600" />
          </div>
          <div className="mt-3 text-center">
            <div className="font-heading text-lg text-ink-800">{officerName}</div>
            <div className="mt-0.5 text-xs text-ink-500">uspješno je položio/la oblast</div>
            <div className="mt-1 font-heading text-base text-brass-700">{oblast.title}</div>
            <div className="mx-auto mt-3 h-px w-16 bg-brass-400" />
            <div className="mt-2 font-mono text-[11px] tabular-nums text-ink-400">
              MUP-AKA-{oblast.id.toUpperCase()}-{String(percentage).padStart(3, '0')} · {formatBs(DEMO_TODAY)}
            </div>
          </div>
        </div>
      ) : null}

      {/* Pregled odgovora */}
      <div className="mt-5 mb-2 section-label text-ink-500">Pregled odgovora</div>
      <div className="flex flex-col gap-3">
        {oblast.questions.map((q, i) => {
          const mine = answers[i];
          const ok = mine === q.correctIndex;
          return (
            <div key={q.id} className="border border-paper-200 bg-paper-0 p-4">
              <div className="flex items-start gap-2">
                {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-signal-ok" /> : <XCircle className="mt-0.5 h-4 w-4 flex-none text-signal-alarm" />}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-800">{q.text}</div>
                  {!ok ? (
                    <div className="mt-1.5 text-xs text-ink-500">
                      Vaš odgovor: <span className="text-signal-alarm">{q.options[mine]}</span>
                    </div>
                  ) : null}
                  <div className="mt-1 text-xs text-ink-700">
                    Tačno: <span className="font-medium">{q.options[q.correctIndex]}</span>
                  </div>
                  <div className="mt-1.5 text-xs leading-relaxed text-ink-500">{q.explanation}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>Nazad na oblasti</Button>
        <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={onRetry}>Ponovi test</Button>
      </div>
    </div>
  );
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
