import { useMemo, useState } from 'react';
import { Gauge, ChevronRight, Building2 } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { readinessBand, readinessIndex } from '../../domain/readiness';
import { childUnitsOf, hasChildUnits, pathFromRoot } from '../../domain/unitStats';

// C04 — indeks spremnosti: jedan branjiv broj po jedinici, uz razlog iza njega.

type Tone = 'ok' | 'warn' | 'alarm';
const DOT: Record<Tone, string> = { ok: 'bg-signal-ok', warn: 'bg-signal-warn', alarm: 'bg-signal-alarm' };
const TXT: Record<Tone, string> = { ok: 'text-signal-ok', warn: 'text-signal-warn', alarm: 'text-signal-alarm' };

export function C04Spremnost() {
  const w = useScopedWorld();
  const session = useSession();
  const root = session.scopeNodeId;
  const [focusId, setFocusId] = useState(root);

  const summary = useMemo(() => readinessIndex(w, focusId), [w, focusId]);
  const rows = useMemo(
    () => childUnitsOf(w, focusId).map((c) => readinessIndex(w, c.id)).sort((a, b) => a.score - b.score),
    [w, focusId],
  );
  const crumbs = useMemo(() => pathFromRoot(w, focusId, root), [w, focusId, root]);
  const band = readinessBand(summary.score);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Indeks spremnosti</div>
        <h1 className="font-heading text-2xl text-ink-800">Koliko je jedinica spremna — i zašto</h1>
      </div>
      <p className="mb-4 mt-1 max-w-3xl text-sm text-ink-500">
        Ocjena se računa iz četiri mjerljiva izvora: popunjenost (40%), važeći certifikati (25%),
        ispravna vozila (20%) i usklađenost opterećenja (15%). Svaka komponenta se mjeri prema cilju,
        pa se uz ocjenu uvijek vidi i razlog.
      </p>

      <nav className="mb-5 flex flex-wrap items-center gap-1 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={c.id} className="flex items-center gap-1">
              <button
                onClick={() => setFocusId(c.id)}
                disabled={last}
                className={last ? 'font-medium text-ink-800' : 'text-ink-500 transition hover:text-brass-600'}
              >
                {c.id === root ? 'Kanton' : c.name}
              </button>
              {last ? null : <ChevronRight className="h-3.5 w-3.5 text-paper-400" />}
            </span>
          );
        })}
      </nav>

      {/* Ocjena fokusa */}
      <section className="mb-6 border border-paper-200 bg-paper-0 p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center border-2 ${band.tone === 'ok' ? 'border-signal-ok' : band.tone === 'warn' ? 'border-signal-warn' : 'border-signal-alarm'}`}>
              <span className={`font-mono text-xl font-medium ${TXT[band.tone]}`}>{summary.score}</span>
            </div>
            <div>
              <div className="section-label">Ukupna spremnost</div>
              <div className={`font-heading text-lg ${TXT[band.tone]}`}>{band.label}</div>
            </div>
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {summary.drivers.map((d) => (
              <div key={d.key} className="border border-paper-200 bg-paper-50 p-2.5">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[11px] text-ink-500">{d.label}</span>
                  <span className="font-mono text-xs text-ink-800">{d.display}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden bg-paper-200">
                  <div
                    className={d.value >= 90 ? 'h-full bg-signal-ok' : d.value >= 70 ? 'h-full bg-signal-warn' : 'h-full bg-signal-alarm'}
                    style={{ width: `${d.value}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-ink-400">težina {Math.round(d.weight * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rang lista */}
      <section className="border border-paper-200 bg-paper-0">
        <div className="flex items-center justify-between border-b border-paper-200 px-5 py-3">
          <div className="section-label text-brass-600">Rangirano — najslabija spremnost prvo</div>
          <span className="text-[11px] text-ink-400">{rows.length > 0 ? 'Klikni jedinicu za razradu' : 'Najniži nivo'}</span>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-8 text-sm text-ink-500">Ovo je najniži nivo razrade.</div>
        ) : (
          <ul className="divide-y divide-paper-100">
            {rows.map((r) => {
              const b = readinessBand(r.score);
              const drillable = hasChildUnits(w, r.node.id);
              return (
                <li key={r.node.id}>
                  <button
                    onClick={drillable ? () => setFocusId(r.node.id) : undefined}
                    className={`flex w-full items-center gap-4 px-5 py-3 text-left ${drillable ? 'transition hover:bg-paper-50' : 'cursor-default'}`}
                  >
                    <div className="flex h-9 w-9 flex-none items-center justify-center bg-navy-900 text-paper-50">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="w-44 flex-none">
                      <div className="font-medium text-ink-800">{r.node.name}</div>
                      <div className={`text-[11px] ${TXT[b.tone]}`}>{b.label}</div>
                    </div>
                    <div className="flex flex-1 flex-wrap gap-3">
                      {r.drivers.map((d) => (
                        <span key={d.key} className="flex items-center gap-1.5 text-[11px] text-ink-500">
                          <span className={`h-1.5 w-1.5 rounded-full ${d.value >= 90 ? DOT.ok : d.value >= 70 ? DOT.warn : DOT.alarm}`} />
                          {d.label.split(' ')[0]} {d.display}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      <Gauge className={`h-4 w-4 ${TXT[b.tone]}`} />
                      <span className={`font-mono text-xl font-medium tabular-nums ${TXT[b.tone]}`}>{r.score}</span>
                      {drillable ? <ChevronRight className="h-4 w-4 text-paper-400" /> : <span className="w-4" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
