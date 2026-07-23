// Datum utility — sav rad na demo datumima ide preko fiksne "danas" konstante
// tako da isti seed daje isti relativni raspored kad god demo pokreneš.
// Za produkciju bi bila new Date(); za demo želimo predvidljivo "danas".

/** "Danas" u demo svijetu — fiksirano da vikend/radni dani ostanu konzistentni. */
export const DEMO_TODAY = '2026-08-24'; // ponedjeljak

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
