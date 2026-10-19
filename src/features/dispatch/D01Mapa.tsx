import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldCheck, Radio } from 'lucide-react';
import { UNITS } from './routes';
import { UnitsMap } from './UnitsMap';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { useStore } from '../../app/store';
import { DEFAULT_ORG } from '../../app/orgConfig';

// D01 — živa mapa. Scope određuje koje jedinice se vide:
// OKC (Uprava) vidi sve stanice, šef smjene samo svoju.

const NON_RESPONSIVE_UNIT_ID = 'u-5';

export function D01Mapa() {
  const w = useScopedWorld();
  const session = useSession();
  const store = useStore();
  const [now, setNow] = useState(Date.now());
  const [nonResp, setNonResp] = useState<{ startedMs: number; escalated: boolean; provjera: boolean } | null>(null);

  const stations = useMemo(() => w.orgNodes.filter((n) => n.kind === 'ps'), [w.orgNodes]);
  const units = useMemo(() => {
    const allowed = new Set(stations.map((s) => s.id));
    return UNITS.filter((u) => allowed.has(u.psId));
  }, [stations]);

  const hasAlertUnit = units.some((u) => u.id === NON_RESPONSIVE_UNIT_ID);

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 800);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (!nonResp || nonResp.escalated) return;
    const int = setInterval(() => {
      const seconds = (Date.now() - nonResp.startedMs) / 1000;
      if (nonResp.provjera && seconds > 6) {
        setNonResp((s) => (s ? { ...s, escalated: true } : s));
        clearInterval(int);
      }
    }, 500);
    return () => clearInterval(int);
  }, [nonResp]);

  // Eskalacija se upisuje u knjigu događaja stanice — trag ostaje, kao u stvarnosti.
  useEffect(() => {
    if (!nonResp?.escalated) return;
    store.addKddEntry({
      psId: 'ps-centar',
      type: 'dogadjaj',
      description: 'Pješačka 1-1 se ne javlja — eskalirano šefu smjene PS Centar.',
      assignedPatrol: 'Pješačka 1-1',
      status: 'otvoren',
      recordedBy: `OKC ${DEFAULT_ORG.orgShort}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonResp?.escalated]);

  const secondsSinceNoResp = nonResp ? Math.floor((now - nonResp.startedMs) / 1000) : 0;

  return (
    <div className="text-dark-text">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border bg-dark-surface px-6 py-3">
        <div>
          <div className="section-label text-brass-500">Operativno-komunikacijski centar</div>
          <h1 className="font-heading text-lg text-dark-text">{session.scopeLabel} · Live pregled</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-dark-muted">
            {units.length} jedinica · {stations.length} {stations.length === 1 ? 'stanica' : 'stanice'}
          </span>
          <span className="inline-flex items-center gap-2 border border-brass-500/40 bg-brass-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-brass-300">
            <span className="h-2 w-2 rounded-full bg-brass-500 shadow-[0_0_8px_rgba(184,147,90,0.8)] animate-pulse" />
            live
          </span>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_340px]">
        <section>
          <UnitsMap units={units} alertUnitId={nonResp && !nonResp.escalated ? NON_RESPONSIVE_UNIT_ID : null} />
          <p className="mt-2 text-[11px] text-dark-muted">
            Prati se jedinica/vozilo — u svrhu sigurnosti policajaca. Ne pojedinac.
          </p>
        </section>

        <aside className="space-y-4">
          <div className="border border-dark-border bg-dark-surface">
            <div className="border-b border-dark-border px-4 py-3">
              <div className="mb-1 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-brass-500" />
                <span className="section-label text-brass-500">Jedinice</span>
              </div>
              <div className="font-heading text-base text-dark-text">Aktivne patrole</div>
            </div>
            <ul className="divide-y divide-dark-border">
              {stations.map((st) => {
                const stUnits = units.filter((u) => u.psId === st.id);
                if (stUnits.length === 0) return null;
                return (
                  <li key={st.id}>
                    <div className="bg-dark-elevated/40 px-4 py-1.5 text-[10px] uppercase tracking-wider text-dark-muted">
                      {st.name}
                    </div>
                    <ul className="divide-y divide-dark-border">
                      {stUnits.map((u) => (
                        <li key={u.id} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <div className="text-sm text-dark-text">{u.callSign}</div>
                            <div className="text-[10px] text-dark-muted">{u.officers.join(', ')}</div>
                          </div>
                          <span className="inline-flex items-center gap-1 border border-brass-500/30 bg-brass-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brass-300">
                            <Radio className="h-2.5 w-2.5" />
                            live
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>

          {hasAlertUnit ? (
            <div className="border border-dark-border bg-dark-surface">
              <div className="border-b border-dark-border px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-signal-warn" />
                  <span className="section-label text-signal-warn">Scenarij</span>
                </div>
                <div className="font-heading text-base text-dark-text">„Ne javlja se"</div>
              </div>
              <div className="p-4">
                {!nonResp ? (
                  <button
                    onClick={() => setNonResp({ startedMs: Date.now(), escalated: false, provjera: false })}
                    className="w-full border border-dark-border bg-dark-elevated px-3 py-2 text-xs font-medium uppercase tracking-wider text-dark-text transition hover:border-brass-500 hover:text-brass-300"
                  >
                    Simuliraj: Pješačka 1-1 ne javlja se
                  </button>
                ) : nonResp.escalated ? (
                  <div className="space-y-2">
                    <div className="border border-signal-alarm/40 bg-signal-alarm/10 px-3 py-2 text-xs text-signal-alarm">
                      <div className="font-semibold uppercase tracking-wider">Eskalirano šefu smjene</div>
                      <div className="mt-0.5 normal-case">
                        Lokacija patrole poslata PS Centar; upis kreiran u knjizi događaja.
                      </div>
                    </div>
                    <button
                      onClick={() => setNonResp(null)}
                      className="w-full border border-dark-border bg-dark-elevated px-3 py-2 text-xs text-dark-muted hover:border-brass-500"
                    >
                      Reset scenarij
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border border-signal-warn/40 bg-signal-warn/10 px-3 py-2 text-xs text-signal-warn">
                      <div className="font-mono text-sm tabular-nums">
                        Bez odgovora {Math.max(secondsSinceNoResp / 60, 0.1).toFixed(1)} min
                      </div>
                      <div className="mt-0.5">Pješačka 1-1 · zadnja lokacija: Baščaršija</div>
                    </div>
                    {!nonResp.provjera ? (
                      <button
                        onClick={() => setNonResp((s) => (s ? { ...s, provjera: true } : s))}
                        className="w-full border border-brass-500 bg-brass-500/10 px-3 py-2 text-xs font-medium uppercase tracking-wider text-brass-300 hover:bg-brass-500/20"
                      >
                        Pošalji provjeru statusa
                      </button>
                    ) : (
                      <div className="border border-dark-border bg-dark-elevated px-3 py-2 text-xs text-dark-muted">
                        Push poslat. Čeka se odgovor…
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
