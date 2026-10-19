// Aktivni tenant (organizacija vezana za pristupni ključ). Server ga vraća uz
// sesiju; main.tsx ga postavlja PRIJE nego što se ostatak aplikacije učita, pa
// vrijednosti koje se računaju pri učitavanju modula (generator svijeta, nazivi)
// već vide ispravnu organizaciju. Bez tenanta važe izmišljene demo vrijednosti.

export interface Tenant {
  label: string | null;
  orgName: string;
  orgShort: string;
  rootName: string;
  region: string;
  city: string;
  cityLocative: string;
  mapCenter: [number, number];
  places: {
    puCentar: string;
    psCentar: string;
    psStariGrad: string;
    puNoviGrad: string;
    psNoviGrad: string;
    psDobrinja: string;
  };
  /** Ulice/lokacije za primjere događaja (knjiga, bilteni, šalteri) — koriste se ciklično. */
  streets: string[];
  colors: { primary: string; accent: string };
}

type TenantPatch = Partial<Omit<Tenant, 'places' | 'colors'>> & {
  places?: Partial<Tenant['places']>;
  colors?: Partial<Tenant['colors']>;
};

const env = import.meta.env;

/** Referentni centar karte — sve polilinije patrola su crtane oko ove tačke. */
export const BASE_MAP_CENTER: [number, number] = [43.852, 18.395];

export const DEFAULT_TENANT: Tenant = {
  label: null,
  orgName: env.VITE_ORG_NAME || 'Ministarstvo unutrašnjih poslova · Demo kanton',
  orgShort: env.VITE_ORG_SHORT || 'MUP DK',
  rootName: env.VITE_ORG_ROOT_NAME || 'MUP Demo kantona',
  region: env.VITE_ORG_REGION || 'Demo kanton',
  city: 'Sarajevo',
  cityLocative: 'Sarajevu',
  mapCenter: BASE_MAP_CENTER,
  places: {
    puCentar: 'PU Centar',
    psCentar: 'PS Centar',
    psStariGrad: 'PS Stari Grad',
    puNoviGrad: 'PU Novi Grad',
    psNoviGrad: 'PS Novi Grad',
    psDobrinja: 'PS Dobrinja',
  },
  streets: [
    'Ferhadija', 'Titova', 'Marijin dvor', 'Baščaršija', 'Skenderija', 'Koševo',
    'Mejtaš', 'Bistrik', 'Mis Irbina', 'Kovači', 'Bulevar Meše Selimovića', 'Vijećnica',
    'Alipašino Polje',
  ],
  colors: { primary: '#132241', accent: '#bf9a5c' },
};

let active: Tenant = DEFAULT_TENANT;

export function setTenant(label: string | null, patch: TenantPatch | null | undefined): void {
  const p = patch ?? {};
  const streets = Array.isArray(p.streets) && p.streets.length > 0 ? p.streets : DEFAULT_TENANT.streets;
  active = {
    ...DEFAULT_TENANT,
    ...p,
    label,
    places: { ...DEFAULT_TENANT.places, ...(p.places ?? {}) },
    colors: { ...DEFAULT_TENANT.colors, ...(p.colors ?? {}) },
    streets,
    mapCenter: Array.isArray(p.mapCenter) && p.mapCenter.length === 2 ? p.mapCenter : DEFAULT_TENANT.mapCenter,
  };
}

export function getTenant(): Tenant {
  return active;
}

/** Pomjera koordinatu iz referentnog (Sarajevo) sistema u grad tenanta. */
export function shiftToTenant([lat, lng]: [number, number]): [number, number] {
  const [cLat, cLng] = active.mapCenter;
  return [lat + (cLat - BASE_MAP_CENTER[0]), lng + (cLng - BASE_MAP_CENTER[1])];
}
