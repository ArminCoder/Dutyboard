import { useMemo } from 'react';
import { world } from './world';
import { descendantsOf } from './generator/org';
import { useSession } from '../app/RoleContext';
import type { Officer, OperationalRole, OrgNode, World } from './types';

/**
 * Non-negotiable behavior #1 (SPEC linija 346): scoping je stvaran.
 *
 * Svaka lista/dashboard/graf koji vidi bilo koja uloga MORA proći kroz ovaj hook.
 * Vraća pod-svijet u kojem su prisutni samo org čvorovi i osoblje unutar scope-a
 * trenutne sesije. Kad se sesija promijeni (npr. Begić → Hodžić), memoizacija
 * se invalidira i sve se automatski osvježi bez leakage-a.
 */
export function useScopedWorld(): World {
  const session = useSession();
  return useMemo(() => scopeWorld(world, session.scopeNodeId), [session.scopeNodeId]);
}

export function scopeWorld(w: World, scopeNodeId: string): World {
  const inScope = descendantsOf(w.orgNodes, scopeNodeId);
  const orgNodes: OrgNode[] = w.orgNodes.filter((n) => inScope.has(n.id));
  const officers: Officer[] = w.officers.filter((o) => inScope.has(o.orgNodeId));
  const officerRoleIds = new Set<string>();
  for (const o of officers) for (const r of o.operationalRoleIds) officerRoleIds.add(r);
  const roleOwnerIds = new Set<string>(officers.map((o) => o.orgNodeId));
  const roleCatalogOwners = new Set<string>();
  for (const id of inScope) roleCatalogOwners.add(id);
  const operationalRoles: OperationalRole[] = w.operationalRoles.filter(
    (r) => roleCatalogOwners.has(r.orgNodeId) || officerRoleIds.has(r.id) || roleOwnerIds.has(r.orgNodeId),
  );

  const officerIds = new Set(officers.map((o) => o.id));
  const psIds = new Set(orgNodes.filter((n) => n.kind === 'ps').map((n) => n.id));

  return {
    orgNodes,
    officers,
    operationalRoles,
    certifications: w.certifications, // katalog certifikata je globalan
    shifts: w.shifts.filter((s) => psIds.has(s.psId)),
    courtSummonses: w.courtSummonses.filter((c) => officerIds.has(c.officerId)),
    performance: w.performance.filter((p) => officerIds.has(p.officerId)),
    payslips: w.payslips.filter((p) => officerIds.has(p.officerId)),
    // Ne samo PS — vozilo može biti vezano i za Upravu (helikopter) ili
    // posebnu jedinicu (specijalna vozila); vidi ga onaj čiji scope ih obuhvata.
    vehicles: w.vehicles.filter((v) => inScope.has(v.psId)),
    // Strateški podaci su kantonalne konstante/politike — prolaze kroz scope neizmijenjeni.
    // (unitBudgets ostaju cijeli; nijedan scoped ekran ih ne prikazuje ispod komesara.)
    finance: w.finance,
    targets: w.targets,
    restRules: w.restRules,
  };
}

export function useOrgNode(nodeId: string | null | undefined): OrgNode | null {
  return useMemo(() => world.orgNodes.find((n) => n.id === nodeId) ?? null, [nodeId]);
}
