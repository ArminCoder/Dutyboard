import { NIGHT_HOURS_PER_SHIFT, type Officer, type PerformanceMonth } from '../types';
import { intBetween, mulberry32 } from './prng';
import { DEMO_TODAY, parseISO } from './dates';

const MONTHS_BACK = 24;

/** Generiše 24 mjeseca istorije za sve policajce, koreliranu s primarnom operativnom ulogom.
 *  Sidrimo na DEMO_TODAY (ne na stvarni datum) da exec grafovi i period-over-period budu deterministični
 *  i puni za 2026. Koriste ga N01/N02/C01/M01 analitike i period-over-period strelice. */
export function generatePerformance(seed: number, officers: Officer[]): PerformanceMonth[] {
  const out: PerformanceMonth[] = [];
  const anchor = parseISO(DEMO_TODAY);
  const startYear = anchor.getFullYear();
  const startMonth = anchor.getMonth();

  for (const officer of officers) {
    const rand = mulberry32(seed + hashCode(officer.id));
    const isInterv = officer.operationalRoleIds.some((r) => r.endsWith(':interventna'));
    const isMoto = officer.operationalRoleIds.some((r) => r.endsWith(':moto'));
    const isBicikl = officer.operationalRoleIds.some((r) => r.endsWith(':bicikl'));
    const isCivilna = officer.operationalRoleIds.some((r) => r.endsWith(':civilna'));

    for (let backMonths = MONTHS_BACK; backMonths >= 1; backMonths--) {
      const totalMonthsFromStart = startYear * 12 + startMonth - backMonths;
      const y = Math.floor(totalMonthsFromStart / 12);
      const m = (totalMonthsFromStart % 12) + 1;
      const yearMonth = `${y}-${String(m).padStart(2, '0')}`;

      // Realne mjesečne brojke (provjereno s praksom): hapšenja su rijetka — nekoliko
      // desetina godišnje čak i za interventnu; sud se dogodi svega nekoliko puta godišnje.
      const sudniMjesec = rand() < 0.35; // ~4 mjeseca godišnje sa sudom
      out.push({
        officerId: officer.id,
        yearMonth,
        hapsenja: isInterv ? intBetween(rand, 0, 2) : intBetween(rand, 0, 1),
        prekrsajni: isMoto ? intBetween(rand, 8, 22) : intBetween(rand, 2, 10),
        intervencije: isInterv ? intBetween(rand, 12, 30) : isCivilna ? intBetween(rand, 3, 10) : intBetween(rand, 4, 14),
        sati: {
          redovni: intBetween(rand, 140, 168),
          // Noćni rad se broji 22:00–06:00 → 8 h po noćnoj smjeni, ne cijelih 12 h.
          nocni: intBetween(rand, 5, 6) * NIGHT_HOURS_PER_SHIFT,
          prekovremeni: intBetween(rand, 0, 22),
          sud: sudniMjesec ? intBetween(rand, 1, isBicikl ? 2 : 4) : 0,
        },
      });
    }
  }

  return out;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
