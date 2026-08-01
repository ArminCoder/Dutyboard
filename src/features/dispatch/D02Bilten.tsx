import { useMemo } from 'react';
import { Inbox, Check, Clock } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useStore } from '../../app/store';
import { DEMO_TODAY, addDays, formatBs } from '../../data/generator/dates';
import type { Bilten, ShiftKind } from '../../data/types';

// D02 — pristigli bilteni smjena. Matrica smjena × stanica; nedostajući bilten
// je narandžast ("čeka se"), nikad crven — nije alarm, nego podsjetnik.

interface SlotDef {
  date: string;
  kind: ShiftKind;
  label: string;
}

export function D02Bilten() {
  const w = useScopedWorld();
  const store = useStore();

  const stations = useMemo(() => w.orgNodes.filter((n) => n.kind === 'ps'), [w.orgNodes]);
  const allowed = useMemo(() => new Set(stations.map((s) => s.id)), [stations]);
  const biltens = useMemo(() => store.biltens.filter((b) => allowed.has(b.psId)), [store.biltens, allowed]);

  // Tekuća (noćna) smjena je prva — u nju stižu bilteni koje šefovi upravo zaključuju.
  const slots: SlotDef[] = [
    { date: DEMO_TODAY, kind: 'II', label: `II smjena · ${formatBs(DEMO_TODAY)} · u toku` },
    { date: DEMO_TODAY, kind: 'I', label: `I smjena · ${formatBs(DEMO_TODAY)}` },
    { date: addDays(DEMO_TODAY, -1), kind: 'II', label: `II smjena · ${formatBs(addDays(DEMO_TODAY, -1))}` },
  ];

  const find = (psId: string, s: SlotDef): Bilten | undefined =>
    biltens.find((b) => b.psId === psId && b.shiftDate === s.date && b.shiftKind === s.kind);

  return (
    <div className="text-dark-text">
      <div className="border-b border-dark-border bg-dark-surface px-6 py-3">
        <div className="section-label text-brass-500">Bilteni smjena</div>
        <h1 className="font-heading text-lg text-dark-text">Pristigli izvještaji stanica</h1>
      </div>

      <div className="space-y-6 px-6 py-5">
        {slots.map((s) => {
          const received = stations.filter((st) => find(st.id, s));
          return (
            <section key={`${s.date}-${s.kind}`} className="border border-dark-border bg-dark-surface">
              <div className="flex items-center justify-between border-b border-dark-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-brass-500" />
                  <span className="font-heading text-base text-dark-text">{s.label}</span>
                </div>
                <span className="text-xs text-dark-muted">
                  {received.length}/{stations.length} primljeno
                </span>
              </div>

              <div className="grid gap-px bg-dark-border sm:grid-cols-2 xl:grid-cols-4">
                {stations.map((st) => {
                  const b = find(st.id, s);
                  return (
                    <div key={st.id} className="bg-dark-surface p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-dark-text">{st.name}</span>
                        {b ? (
                          <span className="inline-flex items-center gap-1 border border-signal-ok/40 bg-signal-ok/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-signal-ok">
                            <Check className="h-2.5 w-2.5" />
                            primljen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 border border-signal-warn/40 bg-signal-warn/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-signal-warn">
                            <Clock className="h-2.5 w-2.5" />
                            čeka se
                          </span>
                        )}
                      </div>

                      {b ? (
                        <>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <Metric label="Događaji" value={b.counts.dogadjaji} />
                            <Metric label="Interv." value={b.counts.intervencije} />
                            <Metric label="Nalozi" value={b.counts.prekrsajniNalozi} />
                          </div>
                          {b.note ? <p className="mt-2 text-[11px] leading-relaxed text-dark-muted">{b.note}</p> : null}
                          <div className="mt-2 text-[10px] text-dark-muted">
                            {b.submittedBy} · {b.submittedAt.slice(11, 16)}
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-dark-muted">Bilten još nije dostavljen.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-dark-border bg-dark-elevated/40 py-1.5">
      <div className="font-mono text-lg font-medium tabular-nums text-dark-text">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-dark-muted">{label}</div>
    </div>
  );
}
