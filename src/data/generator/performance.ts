import type { Officer, PerformanceMonth } from '../types';
import { intBetween, mulberry32 } from './prng';

const YEARS_BACK = 1;

/** Generiše 12 mjeseci istorije za sve policajce, koreliranu s primarnom operativnom ulogom.
 *  Za Phase 2 dovoljno; Phase 5 ovo koristi za analitiku. */
export function generatePerformance(seed: number, officers: Officer[]): PerformanceMonth[] {
  const out: PerformanceMonth[] = [];
  const today = new Date();
  const startYear = today.getFullYear();
  const startMonth = today.getMonth();

  for (const officer of officers) {
    const rand = mulberry32(seed + hashCode(officer.id));
    const isInterv = officer.operationalRoleIds.some((r) => r.endsWith(':interventna'));
    const isMoto = officer.operationalRoleIds.some((r) => r.endsWith(':moto'));
    const isBicikl = officer.operationalRoleIds.some((r) => r.endsWith(':bicikl'));
    const isCivilna = officer.operationalRoleIds.some((r) => r.endsWith(':civilna'));

    for (let backMonths = 12 * YEARS_BACK; backMonths >= 1; backMonths--) {
      const totalMonthsFromStart = startYear * 12 + startMonth - backMonths;
      const y = Math.floor(totalMonthsFromStart / 12);
      const m = (totalMonthsFromStart % 12) + 1;
      const yearMonth = `${y}-${String(m).padStart(2, '0')}`;

      out.push({
        officerId: officer.id,
        yearMonth,
        hapsenja: isInterv ? intBetween(rand, 3, 9) : intBetween(rand, 0, 3),
        prekrsajni: isMoto ? intBetween(rand, 15, 40) : intBetween(rand, 4, 18),
        intervencije: isInterv ? intBetween(rand, 20, 55) : isCivilna ? intBetween(rand, 8, 20) : intBetween(rand, 6, 25),
        asistencije: intBetween(rand, 3, 14),
        sati: {
          redovni: intBetween(rand, 140, 168),
          nocni: intBetween(rand, 30, 70),
          prekovremeni: intBetween(rand, 0, 22),
          sud: isBicikl ? intBetween(rand, 0, 2) : intBetween(rand, 0, 6),
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
