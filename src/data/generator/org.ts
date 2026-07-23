import type { OrgNode } from '../types';

// Organizaciona struktura po SPEC-u linija 264:
// MUP DK
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

  nodes.push({ id: 'mup', kind: 'mup', name: 'MUP Demo kantona', parentId: null });
  nodes.push({ id: 'up', kind: 'uprava', name: 'Uprava policije', parentId: 'mup' });

  const pus = [
    { id: 'pu-centar', name: 'PU Centar', pss: [
      { id: 'ps-centar', name: 'PS Centar' },
      { id: 'ps-stari-grad', name: 'PS Stari Grad' },
    ] },
    { id: 'pu-novi-grad', name: 'PU Novi Grad', pss: [
      { id: 'ps-novi-grad', name: 'PS Novi Grad' },
      { id: 'ps-dobrinja', name: 'PS Dobrinja' },
    ] },
  ];

  for (const pu of pus) {
    nodes.push({ id: pu.id, kind: 'pu', name: pu.name, parentId: 'up' });
    for (const ps of pu.pss) {
      nodes.push({ id: ps.id, kind: 'ps', name: ps.name, parentId: pu.id });
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
  });

  return nodes;
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
