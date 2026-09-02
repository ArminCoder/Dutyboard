import { useMemo, useState } from 'react';
import { Inbox, MapPin, CircleDollarSign, ChevronRight } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useStore } from '../../app/store';
import { DOC_TYPES, findDocType } from '../../data/administration';
import { DOC_REQUEST_STATUS_LABEL, type DocumentRequest, type DocumentRequestStatus } from '../../data/types';
import { formatBs } from '../../data/generator/dates';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { DOC_STATUS_TONE, iconForKind, km } from '../portal/docUi';

const FILTERS: Array<DocumentRequestStatus | 'sve'> = ['sve', 'podnesen', 'u_obradi', 'spreman', 'preuzet'];
const FILTER_LABEL: Record<string, string> = { sve: 'Sve', ...DOC_REQUEST_STATUS_LABEL };

export function AdminZahtjevi() {
  const w = useScopedWorld();
  const { documentRequests, setDocumentRequestStatus, toggleDocumentPaid } = useStore();
  const [filter, setFilter] = useState<DocumentRequestStatus | 'sve'>('podnesen');
  const [openId, setOpenId] = useState<string | null>(null);

  // Administracija vidi zahtjeve stanica u svom scope-u (join po psId — store nije skoup-an).
  const stationIds = useMemo(() => new Set(w.orgNodes.filter((n) => n.kind === 'ps').map((n) => n.id)), [w.orgNodes]);
  const inScope = useMemo(
    () => documentRequests.filter((r) => stationIds.has(r.psId)).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)),
    [documentRequests, stationIds],
  );

  const counts = (s: DocumentRequestStatus | 'sve') => (s === 'sve' ? inScope.length : inScope.filter((r) => r.status === s).length);
  const shown = filter === 'sve' ? inScope : inScope.filter((r) => r.status === filter);

  const collectedToday = inScope.filter((r) => r.paid).reduce((s, r) => s + r.feeKM, 0);
  const inProgress = inScope.filter((r) => r.status === 'u_obradi').length;
  const readyCount = inScope.filter((r) => r.status === 'spreman').length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-5">
        <div className="section-label text-brass-600">Administrativna služba</div>
        <h1 className="font-heading text-2xl text-ink-800">Zahtjevi građana za dokumente</h1>
      </header>

      <section className="mb-6 grid grid-cols-3 gap-3">
        <Stat icon={<Inbox className="h-4 w-4" />} value={String(inProgress)} label="U obradi" />
        <Stat icon={<MapPin className="h-4 w-4" />} value={String(readyCount)} label="Spremno" />
        <Stat icon={<CircleDollarSign className="h-4 w-4" />} value={`${collectedToday} KM`} label="Naplaćeno" />
      </section>

      {/* Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`border px-3 py-1.5 text-xs transition ${filter === f ? 'border-navy-700 bg-navy-900 text-paper-50' : 'border-paper-300 bg-paper-0 text-ink-600 hover:border-navy-300'}`}
          >
            {FILTER_LABEL[f]} <span className="ml-1 font-mono tabular-nums text-[10px] opacity-70">{counts(f)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="border border-dashed border-paper-300 bg-paper-0 px-6 py-12 text-center text-sm text-ink-500">
          Nema zahtjeva u ovom statusu.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((r) => (
            <Row
              key={r.id}
              req={r}
              open={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              onStatus={(s) => setDocumentRequestStatus(r.id, s)}
              onTogglePaid={() => toggleDocumentPaid(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  req,
  open,
  onToggle,
  onStatus,
  onTogglePaid,
}: {
  req: DocumentRequest;
  open: boolean;
  onToggle: () => void;
  onStatus: (s: DocumentRequestStatus) => void;
  onTogglePaid: () => void;
}) {
  const doc = findDocType(req.kind);
  const Icon = iconForKind(req.kind, DOC_TYPES);
  const feeUnsettled = req.feeKM > 0 && !req.paid;

  return (
    <article className="border border-paper-200 bg-paper-0">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <div className="flex h-9 w-9 flex-none items-center justify-center bg-paper-100 text-ink-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink-800">{doc.title}</span>
            <StatusBadge tone={DOC_STATUS_TONE[req.status]} size="sm">{DOC_REQUEST_STATUS_LABEL[req.status]}</StatusBadge>
            {feeUnsettled ? <StatusBadge tone="warn" size="sm">nenaplaćeno</StatusBadge> : null}
          </div>
          <div className="mt-0.5 text-xs text-ink-500">
            {req.citizenName} · JMB {req.citizenId} · {formatBs(req.submittedAt.slice(0, 10))}
          </div>
        </div>
        <ChevronRight className={`h-4 w-4 flex-none text-ink-400 transition ${open ? 'rotate-90' : ''}`} />
      </button>

      {open ? (
        <div className="border-t border-paper-200 px-4 py-3">
          <div className="grid gap-2 text-xs text-ink-600 sm:grid-cols-2">
            <div><span className="text-ink-400">Naknada:</span> {km(req.feeKM)} {req.feeKM > 0 ? (req.paid ? '· plaćeno' : '· nije plaćeno') : ''}</div>
            <div><span className="text-ink-400">Preuzimanje:</span> {req.pickupLocation}</div>
            {req.note ? <div className="sm:col-span-2"><span className="text-ink-400">Napomena:</span> {req.note}</div> : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {req.feeKM > 0 ? (
              <Button size="sm" variant={req.paid ? 'ghost' : 'brass'} onClick={onTogglePaid}>
                {req.paid ? 'Poništi naplatu' : 'Naplaćeno'}
              </Button>
            ) : null}

            {req.status === 'podnesen' ? (
              <Button size="sm" variant="primary" onClick={() => onStatus('u_obradi')}>Preuzmi u obradu</Button>
            ) : null}
            {req.status === 'u_obradi' ? (
              <Button size="sm" variant="primary" onClick={() => onStatus('spreman')}>Označi spremnim</Button>
            ) : null}
            {req.status === 'spreman' ? (
              <Button
                size="sm"
                variant="primary"
                disabled={feeUnsettled}
                title={feeUnsettled ? 'Prvo evidentirajte naplatu' : undefined}
                onClick={() => onStatus('preuzet')}
              >
                Izdaj (preuzeto)
              </Button>
            ) : null}
            {req.status !== 'preuzet' && req.status !== 'odbijen' ? (
              <Button size="sm" variant="danger" onClick={() => onStatus('odbijen')}>Odbij</Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="border border-paper-200 bg-paper-0 p-3 text-center">
      <div className="mb-1 flex justify-center text-brass-600">{icon}</div>
      <div className="font-mono text-xl font-medium tabular-nums text-ink-800">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
    </div>
  );
}
