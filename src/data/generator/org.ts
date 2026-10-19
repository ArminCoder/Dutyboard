import type { OrgNode } from '../types';
import { ORG_ROOT_NAME } from '../../app/orgConfig';
import { PLACE } from '../../app/places';

// Organizaciona struktura po SPEC-u linija 264:
// MUP (korijen; naziv iz env konfiguracije)
//   ├─ Uprava policije
//   │    ├─ PU Centar
//   │    │    ├─ PS Centar
//   │    │    │    └─ Smjene: A, B, C, D
//   │    │    └─ PS Stari Grad
//   │    │         └─ Smjene: A, B, C, D
//   │    ├─ PU Novi Grad
//   │    │    ├─ PS Novi Grad
//   │    │    └─ PS Dobrinja
//   │    └─ Posebna jedinica (specijalci, exclusiveRoles)

const SMJENE = ['A', 'B', 'C', 'D'] as const;

export function buildOrgTree(): OrgNode[] {
  const nodes: OrgNode[] = [];

  nodes.push({ id: 'mup', kind: 'mup', name: ORG_ROOT_NAME, parentId: null });
  nodes.push({ id: 'up', kind: 'uprava', name: 'Uprava policije', parentId: 'mup' });

  // `est` = sistematizovan broj izvršilaca po PS (malo iznad stvarne popune → vidljiva upražnjena mjesta).
  const pus = [
    { id: 'pu-centar', name: PLACE.puCentar, pss: [
      { id: 'ps-centar', name: PLACE.psCentar, est: 80 },
      { id: 'ps-stari-grad', name: PLACE.psStariGrad, est: 78 },
    ] },
    { id: 'pu-novi-grad', name: PLACE.puNoviGrad, pss: [
      { id: 'ps-novi-grad', name: PLACE.psNoviGrad, est: 84 },
      { id: 'ps-dobrinja', name: PLACE.psDobrinja, est: 74 },
    ] },
  ];

  for (const pu of pus) {
    nodes.push({ id: pu.id, kind: 'pu', name: pu.name, parentId: 'up' });
    for (const ps of pu.pss) {
      nodes.push({ id: ps.id, kind: 'ps', name: ps.name, parentId: pu.id, establishment: ps.est });
      for (const s of SMJENE) {
        nodes.push({
          id: `${ps.id}-smjena-${s.toLowerCase()}`,
          kind: 'smjena',
          name: `Smjenska grupa ${s}`,
          parentId: ps.id,
        });
      }
    }
  }

  nodes.push({
    id: 'posebna',
    kind: 'posebna',
    name: 'Posebna jedinica',
    parentId: 'up',
    exclusiveRoles: true,
    establishment: 14,
  });

  return nodes;
}

/** Zbraja sistematizaciju (establishment) svih čvorova u scope-u — koristi za popunjenost vs sistematizacija. */
export function establishmentUnder(nodes: OrgNode[], rootId: string): number {
  const inScope = descendantsOf(nodes, rootId);
  return nodes.reduce((sum, n) => (inScope.has(n.id) ? sum + (n.establishment ?? 0) : sum), 0);
}

/** Vraća skup ID-eva svih descendenata čvora (uključujući i sam čvor). */
export function descendantsOf(nodes: OrgNode[], rootId: string): Set<string> {
  const byParent = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.parentId) {
      const list = byParent.get(n.parentId) ?? [];
      list.push(n.id);
      byParent.set(n.parentId, list);
    }
  }
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    for (const c of byParent.get(id) ?? []) stack.push(c);
  }
  return out;
}

/** Vraća sve PS čvorove ispod datog čvora. */
export function pssUnder(nodes: OrgNode[], rootId: string): OrgNode[] {
  const inScope = descendantsOf(nodes, rootId);
  return nodes.filter((n) => n.kind === 'ps' && inScope.has(n.id));
}
