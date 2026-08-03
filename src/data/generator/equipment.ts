import type { EquipmentAssignment, Officer } from '../types';
import { intBetween, mulberry32 } from './prng';

/**
 * Lično zaduženje policajca — oružje sa serijskim brojem, radio-stanica, značka,
 * prsluk i palica. Radi se u zasebnom prolazu, s vlastitim PRNG-om, da se niz
 * poziva u `generateOfficers` ne pomjeri (inače bi se promijenili ID-evi policajaca).
 *
 * Zaduženje se veže na policajca; komandir po ovome vidi šta je izdato, a šta na stanju.
 */

const PISTOLJ_MODELI = ['Glock 17', 'Glock 19', 'CZ 99', 'HS Produkt SF19'];
const RADIO_MODELI = ['Motorola R7', 'Motorola DP4800', 'Hytera PD785'];

/** Deterministički hash — isti policajac uvijek dobije isto zaduženje. */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function equipmentFor(officer: Officer, seed: number): EquipmentAssignment[] {
  const rand = mulberry32(seed + hashCode(officer.id));
  const n = Number(officer.id.replace(/\D/g, '')) || 1;

  const pistolj = PISTOLJ_MODELI[intBetween(rand, 0, PISTOLJ_MODELI.length - 1)];
  const radio = RADIO_MODELI[intBetween(rand, 0, RADIO_MODELI.length - 1)];
  const serial = `G-${intBetween(rand, 10000, 99999)}`;

  const out: EquipmentAssignment[] = [
    { equipmentId: `eq-oruzje-${officer.id}`, type: 'oruzje', identifier: `${pistolj} · s/n ${serial}` },
    { equipmentId: `eq-radio-${officer.id}`, type: 'radio', identifier: `${radio} · #${String(n).padStart(4, '0')}` },
    { equipmentId: `eq-znacka-${officer.id}`, type: 'znacka', identifier: `B-${4000 + n}` },
    { equipmentId: `eq-uniforma-${officer.id}`, type: 'uniforma', identifier: 'zimska + ljetna (2 kompleta)' },
  ];

  // Prsluk i računar nisu zaduženi svima — komandirski pregled tako ima stvarnu razliku
  // između izdatog i na stanju.
  if (rand() < 0.85) {
    out.push({ equipmentId: `eq-prsluk-${officer.id}`, type: 'prsluk', identifier: `BP-${1000 + n}` });
  }
  return out;
}

/** Popunjava `equipmentAssigned` za sve policajce (mutira listu na mjestu). */
export function assignEquipment(seed: number, officers: Officer[]): void {
  for (const o of officers) {
    o.equipmentAssigned = equipmentFor(o, seed);
  }
}
