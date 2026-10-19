import { getTenant } from './tenant';

// Prikazni nazivi PU/PS i lokacija za aktivni tenant. Interni ID-evi (ps-centar,
// pu-novi-grad, …) ostaju isti u svim organizacijama — mijenja se samo naziv.
// Modul se učitava tek nakon što main.tsx postavi tenant.

export const TENANT = getTenant();
export const PLACE = TENANT.places;

/** i-ta ulica/lokacija tenanta (ciklično, pa i kraća lista radi). */
export function street(i: number): string {
  return TENANT.streets[i % TENANT.streets.length];
}

/** "PS Novi Grad" → "Novi Grad" — za nazive objekata i naselja. */
export function bare(name: string): string {
  return name.replace(/^P[SU]\s+/, '');
}
