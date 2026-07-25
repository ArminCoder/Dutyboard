import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Inbox, ChevronRight } from 'lucide-react';
import { useStore } from '../../app/store';
import { world } from '../../data/world';
import { formatBs } from '../../data/generator/dates';
import type { ApprovalStep, LeaveRequest } from '../../data/types';

const KIND_LABELS: Record<LeaveRequest['kind'], string> = {
  slobodan_dan: 'Slobodan dan',
  godisnji: 'Godišnji odmor',
  premjestaj: 'Premještaj',
  ostalo: 'Ostalo',
};

export function K03Odobrenja() {
  const store = useStore();
  const [filter, setFilter] = useState<'ceka' | 'sve'>('ceka');

  const my = useMemo(() => {
    return store.leaveRequests
      .filter((r) => r.officerId !== null)
      .filter((r) => (filter === 'ceka' ? currentStep(r)?.role === 'sefSmjene' && currentStep(r)?.status === 'ceka' : true))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [store.leaveRequests, filter]);

  const waiting = store.leaveRequests.filter((r) => currentStep(r)?.role === 'sefSmjene' && currentStep(r)?.status === 'ceka').length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">Odobrenja</div>
          <h1 className="mt-0.5 text-lg font-heading font-medium text-ink-800">Zahtjevi za odsustvo</h1>
        </div>
        <div className="flex gap-1  bg-paper-100 p-1">
          <FilterTab active={filter === 'ceka'} onClick={() => setFilter('ceka')} label={`Čeka (${waiting})`} />
          <FilterTab active={filter === 'sve'} onClick={() => setFilter('sve')} label="Sve" />
        </div>
      </header>

      {my.length === 0 ? (
        <div className="flex flex-col items-center justify-center  border border-dashed border-paper-200 bg-paper-0 px-6 py-16">
          <Inbox className="mb-3 h-10 w-10 text-paper-400" />
          <div className="text-sm font-medium text-ink-700">Nema zahtjeva za odluku</div>
          <div className="mt-1 text-xs text-ink-500">Novi zahtjevi od policajaca pojavljuju se ovdje.</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {my.map((r) => (
            <RequestRow key={r.id} req={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={` px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-paper-0 text-ink-800 ' : 'text-ink-500 hover:text-navy-900'
      }`}
    >
      {label}
    </button>
  );
}

function RequestRow({ req }: { req: LeaveRequest }) {
  const store = useStore();
  const [expanded, setExpanded] = useState(false);
  const officer = world.officers.find((o) => o.id === req.officerId);
  const step = currentStep(req);
  const canAct = step?.role === 'sefSmjene' && step.status === 'ceka';

  const range =
    req.fromDate && req.toDate
      ? req.fromDate === req.toDate
        ? formatBs(req.fromDate)
        : `${formatBs(req.fromDate)} — ${formatBs(req.toDate)}`
      : '—';

  return (
    <li className="overflow-hidden  bg-paper-0 border border-paper-200">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-paper-100 text-xs font-semibold text-ink-700">
            {(officer?.name ?? '?')
              .split(' ')
              .map((s) => s[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-heading font-medium text-ink-800">{officer?.name ?? 'Nepoznat'}</div>
              <span className="rounded-full bg-paper-100 px-2 py-0.5 text-[10px] font-medium uppercase text-ink-600">
                {KIND_LABELS[req.kind]}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-ink-500">{range}</div>
            {req.reason ? <div className="mt-0.5 truncate text-xs text-ink-400">„{req.reason}"</div> : null}
          </div>
        </div>
        <div className="flex flex-none items-center gap-3">
          <StatusChip status={req.status} />
          <ChevronRight className={`h-4 w-4 text-paper-400 transition ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>
      {expanded && (
        <div className="border-t border-paper-200 bg-paper-50 p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Lanac odobravanja</div>
          <ol className="mb-4 space-y-2">
            {req.approvalChain.map((s, i) => (
              <li key={i} className="flex items-center gap-3  bg-paper-0 px-3 py-2">
                <StepIcon status={s.status} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-ink-700">{roleLabel(s.role)}</div>
                  <div className="text-xs text-ink-500">{s.approverName}</div>
                </div>
                {s.resolvedAt && <div className="text-[11px] text-ink-400">{formatBs(s.resolvedAt.slice(0, 10))}</div>}
              </li>
            ))}
          </ol>
          {canAct && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => store.advanceApproval(req.id, 'odobreno')}
                className="inline-flex items-center gap-1.5  bg-signal-ok px-4 py-2 text-sm font-medium text-paper-50 transition hover:bg-signal-ok/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Odobri
              </button>
              <button
                onClick={() => store.advanceApproval(req.id, 'odbijeno', 'Odbačeno na razini šefa smjene.')}
                className="inline-flex items-center gap-1.5  border border-paper-200 bg-paper-0 px-4 py-2 text-sm text-ink-700 transition hover:border-signal-alarm hover:text-signal-alarm"
              >
                <XCircle className="h-4 w-4" />
                Odbij
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function StepIcon({ status }: { status: ApprovalStep['status'] }) {
  if (status === 'odobreno') return <CheckCircle2 className="h-4 w-4 text-signal-ok" />;
  if (status === 'odbijeno') return <XCircle className="h-4 w-4 text-signal-alarm" />;
  return <Clock className="h-4 w-4 text-paper-400" />;
}

function StatusChip({ status }: { status: LeaveRequest['status'] }) {
  const map = {
    u_toku: { cls: 'bg-signal-warn/15 text-signal-warn', label: 'u toku' },
    odobren: { cls: 'bg-signal-ok/15 text-signal-ok', label: 'odobren' },
    odbijen: { cls: 'bg-signal-alarm/15 text-signal-alarm', label: 'odbijen' },
  } as const;
  const { cls, label } = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cls}`}>{label}</span>;
}

function roleLabel(role: ApprovalStep['role']): string {
  switch (role) {
    case 'sefSmjene': return 'Šef smjene';
    case 'komandir': return 'Komandir';
    case 'nacelnik': return 'Načelnik';
  }
}

function currentStep(r: LeaveRequest): ApprovalStep | undefined {
  return r.approvalChain.find((s) => s.status === 'ceka');
}
