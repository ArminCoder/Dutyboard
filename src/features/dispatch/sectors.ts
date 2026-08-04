// Sektori — područje stanice podijeljeno na rejone koje patrole pokrivaju po smjeni.
// PS Centar ima 12 sektora; granice su aproksimirane (kao i rute patrola).

export interface SectorDef {
  id: number;
  psId: string;
  name: string;
  /** Poligon granice sektora, [lat, lng]. */
  polygon: Array<[number, number]>;
}

/** Pravougaoni rejon oko centra — dovoljno za demo prikaz pokrivenosti. */
function box(lat: number, lng: number, dLat: number, dLng: number): Array<[number, number]> {
  return [
    [lat - dLat, lng - dLng],
    [lat - dLat, lng + dLng],
    [lat + dLat, lng + dLng],
    [lat + dLat, lng - dLng],
  ];
}

const CENTAR_GRID: Array<{ id: number; name: string; lat: number; lng: number }> = [
  { id: 1, name: 'Marijin dvor', lat: 43.8565, lng: 18.4055 },
  { id: 2, name: 'Skenderija', lat: 43.8545, lng: 18.4135 },
  { id: 3, name: 'Koševo', lat: 43.8635, lng: 18.4145 },
  { id: 4, name: 'Ciglane', lat: 43.8655, lng: 18.4055 },
  { id: 5, name: 'Mejtaš', lat: 43.8605, lng: 18.4155 },
  { id: 6, name: 'Bjelave', lat: 43.8645, lng: 18.4215 },
  { id: 7, name: 'Ferhadija', lat: 43.8585, lng: 18.4215 },
  { id: 8, name: 'Bistrik', lat: 43.8535, lng: 18.4245 },
  { id: 9, name: 'Titova', lat: 43.8595, lng: 18.4115 },
  { id: 10, name: 'Grbavica', lat: 43.8495, lng: 18.3995 },
  { id: 11, name: 'Pofalići', lat: 43.8525, lng: 18.3895 },
  { id: 12, name: 'Breka', lat: 43.8695, lng: 18.4175 },
];

export const SECTORS: SectorDef[] = CENTAR_GRID.map((s) => ({
  id: s.id,
  psId: 'ps-centar',
  name: `Sektor ${s.id} · ${s.name}`,
  polygon: box(s.lat, s.lng, 0.0042, 0.0058),
}));
