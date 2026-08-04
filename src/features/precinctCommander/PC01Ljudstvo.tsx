import { useEffect, useMemo, useState } from 'react';
import { Search, X, Users, ChevronRight, ShieldCheck, AlertTriangle, Clock, Backpack } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import {
  EQUIPMENT_LABEL,
  RANK_LABEL,
  SHIFT_TIME,
  type Officer,
  type OfficerStatus,
} from '../../data/types';
import { DEMO_TODAY, formatBs } from '../../data/generator/dates';
import { LAST_COMPLETE_MONTH } from '../../domain/unitStats';

// PC01 — ljudstvo stanice. Komandir treba pojedinačne podatke: ko je gdje,
// šta mu ističe, koliko radi i šta je zadužio.

const STATUS_LABEL: Record<OfficerStatus, string> = {
  aktivan: 'Aktivan',
  godisnji: 'Godišnji',
  bolovanje: 'Bolovanje',
  slobodan_dan: 'Slobodan dan',
};

const STATUS_TONE: Record<OfficerStatus, string> = {
  aktivan: 'bg-signal-ok/15 text-signal-ok',
  godisnji: 'bg-brass-300/40 text-brass-800',
  bolovanje: 'bg-signal-warn/15 text-signal-warn',
  slobodan_dan: 'bg-paper-200 text-ink-600',
};

export function PC01Ljudstvo() {
  const w = useScopedWorld();
  const session = useSession();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OfficerStatus | 'sve'>('sve');
  const [smjenaFilter, setSmjenaFilter] = useState<string | 'sve'>('sve');
  const [selected, setSelected] = useState<Officer | null>(null);

  const smjene = useMemo(() => w.orgNodes.filter((n) => n.kind === 'smjena'), [w.orgNodes]);
  const nodeName = (id: string) => w.orgNodes.find((n) => n.id === id)?.name ?? id;

  /** Certifikat koji je istekao ili ističe u 30 dana — komandirov glavni alarm. */
  const certFlag = (o: Officer) => {
    const soon = new Date(DEMO_TODAY);
    soon.setDate(soon.getDate() + 30);
    const soonIso = soon.toISOString().slice(0, 10);
    let expired = 0;
    let expiring = 0;
    for (const c of o.certifications) {
      if (!c.expires) continue; // trajni
      if (c.expires < DEMO_TODAY) expired += 1;
      else if (c.expires < soonIso) expiring += 1;
    }
    return { expired, expiring };
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return w.officers
      .filter((o) => (statusFilter === 'sve' ? true : o.status === statusFilter))
      .filter((o) => (smjenaFilter === 'sve' ? true : o.orgNodeId === smjenaFilter))
      .filter((o) => (q ? o.name.toLowerCase().includes(q) || RANK_LABEL[o.rank].includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'bs'));
  }, [w.officers, query, statusFilter, smjenaFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { aktivan: 0, godisnji: 0, bolovanje: 0, slobodan_dan: 0 };
    for (const o of w.officers) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [w.officers]);

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Ljudstvo</div>
        <h1 className="font-heading text-2xl text-ink-800">{session.scopeLabel} · {w.officers.length} policajaca</h1>
      </div>
      <p className="mb-5 mt-1 text-sm text-ink-500">
        Aktivnih {counts.aktivan} · godišnji {counts.godisnji} · bolovanje {counts.bolovanje} · slobodan dan{' '}
        {counts.slobodan_dan}
      </p>

      <section className="mb-4 border border-paper-200 bg-paper-0 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[220px] flex-1">
            <span className="mb-1 block text-[11px] font-medium text-ink-500">Pretraga</span>
            <div className="flex items-center gap-2 border border-paper-200 bg-paper-50 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 flex-none text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ime ili čin…"
                className="w-full bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
              />
              {query ? (
                <button onClick={() => setQuery('')} aria-label="Očisti">
                  <X className="h-3.5 w-3.5 text-ink-400 hover:text-ink-700" />
                </button>
              ) : null}
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-ink-500">Smjenska grupa</span>
            <select
              value={smjenaFilter}
              onChange={(e) => setSmjenaFilter(e.target.value)}
              className="border border-paper-200 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-800"
            >
              <option value="sve">Sve grupe</option>
              {smjene.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          <Chip active={statusFilter === 'sve'} onClick={() => setStatusFilter('sve')}>Svi statusi</Chip>
          {(Object.keys(STATUS_LABEL) as OfficerStatus[]).map((st) => (
            <Chip key={st} active={statusFilter === st} onClick={() => setStatusFilter(st)}>
              {STATUS_LABEL[st]} ({counts[st] ?? 0})
            </Chip>
          ))}
        </div>
      </section>

      <section className="border border-paper-200 bg-paper-0">
        <div className="flex items-center justify-between border-b border-paper-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-500" />
            <span className="section-label">Spisak ({rows.length})</span>
          </div>
          <span className="text-[11px] text-ink-400">Klikni policajca za detalje</span>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-ink-500">Nema rezultata.</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 bg-paper-0">
                <tr className="border-b border-paper-200 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Policajac</th>
                  <th className="px-3 py-2.5 font-medium">Čin</th>
                  <th className="px-3 py-2.5 font-medium">Grupa</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Certifikati</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const flag = certFlag(o);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelected(o)}
                      className="cursor-pointer border-b border-paper-100 transition last:border-0 hover:bg-paper-50"
                    >
                      <td className="px-5 py-2.5 font-medium text-ink-800">{o.name}</td>
                      <td className="px-3 py-2.5 text-ink-600">{RANK_LABEL[o.rank]}</td>
                      <td className="px-3 py-2.5 text-[11px] text-ink-500">{nodeName(o.orgNodeId)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_TONE[o.status]}`}>
                          {STATUS_LABEL[o.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {flag.expired > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-signal-alarm">
                            <AlertTriangle className="h-3 w-3" />
                            {flag.expired} istekao
                          </span>
                        ) : flag.expiring > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-signal-warn">
                            <Clock className="h-3 w-3" />
                            ističe {flag.expiring}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-signal-ok">
                            <ShieldCheck className="h-3 w-3" />u redu
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-paper-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? <OfficerDrawer officer={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function OfficerDrawer({ officer, onClose }: { officer: Officer; onClose: () => void }) {
  const w = useScopedWorld();

  // Esc zatvara panel — inače zastor ostane i blokira klikove.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const perf = w.performance.find((p) => p.officerId === officer.id && p.yearMonth === LAST_COMPLETE_MONTH);
  const shifts = w.shifts.filter((s) => s.slots.some((sl) => sl.assignedOfficerIds.includes(officer.id)));
  const nightShifts = shifts.filter((s) => SHIFT_TIME[s.kind].night).length;
  const roleName = (id: string) => w.operationalRoles.find((r) => r.id === id)?.name ?? id;
  const certName = (id: string) => w.certifications.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="fixed inset-0 z-30 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="flex w-full max-w-md flex-col bg-paper-0">
        <div className="flex items-start justify-between border-b border-paper-200 px-5 py-4">
          <div>
            <div className="font-heading text-lg text-ink-800">{officer.name}</div>
            <div className="text-xs text-ink-500">
              {RANK_LABEL[officer.rank]} · {w.orgNodes.find((n) => n.id === officer.orgNodeId)?.name}
            </div>
          </div>
          <button onClick={onClose} aria-label="Zatvori">
            <X className="h-4 w-4 text-ink-500 hover:text-ink-800" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-2">
            <Mini label="Status" value={STATUS_LABEL[officer.status]} />
            <Mini label="Smjena ovaj mjesec" value={`${shifts.length}`} />
            <Mini label="Noćnih" value={`${nightShifts}`} />
          </div>

          <Section title="Operativne uloge">
            {officer.operationalRoleIds.length === 0 ? (
              <p className="text-sm text-ink-500">Nema dodijeljenih operativnih uloga.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {officer.operationalRoleIds.map((id) => (
                  <span key={id} className="border border-paper-300 bg-paper-50 px-2 py-0.5 text-[11px] text-ink-700">
                    {roleName(id)}
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section title="Certifikati">
            <ul className="space-y-1.5">
              {officer.certifications.map((c) => {
                const permanent = !c.expires;
                const expired = !permanent && c.expires! < DEMO_TODAY;
                return (
                  <li key={c.certId} className="flex items-center justify-between text-sm">
                    <span className="text-ink-700">{certName(c.certId)}</span>
                    <span className={`text-[11px] ${expired ? 'text-signal-alarm' : 'text-ink-500'}`}>
                      {permanent ? 'trajno' : expired ? `istekao ${formatBs(c.expires!)}` : `do ${formatBs(c.expires!)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section title="Zaduženja">
            <ul className="space-y-1.5">
              {officer.equipmentAssigned.map((e) => (
                <li key={e.equipmentId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-ink-700">
                    <Backpack className="h-3 w-3 text-ink-400" />
                    {EQUIPMENT_LABEL[e.type]}
                  </span>
                  <span className="font-mono text-[11px] text-ink-500">{e.identifier}</span>
                </li>
              ))}
            </ul>
          </Section>

          {perf ? (
            <Section title={`Učinak · ${LAST_COMPLETE_MONTH}`}>
              <div className="grid grid-cols-2 gap-2">
                <Mini label="Intervencije" value={String(perf.intervencije)} />
                <Mini label="Prekršajni" value={String(perf.prekrsajni)} />
                <Mini label="Prekovremeni" value={`${perf.sati.prekovremeni} h`} />
                <Mini label="Noćni rad" value={`${perf.sati.nocni} h`} />
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="section-label mb-2 text-brass-600">{title}</div>
      {children}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-paper-200 bg-paper-50 p-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className="mt-0.5 font-mono text-sm text-ink-800">{value}</div>
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
