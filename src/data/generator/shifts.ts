import type { Officer, Shift, ShiftKind } from '../types';
import { DEMO_TODAY, addDays } from './dates';
import { mulberry32, pick } from './prng';

const SHIFT_KINDS: readonly ShiftKind[] = ['I', 'II'];

/** Pojednostavljeno: pravimo raspored za PS Centar za 14 dana oko "danas".
 *  Svaka smjena ima 1 auto-patrolu za Softićevu smjensku grupu. */
export function generateSoftićShifts(seed: number, officers: Officer[]): Shift[] {
  const rand = mulberry32(seed);
  const shifts: Shift[] = [];
  const partners = officers.filter(
    (o) => o.orgNodeId === 'ps-centar-smjena-b' && o.name !== 'Amar Softić',
  );
  const partnerName = partners.length ? pick(rand, partners).name : null;

  for (let offset = -7; offset <= 7; offset++) {
    const date = addDays(DEMO_TODAY, offset);
    for (const kind of SHIFT_KINDS) {
      // 4 grupe → svaka grupa radi 1 od 4 smjena; Softićeva grupa B radi II smjenu u paru datuma
      const worksToday = dayWorksForGroup('B', date, kind);
      if (!worksToday) continue;

      const slotId = `slot-${date}-${kind}-b`;
      shifts.push({
        id: `shift-${date}-${kind}-b`,
        date,
        kind,
        psId: 'ps-centar',
        slots: [
          {
            id: slotId,
            requiredRoleId: 'pu-centar:auto',
            capacity: 2,
            assignedOfficerIds: partnerName ? ['off-0001', partnersOff(partnerName, partners)] : ['off-0001'],
            vehiclePlate: 'A-311-K-121',
            callSign: 'Auto-patrola 2-1 · Interventna',
          },
        ],
      });
    }
  }

  return shifts;
}

function partnersOff(name: string, partners: Officer[]): string {
  return partners.find((p) => p.name === name)?.id ?? partners[0]?.id ?? '';
}

/** Vrlo pojednostavljena "rotacija" grupa — 2 dana radi, 2 dana slobodno. */
function dayWorksForGroup(_group: 'A' | 'B' | 'C' | 'D', date: string, kind: ShiftKind): boolean {
  const [, , d] = date.split('-');
  const day = Number(d);
  // grupa B radi u parne dane II smjenu, u neparne dane I smjenu je slobodna (i sl.)
  if (kind === 'II') return day % 2 === 0;
  return day % 4 === 1;
}
