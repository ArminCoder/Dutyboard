// Konstante boja/oznaka žive uz komponentu koja ih jedina koristi.
/* oxlint-disable react/only-export-components */
import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter } from 'lucide-react';
import type { UnitDef } from './routes';
import { cssVar } from '../../components/chartTheme';

// Zajednička mapa jedinica — koristi je OKC (cijeli kanton) i šef smjene (svoja stanica).

export type UnitKind = UnitDef['kind'];
const ALL_KINDS: UnitKind[] = ['auto', 'motocikl', 'pjesacka', 'civilna', 'interventna'];

export const KIND_LABEL: Record<UnitKind, string> = {
  auto: 'Auto',
  motocikl: 'Moto',
  pjesacka: 'Pješačka',
  civilna: 'Civilna',
  interventna: 'Interventna',
};

/** Boje markera prate temu organizacije (čitaju se iz CSS varijabli). */
export function kindColor(kind: UnitKind): string {
  switch (kind) {
    case 'auto': return cssVar('--color-brass-500', '#bf9a5c');
    case 'motocikl': return cssVar('--color-brass-300', '#dcc593');
    case 'pjesacka': return cssVar('--color-dark-muted', '#8695b0');
    case 'civilna': return cssVar('--color-paper-400', '#8d9bb4');
    case 'interventna': return cssVar('--color-dark-text', '#e4e9f2');
  }
}

const SARAJEVO_CENTER: [number, number] = [43.852, 18.395];

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

interface Props {
  units: UnitDef[];
  /** Jedinica koja se ne javlja — crta se narandžasto i uvećano. */
  alertUnitId?: string | null;
  center?: [number, number];
  zoom?: number;
  heightVh?: number;
}

export function UnitsMap({ units, alertUnitId, center = SARAJEVO_CENTER, zoom = 12, heightVh = 62 }: Props) {
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

      <div className="overflow-hidden border border-dark-border">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: `${heightVh}vh`, width: '100%', background: cssVar('--color-dark-bg', '#070f1f') }}
          scrollWheelZoom
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          />

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
