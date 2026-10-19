import { useMemo, useState } from 'react';
import { FileText, Plus, X, Wand2, Send, Printer, Check, Clock } from 'lucide-react';
import { useStore } from '../../app/store';
import { useSoftić } from '../officer/useOfficer';
import { world } from '../../data/world';
import { composeReport } from '../../domain/reportTemplates';
import {
  REPORT_KIND_LABEL,
  REPORT_STATUS_LABEL,
  type PoliceReport,
  type ReportKind,
  type ReportStatus,
} from '../../data/types';
import { formatBs } from '../../data/generator/dates';
import { street } from '../../app/places';

// P06 — pisanje dokumenata. Policajac unese kratak opis, sistem sastavi dokument
// po obrascu, on ga doradi, preda i naruči štampu u stanici.

const KINDS: ReportKind[] = ['sluzbena_zabiljeska', 'izvjestaj', 'prekrsajna_prijava'];

const STATUS_TONE: Record<ReportStatus, string> = {
  nacrt: 'bg-paper-200 text-ink-600',
  predan: 'bg-navy-900/10 text-navy-700',
  za_stampu: 'bg-signal-warn/15 text-signal-warn',
  odstampan: 'bg-signal-ok/15 text-signal-ok',
};

export function P06Izvjestaji() {
  const officer = useSoftić();
  const store = useStore();
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const mine = useMemo(
    () =>
      store.reports
        .filter((r) => r.officerId === officer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [store.reports, officer.id],
  );

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">Dokumenti</div>
          <h1 className="mt-0.5 text-xl font-heading font-medium text-ink-800">Moji izvještaji</h1>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="inline-flex items-center gap-1.5 bg-navy-900 px-3 py-2 text-sm text-paper-50 transition hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          Novi
        </button>
      </div>

      <p className="text-sm text-ink-500">
        Napiši kratko šta se desilo — sistem sastavi dokument po obrascu. Kad ga predaš, možeš tražiti
        štampu u stanici umjesto da čekaš slobodan računar poslije smjene.
      </p>

      {mine.length === 0 ? (
        <div className="border border-dashed border-paper-300 px-4 py-10 text-center text-sm text-ink-500">
          Nema dokumenata. Klikni „Novi" da sastaviš prvi.
        </div>
      ) : (
        <ul className="space-y-2">
          {mine.map((r) => (
            <li key={r.id} className="border border-paper-200 bg-paper-0">
              <button
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-paper-50"
              >
                <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center bg-paper-100 text-ink-600">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink-800">{REPORT_KIND_LABEL[r.kind]}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink-500">{r.summary}</span>
                  <span className="mt-0.5 block text-[11px] text-ink-400">{formatBs(r.createdAt.slice(0, 10))}</span>
                </span>
                <span className={`flex-none px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_TONE[r.status]}`}>
                  {REPORT_STATUS_LABEL[r.status]}
                </span>
              </button>

              {openId === r.id ? (
                <div className="border-t border-paper-100 bg-paper-50 p-4">
                  <pre className="mb-3 max-h-64 overflow-y-auto whitespace-pre-wrap border border-paper-200 bg-paper-0 p-3 font-sans text-[13px] leading-relaxed text-ink-700">
                    {r.body}
                  </pre>
                  <div className="flex flex-wrap gap-2">
                    {r.status === 'nacrt' ? (
                      <button
                        onClick={() => {
                          store.setReportStatus(r.id, 'predan');
                          flash('Dokument predan stanici.');
                        }}
                        className="inline-flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 text-xs text-paper-50 hover:bg-navy-800"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Predaj stanici
                      </button>
                    ) : null}
                    {r.status === 'predan' ? (
                      <button
                        onClick={() => {
                          store.setReportStatus(r.id, 'za_stampu');
                          flash('Označeno za štampu — preuzmi u stanici.');
                        }}
                        className="inline-flex items-center gap-1.5 border border-paper-300 bg-paper-0 px-3 py-1.5 text-xs text-ink-700 hover:border-brass-500"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Označi za štampu
                      </button>
                    ) : null}
                    {r.status === 'za_stampu' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-signal-warn">
                        <Clock className="h-3.5 w-3.5" />
                        Čeka štampu u stanici
                      </span>
                    ) : null}
                    {r.status === 'odstampan' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-signal-ok">
                        <Check className="h-3.5 w-3.5" />
                        Odštampano — preuzmi kod dežurnog
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {composing ? (
        <ComposeDialog
          onClose={() => setComposing(false)}
          onSaved={() => {
            setComposing(false);
            flash('Dokument sastavljen i sačuvan kao nacrt.');
          }}
        />
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2 lg:bottom-6">
          <div className="rounded-full bg-navy-900 px-4 py-2 text-sm text-paper-50">{toast}</div>
        </div>
      ) : null}
    </div>
  );
}

function ComposeDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const officer = useSoftić();
  const store = useStore();
  const [kind, setKind] = useState<ReportKind>('sluzbena_zabiljeska');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');

  const station = world.orgNodes.find((n) => n.id === 'ps-centar');

  const draft = () => {
    setBody(
      composeReport({
        officer,
        station,
        summary: summary.trim(),
        kind,
        location: location.trim() || undefined,
      }),
    );
  };

  const save = () => {
    const text = body || composeReport({ officer, station, summary: summary.trim(), kind });
    store.saveReport({
      officerId: officer.id,
      psId: 'ps-centar',
      kind,
      summary: summary.trim(),
      body: text,
    } as Parameters<typeof store.saveReport>[0]);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full overflow-y-auto bg-paper-0 p-5 sm:max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg text-ink-800">Novi dokument</h3>
          <button onClick={onClose} aria-label="Zatvori">
            <X className="h-4 w-4 text-ink-500 hover:text-ink-800" />
          </button>
        </div>

        <div className="mb-3">
          <span className="mb-1 block text-xs font-medium text-ink-600">Vrsta dokumenta</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`border px-3 py-2 text-sm transition ${
                  kind === k ? 'border-navy-900 bg-navy-900 text-paper-50' : 'border-paper-200 bg-paper-50 text-ink-700 hover:border-navy-500'
                }`}
              >
                {REPORT_KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Mjesto događaja (nije obavezno)</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={`npr. u ul. ${street(0)}`}
            className="w-full border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
          />
        </label>

        <label className="mb-2 block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Kratak opis — svojim riječima</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Npr. Zatekao sam dvojicu u svađi ispred lokala, smirili su se nakon upozorenja."
            className="w-full resize-none border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
          />
        </label>

        <button
          onClick={draft}
          disabled={!summary.trim()}
          className="mb-4 inline-flex items-center gap-2 border border-brass-500 bg-brass-100 px-3 py-2 text-sm text-brass-800 transition hover:bg-brass-300 disabled:opacity-40"
        >
          <Wand2 className="h-4 w-4" />
          Sastavi dokument
        </button>

        {body ? (
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-medium text-ink-600">
              Sastavljen dokument — provjeri i po potrebi doradi
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full resize-none border border-paper-200 bg-paper-50 px-3 py-2 font-mono text-[12px] leading-relaxed text-ink-800"
            />
          </label>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm text-ink-600 hover:bg-paper-100">
            Odustani
          </button>
          <button
            onClick={save}
            disabled={!summary.trim()}
            className="bg-navy-900 px-3 py-2 text-sm text-paper-50 transition hover:bg-navy-800 disabled:opacity-40"
          >
            Sačuvaj nacrt
          </button>
        </div>
      </div>
    </div>
  );
}

export type { PoliceReport };
