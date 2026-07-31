import type { World } from '../types';
import { buildOrgTree } from './org';
import { CERTIFICATIONS, buildOperationalRoles } from './roles';
import { generateOfficers } from './officers';
import { generateRoster } from './shifts';
import { generatePerformance } from './performance';
import { generateSoftićPayslips } from './payslip';
import { generateSoftićCourt } from './court';
import { generateVehicles } from './vehicles';
import { buildFinance } from './finance';
import { buildRestRules, buildTargets } from './targets';

const SEED = 20260723; // fiksni seed — SPEC: "isti svijet na svakom deployu"

export function generateWorld(): World {
  const orgNodes = buildOrgTree();
  const puIds = orgNodes.filter((n) => n.kind === 'pu').map((n) => n.id);
  const posebnaId = orgNodes.find((n) => n.kind === 'posebna')!.id;
  const operationalRoles = buildOperationalRoles(puIds, posebnaId);
  const officers = generateOfficers(SEED, orgNodes, operationalRoles);
  const shifts = generateRoster(SEED + 1, officers);
  const courtSummonses = generateSoftićCourt();
  const performance = generatePerformance(SEED + 2, officers);
  const payslips = generateSoftićPayslips(performance, shifts);
  const vehicles = generateVehicles();

  return {
    orgNodes,
    officers,
    operationalRoles,
    certifications: CERTIFICATIONS,
    shifts,
    courtSummonses,
    performance,
    payslips,
    vehicles,
    finance: buildFinance(puIds),
    targets: buildTargets(),
    restRules: buildRestRules(),
  };
}
