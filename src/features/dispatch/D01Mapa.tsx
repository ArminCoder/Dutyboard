import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, LogOut, ShieldCheck, Filter, Radio } from 'lucide-react';
import { UNITS } from './routes';
import { useRoleActions } from '../../app/RoleContext';

type Kind = 'auto' | 'motocikl' | 'pjesacka' | 'civilna' | 'interventna';
const ALL_KINDS: Kind[] = ['auto', 'motocikl', 'pjesacka', 'civilna', 'interventna'];

const KIND_LABEL: Record<Kind, string> = {
  auto: 'Auto',
  motocikl: 'Moto',
  pjesacka: 'Pješačka',
  civilna: 'Civilna',
  interventna: 'Interventna',
};

const KIND_COLOR: Record<Kind, string> = {
  auto: '#b8935a',      // brass-500
  motocikl: '#d6bd91',  // brass-300
  pjesacka: '#8b93a8',  // dark-muted
  civilna: '#a89f88',   // paper-400
  interventna: '#e6e1d1', // dark-text
};

const SARAJEVO_CENTER: [number, number] = [43.858, 18.412];

function positionOnLine(line: Array<[number, number]>, t: number): [number, number] {
  const n = line.length;
  const segments = n - 1;
  const scaled = t * segments;
  const idx = Math.floor(scaled) % segments;
  const local = scaled - Math.floor(scaled);
  const [aLat, aLng] = line[idx];
  const [bLat, bLng] = line[(idx + 1) % n];
  return [aLat + (bLat - aLat) * local, aLng + (bLng - aLng) * local];
}

const NON_RESPONSIVE_UNIT_ID = 'u-5';

export function D01Mapa() {
  const { logout } = useRoleActions();
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState<Set<Kind>>(new Set(ALL_KINDS));
  const [nonResp, setNonResp] = useState<{ startedMs: number; escalated: boolean; provjera: boolean } | null>(null);

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 800);
    return () => clearInterval(int);
  }, []);

  const positions = useMemo(() => {
    const start = 1737000000000;
    const sec = (now - start) / 1000;
    return UNITS.map((u) => {
      const t = ((sec / u.loopSeconds) % 1 + 1) % 1;
      return { unit: u, pos: positionOnLine(u.polyline, t) };
    });
  }, [now]);

  const toggle = (k: Kind) => {
    const next = new Set(filter);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setFilter(next);
  };

  const startNonResponsive = () => {
    setNonResp({ startedMs: Date.now(), escalated: false, provjera: false });
  };
  const sendCheck = () => setNonResp((s) => (s ? { ...s, provjera: true } : s));

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

  const secondsSinceNoResp = nonResp ? Math.floor((now - nonResp.startedMs) / 1000) : 0;

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <header className="border-b border-dark-border bg-dark-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="section-label mb-1 text-brass-500">Operativni centar</div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-xl text-dark-text">PU Centar</h1>
              <span className="section-label text-dark-muted">Live pregled</span>
            </div>
            <div className="mt-2 h-[2px] w-10 bg-brass-500" />
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 border border-brass-500/40 bg-brass-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-brass-300">
              <span className="h-2 w-2 rounded-full bg-brass-500 shadow-[0_0_8px_rgba(184,147,90,0.8)] animate-pulse" />
              live
            </span>
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="inline-flex items-center gap-1.5 border border-dark-border bg-dark-surface px-3 py-1.5 text-xs text-dark-muted hover:border-brass-500 hover:text-brass-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              Odjava
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-dark-muted">
              <Filter className="h-3.5 w-3.5" />
              <span className="section-label text-dark-muted">Prikaz</span>
            </div>
            {ALL_KINDS.map((k) => (
              <button
                key={k}
                onClick={() => toggle(k)}
                className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition ${
                  filter.has(k)
                    ? 'border-brass-500 bg-brass-500/10 text-brass-300'
                    : 'border-dark-border bg-dark-surface text-dark-muted hover:border-dark-elevated'
                }`}
              >
                <span className="h-2 w-2" style={{ background: KIND_COLOR[k] }} />
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="overflow-hidden border border-dark-border">
            <MapContainer
              center={SARAJEVO_CENTER}
              zoom={13}
              style={{ height: '65vh', width: '100%', background: '#0a1220' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              />

              {positions.map(({ unit, pos }) => {
                if (!filter.has(unit.kind)) return null;
                const isNonResp = unit.id === NON_RESPONSIVE_UNIT_ID && nonResp && !nonResp.escalated;
                const color = isNonResp ? '#a67626' : KIND_COLOR[unit.kind];
                return (
                  <Fragment key={unit.id}>
                    <Polyline
                      positions={unit.polyline}
                      pathOptions={{ color: KIND_COLOR[unit.kind], weight: 1, opacity: 0.15 }}
                    />
                    <CircleMarker
                      center={pos}
                      radius={isNonResp ? 11 : 8}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: 0.85,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold">{unit.callSign}</div>
                          <div className="mt-0.5 text-gray-600">{unit.officers.join(', ')}</div>
                          <div className="mt-0.5 text-gray-500">Status: na terenu</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </Fragment>
                );
              })}
            </MapContainer>
          </div>
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
              {UNITS.map((u) => (
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
          </div>

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
                  onClick={startNonResponsive}
                  className="w-full border border-dark-border bg-dark-elevated px-3 py-2 text-xs font-medium uppercase tracking-wider text-dark-text transition hover:border-brass-500 hover:text-brass-300"
                >
                  Simuliraj: Pješačka 1-1 ne javlja se
                </button>
              ) : nonResp.escalated ? (
                <div className="space-y-2">
                  <div className="border border-signal-alarm/40 bg-signal-alarm/10 px-3 py-2 text-xs text-signal-alarm">
                    <div className="font-semibold uppercase tracking-wider">Eskalirano šefu smjene</div>
                    <div className="mt-0.5 normal-case">Lokacija patrole poslata na K02 sa dnevnikom smjene.</div>
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
                      onClick={sendCheck}
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
        </aside>
      </div>
    </div>
  );
}
