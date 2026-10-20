import { getTenant } from './tenant';

// Koje je uloge posjetilac već otvorio — samo pomoć pri obilasku dema, po pregledaču
// i po tenantu. Ako je pohrana nedostupna (privatni način), oznake se jednostavno ne prikazuju.

const KEY = `dutyboard.seen${getTenant().label ? `.${getTenant().label}` : ''}`;

export function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markSeen(id: string): void {
  try {
    const seen = loadSeen();
    seen.add(id);
    localStorage.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    /* ignoriši */
  }
}
