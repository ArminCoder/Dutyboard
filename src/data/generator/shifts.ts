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

/** Stanice za koje se generiše raspored (demo: dvije, kao što OKC i prikazuje). */
const ROSTER_STATIONS: Array<{ psId: string; puId: string; smjenaPrefix: string; autoPlates: string[]; motoPlate: string; sektorPlate: string; sektori: number[] }> = [
  {
    psId: 'ps-centar',
    puId: 'pu-centar',
    smjenaPrefix: 'ps-centar-smjena-',
    autoPlates: ['A-311-K-121', 'A-311-K-122', 'A-311-K-123'],
    motoPlate: 'A-311-M-104',
    sektorPlate: 'A-311-K-124',
    // PS Centar pokriva 12 sektora; po smjeni se pokriva dio njih.
    sektori: [1, 3, 5, 7, 9, 11],
  },
  {
    psId: 'ps-novi-grad',
    puId: 'pu-novi-grad',
    smjenaPrefix: 'ps-novi-grad-smjena-',
    autoPlates: ['A-521-K-201', 'A-521-K-202', 'A-521-K-203'],
    motoPlate: 'A-521-M-108',
    sektorPlate: 'A-521-K-204',
    sektori: [2, 4, 6, 8],
  },
];

/**
 * Mjesečni raspored (avgust 2026) sa stvarnim sastavom smjene:
 * 3 auto-patrole, interventna, straža ispred stanice, dvije pješačke
 * i sektorske patrole (uglavnom pješice). Ukupno ~17 izvršilaca po smjeni.
 */
export function generateRoster(seed: number, officers: Officer[]): Shift[] {
  const rand = mulberry32(seed);
  const shifts: Shift[] = [];
  const softić = officers.find((o) => o.name === 'Amar Softić');

  for (const st of ROSTER_STATIONS) {
    const byGroup: Record<Group, Officer[]> = { A: [], B: [], C: [], D: [] };
    for (const g of GROUPS) {
      byGroup[g] = officers.filter((o) => o.orgNodeId === `${st.smjenaPrefix}${g.toLowerCase()}`);
    }

    for (let date = AUG_2026_START; date <= AUG_2026_END; date = addDays(date, 1)) {
      for (const kind of SHIFT_KINDS) {
        const workingGroup = groupWorking(date, kind);
        const pool = [...byGroup[workingGroup]];
        const slots: ShiftSlot[] = [];
        const isNight = kind === 'II';
        const dayNum = Number(date.slice(-2));

        // Tri auto-patrole — okosnica smjene.
        st.autoPlates.forEach((plate, i) => {
          const assigned = pickAssignments(pool, 2, rand);
          // Softić radi u svojoj grupi (B) noćnu u prvoj auto-patroli PS Centar.
          if (st.psId === 'ps-centar' && i === 0 && softić && workingGroup === 'B' && isNight && !assigned.includes(softić.id)) {
            assigned[0] = softić.id;
          }
          slots.push({
            id: `slot-${st.psId}-${date}-${kind}-auto-${i + 1}`,
            requiredRoleId: `${st.puId}:auto`,
            capacity: 2,
            assignedOfficerIds: assigned,
            vehiclePlate: plate,
            callSign: `Auto-patrola ${i + 1}`,
          });
        });

        // Interventna — namjerno nepopunjena 26./27. noću (alarm u K01).
        const leaveEmpty = st.psId === 'ps-centar' && isNight && (dayNum === 26 || dayNum === 27);
        slots.push({
          id: `slot-${st.psId}-${date}-${kind}-interventna`,
          requiredRoleId: `${st.puId}:interventna`,
          capacity: 2,
          assignedOfficerIds: leaveEmpty ? [] : pickAssignments(pool, 2, rand),
          callSign: 'Interventna 3-1',
        });

        // Straža ispred stanice — stalno mjesto, ne kreće se.
        slots.push({
          id: `slot-${st.psId}-${date}-${kind}-straza`,
          requiredRoleId: `${st.puId}:pjesacka`,
          capacity: 1,
          assignedOfficerIds: pickAssignments(pool, 1, rand),
          callSign: 'Straža PS',
        });

        // Dvije pješačke patrole.
        for (let i = 1; i <= 2; i++) {
          slots.push({
            id: `slot-${st.psId}-${date}-${kind}-pjesacka-${i}`,
            requiredRoleId: `${st.puId}:pjesacka`,
            capacity: 2,
            assignedOfficerIds: pickAssignments(pool, 2, rand),
            callSign: `Pješačka 1-${i}`,
          });
        }

        // Sektorske patrole — po sektorima područja, uglavnom pješice.
        let sektorCarUsed = false;
        for (const sektor of st.sektori) {
          // Sektorske patrole su uglavnom pješice; najviše jedna po smjeni dobije rezervno vozilo.
          const withCar = !sektorCarUsed && chance(rand, 0.3);
          if (withCar) sektorCarUsed = true;
          slots.push({
            id: `slot-${st.psId}-${date}-${kind}-sektor-${sektor}`,
            requiredRoleId: `${st.puId}:pjesacka`,
            capacity: 1,
            assignedOfficerIds: pickAssignments(pool, 1, rand),
            callSign: `Sektor ${sektor}`,
            vehiclePlate: withCar ? st.sektorPlate : undefined,
          });
        }

        // Moto — samo dnevna smjena i po vremenskim uslovima.
        if (kind === 'I' && chance(rand, 0.8)) {
          slots.push({
            id: `slot-${st.psId}-${date}-${kind}-moto`,
            requiredRoleId: `${st.puId}:moto`,
            capacity: 1,
            assignedOfficerIds: pickAssignments(pool, 1, rand),
            vehiclePlate: st.motoPlate,
            callSign: 'Moto 4-1',
          });
        }

        shifts.push({ id: `shift-${st.psId}-${date}-${kind}`, date, kind, psId: st.psId, slots });
      }
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
