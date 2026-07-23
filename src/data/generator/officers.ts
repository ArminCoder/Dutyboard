import type { Officer, OfficerCertificate, OfficerStatus, OperationalRole, OrgNode, Rank } from '../types';
import { chance, intBetween, mulberry32, pick } from './prng';
import { FIRST_NAMES_F, FIRST_NAMES_M, LAST_NAMES } from './names';

// Raspodjela činova ~ realistična piramida.
const RANK_WEIGHTS: Array<[Rank, number]> = [
  ['policajac', 45],
  ['stariji_policajac', 20],
  ['narednik', 12],
  ['stariji_narednik', 8],
  ['mladji_inspektor', 6],
  ['inspektor', 5],
  ['stariji_inspektor', 3],
  ['glavni_inspektor', 1],
];

function pickRank(rand: () => number): Rank {
  const total = RANK_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let t = rand() * total;
  for (const [rank, w] of RANK_WEIGHTS) {
    if (t < w) return rank;
    t -= w;
  }
  return 'policajac';
}

function statusForOfficer(rand: () => number): OfficerStatus {
  const r = rand();
  if (r < 0.05) return 'godisnji';
  if (r < 0.09) return 'bolovanje';
  if (r < 0.12) return 'slobodan_dan';
  return 'aktivan';
}

/** Datum isteka certifikata — "YYYY-MM-DD". Većina buduća, ~3-4 istekla / uskoro isticu (za K01 demo momenat). */
function certExpiryDate(rand: () => number, forceExpired: boolean): string {
  const today = new Date();
  const daysDelta = forceExpired
    ? -intBetween(rand, 30, 300) // već istekao
    : intBetween(rand, 45, 600); // vazi
  const d = new Date(today);
  d.setDate(d.getDate() + daysDelta);
  return d.toISOString().slice(0, 10);
}

/** Raspodjela operativnih uloga po SPEC K01 podaci (linija 133):
 *  60% samo pješačka / 15% + interventna / 8 moto / 6 bicikl / 5 civili
 *  Ostatak (~6%) su specijalci — samo za jedinicu 'posebna'. */
function assignRoles(
  rand: () => number,
  puId: string,
  rolesInPu: OperationalRole[],
): string[] {
  const byName = (n: string) => rolesInPu.find((r) => r.id === `${puId}:${n}`)!;

  const r = rand();
  const roles: string[] = [];
  // svi imaju pješačku po difoltu (radi kad nije u posebnoj)
  roles.push(byName('pjesacka').id, byName('auto').id);
  if (r < 0.15) roles.push(byName('interventna').id);
  if (r >= 0.15 && r < 0.23) roles.push(byName('moto').id);
  if (r >= 0.23 && r < 0.29) roles.push(byName('bicikl').id);
  if (r >= 0.29 && r < 0.34) roles.push(byName('civilna').id);
  return roles;
}

const SMJENSKE_PO_PS = 20; // 4 smjene × 5 ljudi po smjeni ≈ 80 po PS; Novi Grad malo veći

export function generateOfficers(
  seed: number,
  orgNodes: OrgNode[],
  operationalRoles: OperationalRole[],
): Officer[] {
  const rand = mulberry32(seed);
  const officers: Officer[] = [];
  let idCounter = 1;

  const smjene = orgNodes.filter((n) => n.kind === 'smjena');
  const pss = orgNodes.filter((n) => n.kind === 'ps');
  const posebna = orgNodes.find((n) => n.kind === 'posebna')!;

  const pathToPu = (nodeId: string): string => {
    let cur: OrgNode | undefined = orgNodes.find((n) => n.id === nodeId);
    while (cur && cur.kind !== 'pu') {
      cur = orgNodes.find((n) => n.id === cur!.parentId!);
    }
    return cur?.id ?? 'pu-centar';
  };

  // Named demo characters iz SPEC linije 57-61
  const namedDemo: Array<{ name: string; rank: Rank; orgNodeId: string }> = [
    { name: 'Amar Softić', rank: 'policajac', orgNodeId: 'ps-centar-smjena-b' },
    { name: 'Damir Kovač', rank: 'stariji_narednik', orgNodeId: 'ps-centar' },
    { name: 'Samir Begić', rank: 'stariji_inspektor', orgNodeId: 'pu-centar' },
    { name: 'Edin Hodžić', rank: 'stariji_inspektor', orgNodeId: 'pu-novi-grad' },
  ];

  for (const d of namedDemo) {
    const puId = pathToPu(d.orgNodeId);
    const rolesInPu = operationalRoles.filter((r) => r.orgNodeId === puId);
    const roleIds = puId === 'pu-centar' && d.name === 'Amar Softić'
      ? [`${puId}:pjesacka`, `${puId}:auto`, `${puId}:interventna`]
      : assignRoles(rand, puId, rolesInPu);
    const certs = requiredCertsFor(roleIds, operationalRoles);
    officers.push({
      id: `off-${String(idCounter++).padStart(4, '0')}`,
      name: d.name,
      rank: d.rank,
      orgNodeId: d.orgNodeId,
      operationalRoleIds: roleIds,
      certifications: certs.map((certId) => ({
        certId,
        expires: certExpiryDate(rand, false),
      })),
      clearanceLevel: 'interno',
      equipmentAssigned: [],
      status: 'aktivan',
    });
  }

  // Popunjavanje smjena
  const forcedExpiredTargets = new Set<number>([12, 47, 89, 134]); // 3-4 istekla — SPEC linija 268

  for (const smjena of smjene) {
    for (let i = 0; i < SMJENSKE_PO_PS / 4; i++) {
      const puId = pathToPu(smjena.id);
      const rolesInPu = operationalRoles.filter((r) => r.orgNodeId === puId);
      const roleIds = assignRoles(rand, puId, rolesInPu);
      const requiredCerts = requiredCertsFor(roleIds, operationalRoles);
      const isFemale = chance(rand, 0.15);
      const first = pick(rand, isFemale ? FIRST_NAMES_F : FIRST_NAMES_M);
      const last = pick(rand, LAST_NAMES);

      const officerNum = idCounter;
      const forceOneExpired = forcedExpiredTargets.has(officerNum);

      const certObjs: OfficerCertificate[] = requiredCerts.map((certId, idx) => ({
        certId,
        expires: certExpiryDate(rand, forceOneExpired && idx === 0),
      }));

      officers.push({
        id: `off-${String(idCounter++).padStart(4, '0')}`,
        name: `${first} ${last}`,
        rank: pickRank(rand),
        orgNodeId: smjena.id,
        operationalRoleIds: roleIds,
        certifications: certObjs,
        clearanceLevel: 'interno',
        equipmentAssigned: [],
        status: statusForOfficer(rand),
      });
    }
  }

  // Načelnici i dežurni (fiksni) — dodaj ako fale
  ensureNamed(officers, orgNodes, operationalRoles);

  // Posebna jedinica — 12 specijalaca
  for (let i = 0; i < 12; i++) {
    const first = pick(rand, FIRST_NAMES_M);
    const last = pick(rand, LAST_NAMES);
    officers.push({
      id: `off-${String(idCounter++).padStart(4, '0')}`,
      name: `${first} ${last}`,
      rank: pickRank(rand),
      orgNodeId: posebna.id,
      operationalRoleIds: [`${posebna.id}:specijalci`],
      certifications: [
        { certId: 'cert-osnovna', expires: certExpiryDate(rand, false) },
        { certId: 'cert-gadjanje', expires: certExpiryDate(rand, false) },
        { certId: 'cert-specijalna', expires: certExpiryDate(rand, false) },
      ],
      clearanceLevel: 'povjerljivo',
      equipmentAssigned: [],
      status: chance(rand, 0.1) ? 'godisnji' : 'aktivan',
    });
  }

  // PS-level komandiri (ostatak na razini PS, ne smjene)
  for (const ps of pss) {
    if (officers.some((o) => o.orgNodeId === ps.id)) continue;
    const first = pick(rand, FIRST_NAMES_M);
    const last = pick(rand, LAST_NAMES);
    officers.push({
      id: `off-${String(idCounter++).padStart(4, '0')}`,
      name: `${first} ${last}`,
      rank: 'stariji_narednik',
      orgNodeId: ps.id,
      operationalRoleIds: [],
      certifications: [
        { certId: 'cert-osnovna', expires: certExpiryDate(rand, false) },
        { certId: 'cert-gadjanje', expires: certExpiryDate(rand, false) },
      ],
      clearanceLevel: 'interno',
      equipmentAssigned: [],
      status: 'aktivan',
    });
  }

  return officers;
}

function requiredCertsFor(roleIds: string[], allRoles: OperationalRole[]): string[] {
  const set = new Set<string>();
  for (const rid of roleIds) {
    const role = allRoles.find((r) => r.id === rid);
    if (!role) continue;
    for (const c of role.requiredCertIds) set.add(c);
  }
  return [...set];
}

function ensureNamed(_officers: Officer[], _orgNodes: OrgNode[], _roles: OperationalRole[]) {
  // Placeholder — imenovani (Softić, Kovač, Begić, Hodžić) su već dodani prije generisanja mase.
}
