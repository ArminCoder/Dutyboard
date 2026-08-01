import { useMemo, useState } from 'react';
import { BookOpen, Plus, Search, X, ChevronDown, CheckCircle2, Clock, CircleDot } from 'lucide-react';
import { useScopedKdd } from './useScopedKdd';
import { useStore } from '../../app/store';
import { useSession } from '../../app/RoleContext';
import { world } from '../../data/world';
import {
  KDD_STATUS_LABEL,
  KDD_TYPE_LABEL,
  type KddEntry,
  type KddEntryStatus,
  type KddEntryType,
} from '../../data/types';
import { DEMO_TODAY, dayNameBs, demoNow, formatBs } from '../../data/generator/dates';

// Knjiga dnevnih događaja — jedan ekran za sve uloge.
// Šef smjene upisuje (canWrite), komandir/načelnik/komesar čitaju i pretražuju.

const TYPES: KddEntryType[] = ['poziv_122', 'intervencija', 'dogadjaj', 'ostalo'];

const STATUS_TONE: Record<KddEntryStatus, string> = {
  otvoren: 'bg-signal-warn/15 text-signal-warn',
  u_toku: 'bg-navy-900/10 text-navy-700',
  zakljucen: 'bg-signal-ok/15 text-signal-ok',
};

const STATUS_ICON: Record<KddEntryStatus, typeof CircleDot> = {
  otvoren: CircleDot,
  u_toku: Clock,
  zakljucen: CheckCircle2,
};

export function KddBook({ canWrite = false }: { canWrite?: boolean }) {
  const { entries, stations } = useScopedKdd();
  const session = useSession();

  const [date, setDate] = useState<string>(DEMO_TODAY);
  const [allDates, setAllDates] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<KddEntryType | 'sve'>('sve');
  const [psFilter, setPsFilter] = useState<string | 'sve'>('sve');
  const [composing, setComposing] = useState(false);

  const multiStation = stations.length > 1;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (!allDates && !e.when.startsWith(date)) return false;
      if (type !== 'sve' && e.type !== type) return false;
      if (psFilter !== 'sve' && e.psId !== psFilter) return false;
      if (!q) return true;
      return (
        e.description.toLowerCase().includes(q) ||
        (e.assignedPatrol ?? '').toLowerCase().includes(q) ||
        (e.outcome ?? '').toLowerCase().includes(q) ||
        e.recordedBy.toLowerCase().includes(q)
      );
    });
  }, [entries, date, allDates, type, psFilter, query]);

  const openCount = filtered.filter((e) => e.status !== 'zakljucen').length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="section-label text-brass-600">Knjiga dnevnih događaja</div>
          <h1 className="font-heading text-2xl text-ink-800">
            {canWrite ? 'Evidencija poziva i događaja' : 'Pregled knjige događaja'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {canWrite
              ? 'Svaki poziv i događaj u smjeni se upisuje hronološki i ostaje trajno zapisan.'
              : `Pregled i pretraga upisa · ${session.scopeLabel}`}
          </p>
        </div>
        {canWrite ? (
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-2 bg-navy-900 px-3 py-2 text-sm text-paper-50 transition hover:bg-navy-800"
          >
            <Plus className="h-4 w-4" />
            Novi upis
          </button>
        ) : null}
      </div>

      {/* Filteri */}
      <section className="mb-4 border border-paper-200 bg-paper-0 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-ink-500">Datum</span>
            <input
              type="date"
              value={date}
              disabled={allDates}
              onChange={(e) => setDate(e.target.value)}
              className="border border-paper-200 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-800 disabled:opacity-50"
            />
          </label>
          <label className="flex items-center gap-1.5 pb-2 text-xs text-ink-600">
            <input type="checkbox" checked={allDates} onChange={(e) => setAllDates(e.target.checked)} />
            Svi datumi
          </label>

          <label className="block min-w-[200px] flex-1">
            <span className="mb-1 block text-[11px] font-medium text-ink-500">Pretraga</span>
            <div className="flex items-center gap-2 border border-paper-200 bg-paper-50 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 flex-none text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="opis, patrola, ishod…"
                className="w-full bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
              />
              {query ? (
                <button onClick={() => setQuery('')} aria-label="Očisti pretragu">
                  <X className="h-3.5 w-3.5 text-ink-400 hover:text-ink-700" />
                </button>
              ) : null}
            </div>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1">
          <FilterChip active={type === 'sve'} onClick={() => setType('sve')}>Sve vrste</FilterChip>
          {TYPES.map((t) => (
            <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
              {KDD_TYPE_LABEL[t]}
            </FilterChip>
          ))}
        </div>

        {multiStation ? (
          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-paper-100 pt-2">
            <span className="mr-1 text-[11px] text-ink-400">Stanica:</span>
            <FilterChip active={psFilter === 'sve'} onClick={() => setPsFilter('sve')}>Sve</FilterChip>
            {stations.map((s) => (
              <FilterChip key={s.id} active={psFilter === s.id} onClick={() => setPsFilter(s.id)}>
                {s.name}
              </FilterChip>
            ))}
          </div>
        ) : null}
      </section>

      {/* Lista */}
      <section className="border border-paper-200 bg-paper-0">
        <div className="flex items-center justify-between border-b border-paper-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-ink-500" />
            <span className="section-label">
              {allDates ? 'Svi upisi' : `${dayNameBs(date)}, ${formatBs(date)}`}
            </span>
          </div>
          <span className="text-[11px] text-ink-500">
            {filtered.length} upisa{openCount > 0 ? ` · ${openCount} nezaključeno` : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-ink-500">
            Nema upisa za zadate kriterije.
          </div>
        ) : (
          <ul className="divide-y divide-paper-100">
            {filtered.map((e) => (
              <EntryRow key={e.id} entry={e} canWrite={canWrite} showStation={multiStation} />
            ))}
          </ul>
        )}
      </section>

      {composing ? <NewEntryDialog onClose={() => setComposing(false)} /> : null}
    </div>
  );
}

function EntryRow({ entry, canWrite, showStation }: { entry: KddEntry; canWrite: boolean; showStation: boolean }) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState('');
  const StatusIcon = STATUS_ICON[entry.status];
  const station = world.orgNodes.find((n) => n.id === entry.psId);

  const close = () => {
    store.updateKddEntry(entry.id, {
      status: 'zakljucen',
      outcome: outcome.trim() || 'Postupljeno po prijavi.',
    });
    setOpen(false);
  };

  return (
    <li>
      <button onClick={() => setOpen(!open)} className="flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-paper-50">
        <span className="mt-0.5 w-12 flex-none font-mono text-xs text-ink-500">{entry.when.slice(11, 16)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink-800">{entry.description}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
            <span className="border border-paper-300 px-1.5 py-0.5 uppercase tracking-wider">
              {KDD_TYPE_LABEL[entry.type]}
            </span>
            {showStation && station ? <span>{station.name}</span> : null}
            {entry.assignedPatrol ? <span>· {entry.assignedPatrol}</span> : null}
            <span>· upisao {entry.recordedBy}</span>
          </span>
        </span>
        <span className={`inline-flex flex-none items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_TONE[entry.status]}`}>
          <StatusIcon className="h-3 w-3" />
          {KDD_STATUS_LABEL[entry.status]}
        </span>
        <ChevronDown className={`mt-0.5 h-4 w-4 flex-none text-paper-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="border-t border-paper-100 bg-paper-50 px-5 py-3 pl-[4.25rem]">
          {entry.outcome ? (
            <div className="text-sm text-ink-700">
              <span className="section-label mr-2">Ishod</span>
              {entry.outcome}
            </div>
          ) : (
            <div className="text-sm text-ink-500">Ishod još nije evidentiran.</div>
          )}

          {canWrite && entry.status !== 'zakljucen' ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Ishod postupanja…"
                className="min-w-[240px] flex-1 border border-paper-200 bg-paper-0 px-2.5 py-1.5 text-sm text-ink-800"
              />
              <button onClick={close} className="bg-navy-900 px-3 py-1.5 text-sm text-paper-50 transition hover:bg-navy-800">
                Zaključi upis
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function NewEntryDialog({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const session = useSession();
  const officer = session.identityOfficerId
    ? world.officers.find((o) => o.id === session.identityOfficerId)
    : null;
  const psId = useMemo(() => {
    // Šef smjene je vezan za stanicu (scope je PS ili smjena unutar PS).
    const node = world.orgNodes.find((n) => n.id === session.scopeNodeId);
    if (node?.kind === 'ps') return node.id;
    if (node?.kind === 'smjena' && node.parentId) return node.parentId;
    return 'ps-centar';
  }, [session.scopeNodeId]);

  const [type, setType] = useState<KddEntryType>('poziv_122');
  const [description, setDescription] = useState('');
  const [patrol, setPatrol] = useState('');
  const [time, setTime] = useState(demoNow().slice(11, 16));

  const submit = () => {
    if (!description.trim()) return;
    store.addKddEntry({
      psId,
      when: `${DEMO_TODAY}T${time}`,
      type,
      description: description.trim(),
      assignedPatrol: patrol || undefined,
      status: 'otvoren',
      recordedBy: officer?.name ?? 'Šef smjene',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-paper-0 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg text-ink-800">Novi upis u knjigu</h3>
          <button onClick={onClose} aria-label="Zatvori">
            <X className="h-4 w-4 text-ink-500 hover:text-ink-800" />
          </button>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Vrijeme</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
          />
        </label>

        <div className="mb-3">
          <span className="mb-1 block text-xs font-medium text-ink-600">Vrsta</span>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`border px-3 py-2 text-sm transition ${
                  type === t ? 'border-navy-900 bg-navy-900 text-paper-50' : 'border-paper-200 bg-paper-50 text-ink-700 hover:border-navy-500'
                }`}
              >
                {KDD_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Opis događaja</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Kratak opis — bez ličnih podataka."
            className="w-full resize-none border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Dodijeljena patrola</span>
          <select
            value={patrol}
            onChange={(e) => setPatrol(e.target.value)}
            className="w-full border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-800"
          >
            <option value="">— bez dodjele —</option>
            {store.activePatrols.map((p) => (
              <option key={p.id} value={p.callSign}>{p.callSign}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm text-ink-600 hover:bg-paper-100">
            Odustani
          </button>
          <button
            onClick={submit}
            disabled={!description.trim()}
            className="bg-navy-900 px-3 py-2 text-sm text-paper-50 transition hover:bg-navy-800 disabled:opacity-40"
          >
            Upiši
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
