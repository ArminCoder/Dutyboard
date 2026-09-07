import { useMemo, useState } from 'react';
import { FileText, Printer, Check, Inbox, Eye, X } from 'lucide-react';
import { useStore } from '../../app/store';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { useOrg } from '../../app/OrgContext';
import {
  REPORT_KIND_LABEL,
  REPORT_STATUS_LABEL,
  type PoliceReport,
  type ReportStatus,
} from '../../data/types';
import { formatBs } from '../../data/generator/dates';

// PC03 — dokumenti stanice. Komandir vidi šta je predano i vodi red za štampu:
// policajac ne mora tražiti slobodan računar i štampač poslije smjene.

const STATUS_TONE: Record<ReportStatus, string> = {
  nacrt: 'bg-paper-200 text-ink-600',
  predan: 'bg-navy-900/10 text-navy-700',
  za_stampu: 'bg-signal-warn/15 text-signal-warn',
  odstampan: 'bg-signal-ok/15 text-signal-ok',
};

export function PC03Dokumenti() {
  const store = useStore();
  const w = useScopedWorld();
  const session = useSession();
  const [filter, setFilter] = useState<ReportStatus | 'sve'>('sve');
  const [openId, setOpenId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PoliceReport | null>(null);

  const stationIds = useMemo(
    () => new Set(w.orgNodes.filter((n) => n.kind === 'ps').map((n) => n.id)),
    [w.orgNodes],
  );
  const officerName = (id: string) => w.officers.find((o) => o.id === id)?.name ?? 'Nepoznat';

  /** Nacrti su privatni dok ih policajac ne preda — komandir vidi tek predano. */
  const docs = useMemo(
    () =>
      store.reports
        .filter((r) => stationIds.has(r.psId) && r.status !== 'nacrt')
        .filter((r) => (filter === 'sve' ? true : r.status === filter))
        .sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt)),
    [store.reports, stationIds, filter],
  );

  const queue = store.reports.filter((r) => stationIds.has(r.psId) && r.status === 'za_stampu').length;
  const counts = (st: ReportStatus) =>
    store.reports.filter((r) => stationIds.has(r.psId) && r.status === st).length;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Dokumenti stanice</div>
        <h1 className="font-heading text-2xl text-ink-800">Predani izvještaji i red za štampu</h1>
      </div>
      <p className="mb-5 mt-1 text-sm text-ink-500">
        {session.scopeLabel} · {queue > 0 ? `${queue} dokument(a) čeka štampu` : 'nema dokumenata za štampu'}
      </p>

      <div className="mb-4 flex flex-wrap gap-1">
        <Chip active={filter === 'sve'} onClick={() => setFilter('sve')}>Svi</Chip>
        {(['predan', 'za_stampu', 'odstampan'] as ReportStatus[]).map((st) => (
          <Chip key={st} active={filter === st} onClick={() => setFilter(st)}>
            {REPORT_STATUS_LABEL[st]} ({counts(st)})
          </Chip>
        ))}
      </div>

      <section className="border border-paper-200 bg-paper-0">
        <div className="flex items-center gap-2 border-b border-paper-200 px-5 py-3">
          <Inbox className="h-4 w-4 text-ink-500" />
          <span className="section-label">Pristigli dokumenti ({docs.length})</span>
        </div>
        {docs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-ink-500">Nema dokumenata za zadati filter.</div>
        ) : (
          <ul className="divide-y divide-paper-100">
            {docs.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  className="flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-paper-50"
                >
                  <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center bg-paper-100 text-ink-600">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-800">{REPORT_KIND_LABEL[r.kind]}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-500">{r.summary}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-400">
                      {officerName(r.officerId)} · {formatBs((r.submittedAt ?? r.createdAt).slice(0, 10))}
                    </span>
                  </span>
                  <span className={`flex-none px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_TONE[r.status]}`}>
                    {REPORT_STATUS_LABEL[r.status]}
                  </span>
                </button>

                {openId === r.id ? (
                  <div className="border-t border-paper-100 bg-paper-50 px-5 py-4">
                    <pre className="mb-3 max-h-72 overflow-y-auto whitespace-pre-wrap border border-paper-200 bg-paper-0 p-3 font-sans text-[13px] leading-relaxed text-ink-700">
                      {r.body}
                    </pre>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPreview(r)}
                        className="inline-flex items-center gap-1.5 border border-paper-300 bg-paper-0 px-3 py-1.5 text-xs text-ink-700 hover:border-brass-500"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Pregledaj
                      </button>
                      {r.status === 'za_stampu' ? (
                        <button
                          onClick={() => store.setReportStatus(r.id, 'odstampan')}
                          className="inline-flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 text-xs text-paper-50 hover:bg-navy-800"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Označi kao odštampano
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {preview ? (
        <DocumentPreview
          report={preview}
          authorName={officerName(preview.officerId)}
          onClose={() => setPreview(null)}
          onPrinted={() => {
            window.print();
            if (preview.status === 'za_stampu') store.setReportStatus(preview.id, 'odstampan');
            setPreview(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** Pregled dokumenta prije štampe — komandir može provjeriti sadržaj bez štampanja. */
function DocumentPreview({
  report,
  authorName,
  onClose,
  onPrinted,
}: {
  report: PoliceReport;
  authorName: string;
  onClose: () => void;
  onPrinted: () => void;
}) {
  const { org } = useOrg();
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 print:hidden" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col bg-paper-0">
        <div className="flex items-center justify-between border-b border-paper-200 px-4 py-2.5">
          <span className="section-label text-brass-600">Pregled dokumenta</span>
          <button onClick={onClose} aria-label="Zatvori" className="p-1 text-ink-500 hover:text-ink-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List papira — kako dokument izgleda odštampan */}
        <div className="overflow-y-auto px-8 py-8">
          <div className="text-center">
            <div className="section-label text-brass-600">{org.orgName}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-400">{REPORT_KIND_LABEL[report.kind]}</div>
            <div className="mx-auto mt-2 h-px w-16 bg-brass-400" />
          </div>
          <div className="mt-5 flex justify-between text-[11px] text-ink-500">
            <span>Sačinio: <span className="text-ink-700">{authorName}</span></span>
            <span>{formatBs((report.submittedAt ?? report.createdAt).slice(0, 10))}</span>
          </div>
          <h2 className="mt-4 font-heading text-lg text-ink-800">{report.summary}</h2>
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-700">{report.body}</p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-paper-200 px-4 py-3">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-ink-600 hover:bg-paper-100">
            Zatvori
          </button>
          <button
            onClick={onPrinted}
            className="inline-flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 text-xs text-paper-50 hover:bg-navy-800"
          >
            <Printer className="h-3.5 w-3.5" />
            Štampaj
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-medium transition ${
        active ? 'bg-navy-900 text-paper-50' : 'bg-paper-100 text-ink-600 hover:bg-paper-200'
      }`}
    >
      {children}
    </button>
  );
}
