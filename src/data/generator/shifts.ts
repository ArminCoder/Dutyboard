import type { Officer, Shift, ShiftKind, ShiftSlot } from '../types';
import { DEMO_TODAY, addDays } from './dates';
import { chance, mulberry32 } from './prng';

const SHIFT_KINDS: readonly ShiftKind[] = ['I', 'II'];

/**
 * Rotacija 4 smjenske grupe (A, B, C, D) — kanonski model MUP-a:
 *  dan 0: A radi I, B radi II, C slobodan, D obavezni odmor
 *  dan 1: rotacija
 * Za demo pojednostavljeno: grupa radi 2 dana u nizu (dan+noć) pa 2 dana slobodna.
 */
type Group = 'A' | 'B' | 'C' | 'D';
const GROUPS: Group[] = ['A', 'B', 'C', 'D'];

function groupWorking(date: string, kind: ShiftKind): Group {
  // Fiksni jedan mapping — nije važan realizam, važna je konzistencija.
  const dayOfCycle = daysSince(DEMO_TODAY, date) % 4;
  const positive = ((dayOfCycle % 4) + 4) % 4;
  const idx = kind === 'I' ? positive : (positive + 1) % 4;
  return GROUPS[idx];
}

function daysSince(fromISO: string, toISO: string): number {
  const a = new Date(fromISO).getTime();
  const b = new Date(toISO).getTime();
  return Math.round((b - a) / 86400000);
}

const AUG_2026_START = '2026-08-01';
const AUG_2026_END = '2026-08-31';

/** Generiše mjesečni raspored za PS Centar (avgust 2026) + nekoliko dana oko "danas".
 *  Ostale PS ostavljamo prazne u Phase 3 — K01 je vezan za PS Centar u demo scenariju. */
export function generateRoster(seed: number, officers: Officer[]): Shift[] {
  const rand = mulberry32(seed);
  const shifts: Shift[] = [];

  const byGroup: Record<Group, Officer[]> = { A: [], B: [], C: [], D: [] };
  const smjenaByGroup: Record<Group, string> = {
    A: 'ps-centar-smjena-a',
    B: 'ps-centar-smjena-b',
    C: 'ps-centar-smjena-c',
    D: 'ps-centar-smjena-d',
  };
  for (const g of GROUPS) {
    byGroup[g] = officers.filter((o) => o.orgNodeId === smjenaByGroup[g]);
  }

  const softić = officers.find((o) => o.name === 'Amar Softić');

  for (let date = AUG_2026_START; date <= AUG_2026_END; date = addDays(date, 1)) {
    for (const kind of SHIFT_KINDS) {
      const workingGroup = groupWorking(date, kind);
      const pool = [...byGroup[workingGroup]];

      const slots: ShiftSlot[] = [];

      // Auto-patrola 2-1 — uvijek u rasporedu
      const autoAssignments = pickAssignments(pool, 2, rand);
      // Softić u svoju grupu (B) II smjenu — pobrini se da bude u kartici
      if (softić && workingGroup === 'B' && kind === 'II' && !autoAssignments.includes(softić.id)) {
        autoAssignments[0] = softić.id;
      }
      slots.push({
        id: `slot-${date}-${kind}-auto`,
        requiredRoleId: 'pu-centar:auto',
        capacity: 2,
        assignedOfficerIds: autoAssignments,
        vehiclePlate: 'A-311-K-121',
        callSign: 'Auto-patrola 2-1 · Interventna',
      });

      // Interventna — neki dani ostaju nepopunjeni (alarm scenarij za noćnu smjenu)
      const isNight = kind === 'II';
      const dayNum = Number(date.slice(-2));
      const leaveInterventnaEmpty = isNight && (dayNum === 26 || dayNum === 27);
      const intAssignments = leaveInterventnaEmpty ? [] : pickAssignments(pool, 1, rand);
      slots.push({
        id: `slot-${date}-${kind}-interventna`,
        requiredRoleId: 'pu-centar:interventna',
        capacity: 1,
        assignedOfficerIds: intAssignments,
        callSign: 'Interventna 3-1',
      });

      // Moto — samo dnevna smjena
      if (kind === 'I') {
        slots.push({
          id: `slot-${date}-${kind}-moto`,
          requiredRoleId: 'pu-centar:moto',
          capacity: 1,
          assignedOfficerIds: chance(rand, 0.8) ? pickAssignments(pool, 1, rand) : [],
          vehiclePlate: 'A-311-M-104',
          callSign: 'Moto 4-1',
        });
      }

      // Pješačka
      slots.push({
        id: `slot-${date}-${kind}-pjesacka`,
        requiredRoleId: 'pu-centar:pjesacka',
        capacity: 2,
        assignedOfficerIds: pickAssignments(pool, 2, rand),
        callSign: 'Pješačka 1-1',
      });

      shifts.push({
        id: `shift-${date}-${kind}`,
        date,
        kind,
        psId: 'ps-centar',
        slots,
      });
    }
  }

  return shifts;
}

function pickAssignments(pool: Officer[], count: number, rand: () => number): string[] {
  const copy = [...pool];
  const out: string[] = [];
  for (let i = 0; i < count && copy.length; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy.splice(idx, 1)[0].id);
  }
  return out;
}
