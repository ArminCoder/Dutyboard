// Konstante boja/oznaka žive uz komponentu koja ih jedina koristi.
/* oxlint-disable react/only-export-components */
import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter } from 'lucide-react';
import type { UnitDef } from './routes';
import { cssVar } from '../../components/chartTheme';
import { SECTORS } from './sectors';

// Zajednička mapa jedinica — koristi je OKC (cijeli kanton) i šef smjene (svoja stanica).

export type UnitKind = UnitDef['kind'];
const ALL_KINDS: UnitKind[] = ['auto', 'motocikl', 'pjesacka', 'civilna', 'interventna', 'straza'];

export const KIND_LABEL: Record<UnitKind, string> = {
  auto: 'Auto',
  motocikl: 'Moto',
  pjesacka: 'Pješačka',
  civilna: 'Civilna',
  interventna: 'Interventna',
  straza: 'Straža',
};

/** Boje markera prate temu organizacije (čitaju se iz CSS varijabli). */
export function kindColor(kind: UnitKind): string {
  switch (kind) {
    case 'auto': return cssVar('--color-brass-500', '#bf9a5c');
    case 'motocikl': return cssVar('--color-brass-300', '#dcc593');
    case 'pjesacka': return cssVar('--color-dark-muted', '#8695b0');
    case 'civilna': return cssVar('--color-paper-400', '#8d9bb4');
    case 'interventna': return cssVar('--color-dark-text', '#e4e9f2');
    case 'straza': return cssVar('--color-signal-ok', '#3f7f5e');
  }
}

const SARAJEVO_CENTER: [number, number] = [43.852, 18.395];

function positionOnLine(line: Array<[number, number]>, t: number): [number, number] {
  const n = line.length;
  // Stalno mjesto (straža) — jedna tačka, nema interpolacije.
  if (n < 2) return line[0];
  const segments = n - 1;
  const scaled = t * segments;
  const idx = Math.floor(scaled) % segments;
  const local = scaled - Math.floor(scaled);
  const [aLat, aLng] = line[idx];
  const [bLat, bLng] = line[(idx + 1) % n];
  return [aLat + (bLat - aLat) * local, aLng + (bLng - aLng) * local];
}

interface Props {
  units: UnitDef[];
  /** Prikaži sektore stanice i njihovu pokrivenost u ovoj smjeni. */
  showSectors?: boolean;
  /** Jedinica koja se ne javlja — crta se narandžasto i uvećano. */
  alertUnitId?: string | null;
  center?: [number, number];
  zoom?: number;
  heightVh?: number;
}

export function UnitsMap({ units, alertUnitId, showSectors = false, center = SARAJEVO_CENTER, zoom = 12, heightVh = 62 }: Props) {
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState<Set<UnitKind>>(new Set(ALL_KINDS));

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 800);
    return () => clearInterval(int);
  }, []);

  const positions = useMemo(() => {
    const start = 1737000000000;
    const sec = (now - start) / 1000;
    return units.map((u) => {
      const t = (((sec / u.loopSeconds) % 1) + 1) % 1;
      return { unit: u, pos: positionOnLine(u.polyline, t) };
    });
  }, [now, units]);

  /** Sektor je pokriven ako je jedinica ISTE stanice raspoređena na njega
   *  (sektori se numerišu po stanici, pa se ne smiju miješati između stanica). */
  const coveredSectors = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const u of units) {
      const m = /Sektor (\d+)/.exec(u.callSign);
      if (!m) continue;
      const set = map.get(u.psId) ?? new Set<number>();
      set.add(Number(m[1]));
      map.set(u.psId, set);
    }
    return map;
  }, [units]);

  const coveredCount = useMemo(
    () => visibleSectorsCount(SECTORS, units, coveredSectors),
    [units, coveredSectors],
  );

  const visibleSectors = useMemo(
    () => (showSectors ? SECTORS.filter((sec) => units.some((u) => u.psId === sec.psId)) : []),
    [showSectors, units],
  );

  const kindsPresent = useMemo(() => ALL_KINDS.filter((k) => units.some((u) => u.kind === k)), [units]);

  const toggle = (k: UnitKind) => {
    const next = new Set(filter);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setFilter(next);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-dark-muted">
          <Filter className="h-3.5 w-3.5" />
          <span className="section-label text-dark-muted">Prikaz</span>
        </div>
        {showSectors && visibleSectors.length > 0 ? (
          <span className="ml-2 flex items-center gap-3 border-l border-dark-border pl-3 text-[11px] text-dark-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 border" style={{ borderColor: cssVar('--color-signal-ok', '#3f7f5e') }} />
              pokriven sektor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 border" style={{ borderColor: cssVar('--color-signal-warn', '#a67626') }} />
              nepokriven ({visibleSectors.length - coveredCount})
            </span>
          </span>
        ) : null}
        {kindsPresent.map((k) => (
          <button
            key={k}
            onClick={() => toggle(k)}
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition ${
              filter.has(k)
                ? 'border-brass-500 bg-brass-500/10 text-brass-300'
                : 'border-dark-border bg-dark-surface text-dark-muted hover:border-dark-elevated'
            }`}
          >
            <span className="h-2 w-2" style={{ background: kindColor(k) }} />
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="map-dark overflow-hidden border border-dark-border">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: `${heightVh}vh`, width: '100%', background: cssVar('--color-dark-bg', '#070f1f') }}
          scrollWheelZoom
        >
          {/* Keyless OSM osnovna karta (bez API ključa). Tamni izgled se postiže
              CSS filterom nad slojem pločica (.map-dark .leaflet-tile-pane), tako
              da markeri/sektori ostaju u svojim bojama. */}
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {visibleSectors.map((sec) => {
            const covered = coveredSectors.get(sec.psId)?.has(sec.id) ?? false;
            const color = covered ? cssVar('--color-signal-ok', '#3f7f5e') : cssVar('--color-signal-warn', '#a67626');
            return (
              <Polygon
                key={`sector-${sec.id}`}
                positions={sec.polygon}
                pathOptions={{ color, weight: 1, opacity: covered ? 0.5 : 0.7, fillOpacity: covered ? 0.06 : 0.14 }}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">{sec.name}</div>
                    <div className="mt-0.5 text-gray-600">
                      {covered ? 'Pokriven u ovoj smjeni' : 'Nije pokriven u ovoj smjeni'}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {positions.map(({ unit, pos }) => {
            if (!filter.has(unit.kind)) return null;
            const isAlert = unit.id === alertUnitId;
            const color = isAlert ? cssVar('--color-signal-warn', '#a67626') : kindColor(unit.kind);
            return (
              <Fragment key={unit.id}>
                <Polyline
                  positions={unit.polyline}
                  pathOptions={{ color: kindColor(unit.kind), weight: 1, opacity: 0.15 }}
                />
                <CircleMarker
                  center={pos}
                  radius={isAlert ? 11 : 8}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
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
    </div>
  );
}


/** Broj pokrivenih sektora među onima koji su vidljivi u trenutnom scope-u. */
function visibleSectorsCount(
  all: typeof SECTORS,
  units: UnitDef[],
  covered: Map<string, Set<number>>,
): number {
  return all.filter((sec) => units.some((u) => u.psId === sec.psId) && covered.get(sec.psId)?.has(sec.id)).length;
}
