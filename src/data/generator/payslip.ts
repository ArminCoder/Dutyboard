import type { Payslip, PerformanceMonth, Shift } from '../types';
import { SHIFT_TIME } from '../types';
import { DEMO_TODAY } from './dates';

/** Platne liste za Softića — SPEC linija 104. Iznosi u KM, realistični za policajca
 *  s nekoliko godina staža. Sve stavke se izvode iz istih sati koje vidi i statistika,
 *  tako da se P03 (statistika) i P04 (plata) nikad ne razilaze.
 *
 *  Tekući mjesec (avgust 2026) nema još zatvorenu statistiku, pa se računa iz rasporeda
 *  i prikazuje kao procjena. */

const OFFICER_ID = 'off-0001';

// Satnice na platnoj listi su ono što policajac dobije "na ruke".
// Napomena: finance.ts koristi 20 KM/h za prekovremeni — to je puni trošak poslodavca
// (bruto + doprinosi) koji ide u budžet, a ne iznos na platnoj listi.
const OSNOVNA = 1180;
const MINULI_PCT = 0.06;
const NOCNI_KM_H = 2.5;
const PREKOVREMENI_KM_H = 10.5; // ~1.5× redovne satnice (1180 / 168 h)
const SUD_KM_H = 7;
const TOPLI_OBROK = 240;
const PREVOZ = 65;

function buildPayslip(
  yearMonth: string,
  sati: { nocni: number; prekovremeni: number; sud: number },
): Payslip {
  const minuli = Math.round(OSNOVNA * MINULI_PCT);
  const nocni = Math.round(sati.nocni * NOCNI_KM_H);
  const prekovremeni = Math.round(sati.prekovremeni * PREKOVREMENI_KM_H);
  const sud = Math.round(sati.sud * SUD_KM_H);

  // Stavke bez sati se ne prikazuju (npr. tekući mjesec bez evidentiranih sudskih sati).
  const lines = [
    { label: 'Osnovna plata', amount: OSNOVNA },
    { label: 'Minuli rad (6%)', amount: minuli },
    ...(sati.nocni > 0 ? [{ label: `Noćni rad (${sati.nocni} h)`, amount: nocni }] : []),
    ...(sati.prekovremeni > 0 ? [{ label: `Prekovremeni (${sati.prekovremeni} h)`, amount: prekovremeni }] : []),
    ...(sati.sud > 0 ? [{ label: `Sati sa suda (${sati.sud} h)`, amount: sud }] : []),
    { label: 'Topli obrok', amount: TOPLI_OBROK },
    { label: 'Prevoz', amount: PREVOZ },
  ];

  return {
    officerId: OFFICER_ID,
    yearMonth,
    lines,
    net: lines.reduce((s, l) => s + l.amount, 0),
  };
}

/** Sati tekućeg mjeseca iz rasporeda (statistika za avgust još nije zatvorena). */
function currentMonthHours(shifts: Shift[]): { nocni: number; prekovremeni: number; sud: number } {
  const ym = DEMO_TODAY.slice(0, 7);
  const seen = new Set<string>();
  let nocni = 0;
  for (const s of shifts) {
    if (!s.date.startsWith(ym) || seen.has(s.id)) continue;
    if (!s.slots.some((sl) => sl.assignedOfficerIds.includes(OFFICER_ID))) continue;
    seen.add(s.id); // isti policajac zna biti u više slotova iste smjene — broji smjenu jednom
    if (SHIFT_TIME[s.kind].night) nocni += SHIFT_TIME[s.kind].hours;
  }
  return { nocni, prekovremeni: 0, sud: 0 };
}

/** Zadnjih 6 obračuna (mart–avgust 2026). Zatvoreni mjeseci iz statistike, tekući iz rasporeda. */
export function generateSoftićPayslips(performance: PerformanceMonth[], shifts: Shift[]): Payslip[] {
  const out: Payslip[] = [];
  const mine = performance
    .filter((p) => p.officerId === OFFICER_ID)
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
    .slice(0, 5);

  for (const p of mine) {
    out.push(buildPayslip(p.yearMonth, p.sati));
  }

  out.unshift(buildPayslip(DEMO_TODAY.slice(0, 7), currentMonthHours(shifts)));
  return out.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
}

/** Da li je obračun još u toku (tekući mjesec) — P04 ga označava kao procjenu. */
export function isCurrentPayslip(yearMonth: string): boolean {
  return yearMonth === DEMO_TODAY.slice(0, 7);
}
