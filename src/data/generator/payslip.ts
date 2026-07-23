import type { Payslip } from '../types';

/** Poliran mockup platne liste za Softića — SPEC linija 104.
 *  Iznosi u KM, realistični za policajca s 5+ godina radnog staža. */
export function generateSoftićPayslip(): Payslip {
  return {
    officerId: 'off-0001',
    yearMonth: '2026-08',
    lines: [
      { label: 'Osnovna plata', amount: 1180 },
      { label: 'Minuli rad (6%)', amount: 71 },
      { label: 'Noćni rad (52 h)', amount: 128 },
      { label: 'Prekovremeni (14 h)', amount: 91 },
      { label: 'Sati sa suda (5 h)', amount: 36 },
      { label: 'Topli obrok', amount: 240 },
      { label: 'Prevoz', amount: 65 },
    ],
    net: 1811,
  };
}
