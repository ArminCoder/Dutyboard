import { useMemo, useState } from 'react';
import { Send, CheckCircle2, Activity, ShieldAlert, FileText } from 'lucide-react';
import { useScopedKdd } from '../kdd/useScopedKdd';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { useStore } from '../../app/store';
import { world } from '../../data/world';
import { DEMO_TODAY, dayNameBs, formatBs } from '../../data/generator/dates';
import { KDD_TYPE_LABEL } from '../../data/types';

// K07 — bilten smjene. Na kraju smjene šef prijavljuje šta se dogodilo;
// brojevi su predloženi iz knjige događaja, a bilten ide OKC-u i u jutarnji brifing.

export function K07Bilten() {
  const { entries } = useScopedKdd();
  const w = useScopedWorld();
  const session = useSession();
  const store = useStore();

  const psId = useMemo(() => {
    const node = w.orgNodes.find((n) => n.id === session.scopeNodeId);
    if (node?.kind === 'ps') return node.id;
    if (node?.kind === 'smjena' && node.parentId) return node.parentId;
    return w.orgNodes.find((n) => n.kind === 'ps')?.id ?? 'ps-centar';
  }, [w.orgNodes, session.scopeNodeId]);

  const submittedBy =
    world.officers.find((o) => o.id === session.identityOfficerId)?.name ?? 'Šef smjene';

  /** Upisi iz tekuće smjene — osnova za prijedlog brojeva. */
  const todays = useMemo(
    () => entries.filter((e) => e.psId === psId && e.when.startsWith(DEMO_TODAY)),
    [entries, psId],
  );
  const auto = useMemo(
    () => ({
      intervencije: todays.filter((e) => e.type === 'intervencija').length,
      dogadjaji: todays.filter((e) => e.type !== 'intervencija').length,
    }),
    [todays],
  );

  const existing = store.biltens.find(
    (b) => b.psId === psId && b.shiftDate === DEMO_TODAY && b.shiftKind === 'II',
  );

  const [dogadjaji, setDogadjaji] = useState(auto.dogadjaji);
  const [intervencije, setIntervencije] = useState(auto.intervencije);
  const [nalozi, setNalozi] = useState(existing?.counts.prekrsajniNalozi ?? 6);
  const [note, setNote] = useState(existing?.note ?? '');
  const [sent, setSent] = useState(Boolean(existing));

  const submit = () => {
    store.submitBilten({
      psId,
      shiftDate: DEMO_TODAY,
      shiftKind: 'II',
      counts: { dogadjaji, intervencije, prekrsajniNalozi: nalozi },
      note: note.trim() || undefined,
      submittedBy,
    });
    setSent(true);
  };

  const openEntries = todays.filter((e) => e.status !== 'zakljucen');

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Bilten smjene</div>
        <h1 className="font-heading text-2xl text-ink-800">
          Izvještaj za {dayNameBs(DEMO_TODAY)}, {formatBs(DEMO_TODAY)} · II smjena
        </h1>
      </div>
      <p className="mb-5 mt-1 text-sm text-ink-500">
        Brojevi su predloženi iz knjige događaja ({todays.length} upisa u smjeni). Provjeri, dopuni i
        pošalji OKC-u — bilten ulazi u jutarnji brifing za komesara.
      </p>

      <section className="mb-4 border border-paper-200 bg-paper-0">
        <div className="border-b border-paper-200 px-5 py-3">
          <div className="section-label">Brojčano stanje</div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <NumField icon={<Activity className="h-3.5 w-3.5" />} label="Događaji" value={dogadjaji} onChange={setDogadjaji} hint={`iz knjige: ${auto.dogadjaji}`} />
          <NumField icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Intervencije" value={intervencije} onChange={setIntervencije} hint={`iz knjige: ${auto.intervencije}`} />
          <NumField icon={<FileText className="h-3.5 w-3.5" />} label="Prekršajni nalozi" value={nalozi} onChange={setNalozi} hint="unosi se ručno" />
        </div>
        <div className="border-t border-paper-200 p-5">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Napomena za OKC</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Npr. bez težih incidenata."
              className="w-full resize-none border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
            />
          </label>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={submit}
              className="inline-flex items-center gap-2 bg-navy-900 px-4 py-2 text-sm text-paper-50 transition hover:bg-navy-800"
            >
              <Send className="h-4 w-4" />
              {sent ? 'Pošalji ispravku' : 'Pošalji bilten OKC-u'}
            </button>
            {sent ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-signal-ok">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Bilten je poslan.
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {openEntries.length > 0 ? (
        <section className="border border-signal-warn/30 bg-signal-warn/5">
          <div className="border-b border-signal-warn/20 px-5 py-3">
            <div className="section-label text-signal-warn">Nezaključeni upisi ({openEntries.length})</div>
            <p className="mt-0.5 text-[11px] text-ink-500">
              Preuzima ih naredna smjena — navedi ih u napomeni ako traže postupanje.
            </p>
          </div>
          <ul className="divide-y divide-signal-warn/15">
            {openEntries.map((e) => (
              <li key={e.id} className="px-5 py-2.5">
                <div className="text-sm text-ink-800">{e.description}</div>
                <div className="text-[11px] text-ink-500">
                  {e.when.slice(11, 16)} · {KDD_TYPE_LABEL[e.type]}
                  {e.assignedPatrol ? ` · ${e.assignedPatrol}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function NumField({
  icon,
  label,
  value,
  onChange,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-600">
        {icon}
        {label}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full border border-paper-200 bg-paper-50 px-3 py-2 text-center font-mono text-lg text-ink-800"
      />
      <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>
    </label>
  );
}
