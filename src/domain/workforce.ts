import type { OrgNode, World } from '../data/types';
import { descendantsOf, establishmentUnder } from '../data/generator/org';
import { DEMO_TODAY, yearsBetween } from '../data/generator/dates';

/**
 * Kadrovska projekcija — starosna piramida, penzioni greben i potreba za
 * zapošljavanjem. Sve se računa iz hireDate/birthDate, bez ličnih imena.
 */

// Uslovi za penziju (demo pretpostavka): policijskim službenicima staž se računa
// uvećano (beneficirani staž), pa odlaze ranije od opće starosne granice —
// starosna granica 60 godina ILI 35 godina staža, šta prije nastupi.
export const PENSION_AGE = 60;
export const PENSION_SERVICE_YEARS = 35;

/** Godine do sticanja uslova za penziju (po povoljnijem osnovu). */
export function yearsToPension(birthDate: string, hireDate: string, on = DEMO_TODAY): number {
  const byAge = PENSION_AGE - yearsBetween(birthDate, on);
  const byService = PENSION_SERVICE_YEARS - yearsBetween(hireDate, on);
  return Math.min(byAge, byService);
}

export interface AgeBucket {
  label: string;
  from: number;
  to: number;
  count: number;
}

const BUCKETS: Array<[number, number]> = [
  [20, 24], [25, 29], [30, 34], [35, 39], [40, 44], [45, 49], [50, 54], [55, 59], [60, 64],
];

export function agePyramid(w: World, nodeId: string): AgeBucket[] {
  const inScope = descendantsOf(w.orgNodes, nodeId);
  const officers = w.officers.filter((o) => inScope.has(o.orgNodeId));
  return BUCKETS.map(([from, to]) => ({
    label: `${from}–${to}`,
    from,
    to,
    count: officers.filter((o) => {
      const age = yearsBetween(o.birthDate, DEMO_TODAY);
      return age >= from && age <= to;
    }).length,
  }));
}

export interface RetirementWindow {
  label: string;
  /** Broj policajaca koji u tom prozoru navršava starosnu granicu. */
  count: number;
  cumulative: number;
}

/** Penzioni greben — po polugodištima u naredna 24 mjeseca. */
export function retirementCliff(w: World, nodeId: string): RetirementWindow[] {
  const inScope = descendantsOf(w.orgNodes, nodeId);
  const officers = w.officers.filter((o) => inScope.has(o.orgNodeId));
  const windows = [
    { label: '0–6 mj.', from: 0, to: 0.5 },
    { label: '6–12 mj.', from: 0.5, to: 1 },
    { label: '12–18 mj.', from: 1, to: 1.5 },
    { label: '18–24 mj.', from: 1.5, to: 2 },
  ];

  let cumulative = 0;
  return windows.map((win) => {
    const count = officers.filter((o) => {
      const y = yearsToPension(o.birthDate, o.hireDate);
      return y > win.from && y <= win.to;
    }).length;
    cumulative += count;
    return { label: win.label, count, cumulative };
  });
}

export interface StaffingRow {
  node: OrgNode;
  establishment: number;
  actual: number;
  vacancies: number;
  fillPct: number;
  retiring24m: number;
  /** Ukupna potreba: trenutna upražnjena mjesta + odlasci u penziju. */
  hiringNeed: number;
}

export function staffingByUnit(w: World, parentId: string, kind: OrgNode['kind'] = 'pu'): StaffingRow[] {
  const inScope = descendantsOf(w.orgNodes, parentId);
  const units = w.orgNodes.filter((n) => n.kind === kind && inScope.has(n.id) && n.id !== parentId);

  return units.map((node) => {
    const unitScope = descendantsOf(w.orgNodes, node.id);
    const officers = w.officers.filter((o) => unitScope.has(o.orgNodeId));
    const establishment = establishmentUnder(w.orgNodes, node.id);
    const actual = officers.length;
    const retiring24m = officers.filter((o) => yearsToPension(o.birthDate, o.hireDate) <= 2).length;
    const vacancies = Math.max(0, establishment - actual);
    return {
      node,
      establishment,
      actual,
      vacancies,
      fillPct: establishment > 0 ? Math.round((actual / establishment) * 100) : 100,
      retiring24m,
      hiringNeed: vacancies + retiring24m,
    };
  });
}

export function averageService(w: World, nodeId: string): number {
  const inScope = descendantsOf(w.orgNodes, nodeId);
  const officers = w.officers.filter((o) => inScope.has(o.orgNodeId));
  if (officers.length === 0) return 0;
  return +(officers.reduce((s, o) => s + yearsBetween(o.hireDate, DEMO_TODAY), 0) / officers.length).toFixed(1);
}

export function averageAge(w: World, nodeId: string): number {
  const inScope = descendantsOf(w.orgNodes, nodeId);
  const officers = w.officers.filter((o) => inScope.has(o.orgNodeId));
  if (officers.length === 0) return 0;
  return +(officers.reduce((s, o) => s + yearsBetween(o.birthDate, DEMO_TODAY), 0) / officers.length).toFixed(1);
}
