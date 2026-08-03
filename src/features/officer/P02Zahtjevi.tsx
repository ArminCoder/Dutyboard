import { useMemo, useState } from 'react';
import { Plus, X, ChevronRight, CalendarOff, CheckCircle2, XCircle, Clock, Paperclip } from 'lucide-react';
import { useSoftić } from './useOfficer';
import { useStore } from '../../app/store';
import { DEMO_TODAY, addDays, formatBs } from '../../data/generator/dates';
import type { ApprovalStep, LeaveRequest, LeaveRequestKind } from '../../data/types';

const KIND_LABELS: Record<LeaveRequestKind, string> = {
  slobodan_dan: 'Slobodan dan',
  godisnji: 'Godišnji odmor',
  bolovanje: 'Bolovanje',
  ostalo: 'Ostalo',
};

const GODISNJI_UKUPNO = 30;
const GODISNJI_ISKORISTENO = 12;

export function P02Zahtjevi() {
  const officer = useSoftić();
  const store = useStore();
  const [open, setOpen] = useState(false);

  const my = useMemo(
    () => store.leaveRequests.filter((r) => r.officerId === officer.id),
    [store.leaveRequests, officer.id],
  );

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400">Odsustva i zahtjevi</div>
        <h1 className="mt-0.5 text-xl font-heading font-medium text-ink-800">Moji zahtjevi</h1>
      </div>

      <section className=" bg-paper-0 p-4 border border-paper-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-400">Godišnji odmor 2026.</div>
            <div className="mt-1 text-2xl font-heading font-medium text-ink-800">
              {GODISNJI_UKUPNO - GODISNJI_ISKORISTENO}{' '}
              <span className="text-sm font-normal text-ink-500">/ {GODISNJI_UKUPNO} dana ostalo</span>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5  bg-navy-900 px-3 py-2 text-sm font-medium text-paper-50 transition hover:bg-navy-800"
          >
            <Plus className="h-4 w-4" />
            Novi zahtjev
          </button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-100">
          <div
            className="h-full rounded-full bg-navy-900"
            style={{ width: `${(GODISNJI_ISKORISTENO / GODISNJI_UKUPNO) * 100}%` }}
          />
        </div>
      </section>

      {my.length === 0 ? (
        <section className=" border border-dashed border-paper-200 bg-paper-0 p-8 text-center">
          <CalendarOff className="mx-auto h-8 w-8 text-paper-400" />
          <div className="mt-2 text-sm font-medium text-ink-700">Nema podnesenih zahtjeva</div>
          <div className="mt-1 text-xs text-ink-500">Kad podneseš zahtjev, pojavit će se ovdje.</div>
        </section>
      ) : (
        <ul className="space-y-3">
          {my.map((r) => (
            <RequestCard key={r.id} req={r} />
          ))}
        </ul>
      )}

      {open && <NewRequestDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function RequestCard({ req }: { req: LeaveRequest }) {
  const [expanded, setExpanded] = useState(false);
  const range =
    req.fromDate && req.toDate
      ? req.fromDate === req.toDate
        ? formatBs(req.fromDate)
        : `${formatBs(req.fromDate)} — ${formatBs(req.toDate)}`
      // Otvoreno bolovanje nema krajnji datum dok ljekar ne utvrdi kraj.
      : req.fromDate
        ? `od ${formatBs(req.fromDate)} · otvoreno`
        : '—';

  return (
    <li className="overflow-hidden  bg-paper-0 border border-paper-200">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-heading font-medium text-ink-800">{KIND_LABELS[req.kind]}</span>
            <StatusBadge status={req.status} />
          </div>
          <div className="mt-0.5 text-xs text-ink-500">{range}</div>
          {req.reason ? <div className="mt-1 truncate text-xs text-ink-400">„{req.reason}"</div> : null}
        </div>
        <ChevronRight
          className={`h-4 w-4 text-paper-400 transition ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-paper-200 bg-paper-50 p-4">
          <div className="mb-2 text-xs uppercase tracking-wider text-ink-400">Lanac odobravanja</div>
          <ol className="space-y-2">
            {req.approvalChain.map((step, i) => (
              <ChainRow key={i} step={step} />
            ))}
          </ol>
        </div>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: LeaveRequest['status'] }) {
  const map: Record<LeaveRequest['status'], { label: string; cls: string; Icon: typeof Clock }> = {
    u_toku: { label: 'u toku', cls: 'bg-signal-warn/15 text-signal-warn', Icon: Clock },
    odobren: { label: 'odobren', cls: 'bg-signal-ok/15 text-signal-ok', Icon: CheckCircle2 },
    odbijen: { label: 'odbijen', cls: 'bg-signal-alarm/15 text-signal-alarm', Icon: XCircle },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ChainRow({ step }: { step: ApprovalStep }) {
  const map: Record<ApprovalStep['status'], { Icon: typeof Clock; cls: string }> = {
    ceka: { Icon: Clock, cls: 'text-paper-400' },
    odobreno: { Icon: CheckCircle2, cls: 'text-signal-ok' },
    odbijeno: { Icon: XCircle, cls: 'text-signal-alarm' },
  };
  const { Icon, cls } = map[step.status];
  return (
    <li className="flex items-center gap-3  bg-paper-0 p-2.5">
      <Icon className={`h-4 w-4 ${cls}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-ink-700">{roleLabel(step.role)}</span>
          <span className="text-[11px] text-ink-400">
            {step.resolvedAt ? formatBs(step.resolvedAt.slice(0, 10)) : ''}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-ink-500">{step.approverName}</div>
        {step.note ? <div className="mt-0.5 text-[11px] italic text-ink-400">„{step.note}"</div> : null}
      </div>
    </li>
  );
}

function roleLabel(role: ApprovalStep['role']): string {
  switch (role) {
    case 'sefSmjene': return 'Šef smjene';
    case 'komandir': return 'Komandir';
    case 'nacelnik': return 'Načelnik';
  }
}

function NewRequestDialog({ onClose }: { onClose: () => void }) {
  const officer = useSoftić();
  const store = useStore();
  const [kind, setKind] = useState<LeaveRequestKind>('slobodan_dan');
  const [fromDate, setFromDate] = useState<string>(addDays(DEMO_TODAY, 3));
  const [toDate, setToDate] = useState<string>(addDays(DEMO_TODAY, 3));
  const [reason, setReason] = useState('');
  const [nota, setNota] = useState<string | null>(null);

  // Bolovanje je otvoreno — dovoljan je prvi dan.
  const canSubmit = kind === 'bolovanje' ? Boolean(fromDate) : Boolean(fromDate && toDate && fromDate <= toDate);

  const submit = () => {
    if (!canSubmit) return;
    store.submitLeaveRequest({
      officerId: officer.id,
      officerName: officer.name,
      kind,
      fromDate,
      toDate: kind === 'bolovanje' ? undefined : kind === 'slobodan_dan' ? fromDate : toDate,
      reason: [reason.trim(), nota ? `Prilog: ${nota}` : ''].filter(Boolean).join(' · ') || undefined,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/50  sm:items-center"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-paper-0 p-5  sm:">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-heading font-medium text-ink-800">Novi zahtjev</h3>
          <button
            onClick={onClose}
            className=" p-1 text-ink-400 transition hover:bg-paper-100 hover:text-navy-900"
            aria-label="Zatvori"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-3 block">
          <div className="mb-1 text-xs font-medium text-ink-600">Vrsta</div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(KIND_LABELS) as LeaveRequestKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={` border px-3 py-2 text-sm transition ${
                  kind === k
                    ? 'border-navy-900 bg-navy-900 text-paper-50'
                    : 'border-paper-200 bg-paper-0 text-ink-700 hover:border-navy-500'
                }`}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </label>

        {kind === 'bolovanje' ? (
          <div className="mb-3">
            <label className="block">
              <div className="mb-1 text-xs font-medium text-ink-600">Prvi dan bolovanja</div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
              />
            </label>
            <p className="mt-1 text-[11px] text-ink-400">
              Trajanje se ne unosi — bolovanje ostaje otvoreno dok ljekar ne utvrdi kraj.
            </p>
            <button
              type="button"
              onClick={() => setNota(nota ? null : 'ljekarsko-uvjerenje.pdf')}
              className={`mt-2 flex w-full items-center justify-center gap-2 border border-dashed px-3 py-2 text-xs transition ${
                nota
                  ? 'border-signal-ok/40 bg-signal-ok/10 text-signal-ok'
                  : 'border-paper-300 bg-paper-50 text-ink-500 hover:border-brass-500'
              }`}
            >
              <Paperclip className="h-3.5 w-3.5" />
              {nota ?? 'Priloži ljekarsko uvjerenje'}
            </button>
          </div>
        ) : kind === 'slobodan_dan' ? (
          <label className="mb-3 block">
            <div className="mb-1 text-xs font-medium text-ink-600">Datum</div>
            <input
              type="date"
              value={fromDate}
              min={DEMO_TODAY}
              onChange={(e) => {
                setFromDate(e.target.value);
                setToDate(e.target.value);
              }}
              className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
            />
          </label>
        ) : (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <label>
              <div className="mb-1 text-xs font-medium text-ink-600">Od</div>
              <input
                type="date"
                value={fromDate}
                min={DEMO_TODAY}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
              />
            </label>
            <label>
              <div className="mb-1 text-xs font-medium text-ink-600">Do</div>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
              />
            </label>
          </div>
        )}

        <label className="mb-4 block">
          <div className="mb-1 text-xs font-medium text-ink-600">Razlog (nije obavezno)</div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full resize-none  border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
            placeholder="Kratko obrazloženje…"
          />
        </label>

        {kind !== 'slobodan_dan' && (
          <div className="mb-3  border border-signal-warn/20 bg-signal-warn/10 px-3 py-2 text-xs text-signal-warn">
            {kind === 'ostalo'
              ? 'Ova vrsta zahtjeva će biti dostupna u sljedećoj fazi. Podnošenje je omogućeno kao mockup.'
              : kind === 'bolovanje'
                ? 'Bolovanje se prijavljuje odmah i ostaje otvoreno; ljekarsko uvjerenje vidi komandir.'
                : 'Zahtjev prolazi trostepeni lanac: šef smjene → komandir → načelnik.'}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className=" px-3 py-2 text-sm text-ink-600 hover:bg-paper-100">
            Odustani
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className=" bg-navy-900 px-4 py-2 text-sm font-medium text-paper-50 disabled:opacity-50"
          >
            Pošalji zahtjev
          </button>
        </div>
      </div>
    </div>
  );
}
