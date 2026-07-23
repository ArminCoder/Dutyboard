import type { World } from '../types';
import { buildOrgTree } from './org';
import { CERTIFICATIONS, buildOperationalRoles } from './roles';
import { generateOfficers } from './officers';
import { generateSoftićShifts } from './shifts';
import { generatePerformance } from './performance';
import { generateSoftićPayslip } from './payslip';
import { generateSoftićCourt } from './court';

const SEED = 20260723; // fiksni seed — SPEC: "isti svijet na svakom deployu"

export function generateWorld(): World {
  const orgNodes = buildOrgTree();
  const puIds = orgNodes.filter((n) => n.kind === 'pu').map((n) => n.id);
  const posebnaId = orgNodes.find((n) => n.kind === 'posebna')!.id;
  const operationalRoles = buildOperationalRoles(puIds, posebnaId);
  const officers = generateOfficers(SEED, orgNodes, operationalRoles);
  const shifts = generateSoftićShifts(SEED + 1, officers);
  const courtSummonses = generateSoftićCourt();
  const performance = generatePerformance(SEED + 2, officers);
  const payslips = [generateSoftićPayslip()];

  return {
    orgNodes,
    officers,
    operationalRoles,
    certifications: CERTIFICATIONS,
    shifts,
    courtSummonses,
    performance,
    payslips,
  };
}
