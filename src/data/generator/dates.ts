// Datum utility — sav rad na demo datumima ide preko fiksne "danas" konstante
// tako da isti seed daje isti relativni raspored kad god demo pokreneš.
// Za produkciju bi bila new Date(); za demo želimo predvidljivo "danas".

/** "Danas" u demo svijetu — fiksirano da vikend/radni dani ostanu konzistentni. */
export const DEMO_TODAY = '2026-08-24'; // ponedjeljak

/** Demo "sada" — datum iz demo svijeta + stvarno vrijeme sata.
 *  Sve mutacije u sesiji koriste ovo umjesto new Date() da bi pretraga po datumu
 *  (knjiga događaja, bilteni) ostala u istom vremenskom univerzumu kao seed. */
export function demoNow(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${DEMO_TODAY}T${hh}:${mm}`;
}

export function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseISO(dateStr);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Decimalne godine između dva ISO datuma (from → to). Koristi se za staž i dob. */
export function yearsBetween(fromISO: string, toISO: string): number {
  return (parseISO(toISO).getTime() - parseISO(fromISO).getTime()) / (365.25 * 24 * 3600 * 1000);
}

export function formatBs(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export function formatBsShort(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}.${m}.`;
}

const DAYS_BS = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
const DAYS_BS_SHORT = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'];
const MONTHS_BS = [
  'januar', 'februar', 'mart', 'april', 'maj', 'juni',
  'juli', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
];

export function dayNameBs(dateStr: string): string {
  return DAYS_BS[parseISO(dateStr).getDay()];
}

export function dayNameBsShort(dateStr: string): string {
  return DAYS_BS_SHORT[parseISO(dateStr).getDay()];
}

export function monthNameBs(monthIndex: number): string {
  return MONTHS_BS[monthIndex];
}

export function longBs(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${dayNameBs(dateStr)}, ${d}. ${MONTHS_BS[m - 1]} ${y}.`;
}
