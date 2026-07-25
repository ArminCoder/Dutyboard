import type { Vehicle } from '../types';
import { addDays, DEMO_TODAY } from './dates';

/** Fiksni vozni park — dovoljno da eligibility zna kada nema slobodnog motocikla. */
export function generateVehicles(): Vehicle[] {
  const out: Vehicle[] = [];

  const psFleet: Array<{ psId: string; auto: number; moto: number; bicikl: number }> = [
    { psId: 'ps-centar', auto: 5, moto: 2, bicikl: 3 },
    { psId: 'ps-stari-grad', auto: 4, moto: 1, bicikl: 2 },
    { psId: 'ps-novi-grad', auto: 6, moto: 1, bicikl: 2 },
    { psId: 'ps-dobrinja', auto: 5, moto: 0, bicikl: 1 },
  ];

  let plateNum = 100;
  for (const ps of psFleet) {
    const prefix = ps.psId === 'ps-centar' ? 'A-311' : ps.psId === 'ps-stari-grad' ? 'A-411' : ps.psId === 'ps-novi-grad' ? 'A-521' : 'A-611';
    for (let i = 0; i < ps.auto; i++) {
      const isServisiran = i === 0 && ps.psId === 'ps-centar'; // 1 vozilo trenutno servisirano
      out.push({
        id: `veh-auto-${ps.psId}-${i}`,
        kind: 'auto',
        plate: `${prefix}-K-${plateNum++}`,
        model: 'Škoda Octavia',
        psId: ps.psId,
        status: isServisiran ? 'servis' : 'ispravno',
        serviceDue: addDays(DEMO_TODAY, 60 + i * 30),
        registrationDue: addDays(DEMO_TODAY, 180 + i * 20),
      });
    }
    for (let i = 0; i < ps.moto; i++) {
      const isServisiran = ps.psId === 'ps-centar' && i === 1; // 1 od 2 motocikla u Centru servisiran → "Nema slobodnog motocikla" u nekim slotovima
      out.push({
        id: `veh-moto-${ps.psId}-${i}`,
        kind: 'motocikl',
        plate: `${prefix}-M-${plateNum++}`,
        model: 'Yamaha FJR1300',
        psId: ps.psId,
        status: isServisiran ? 'servis' : 'ispravno',
        serviceDue: addDays(DEMO_TODAY, 45 + i * 25),
      });
    }
    for (let i = 0; i < ps.bicikl; i++) {
      out.push({
        id: `veh-bicikl-${ps.psId}-${i}`,
        kind: 'bicikl',
        plate: `BIC-${plateNum++}`,
        model: 'Trek FX',
        psId: ps.psId,
        status: 'ispravno',
      });
    }
  }

  return out;
}
