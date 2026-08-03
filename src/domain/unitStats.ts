import type { OrgNode, World } from '../data/types';
import { descendantsOf, establishmentUnder } from '../data/generator/org';
import { DEMO_TODAY } from '../data/generator/dates';

/**
 * Agregatna statistika po organizacionom čvoru — dijeljeni "Compstat" sloj.
 * Koriste je komesarski Operativni pregled i (kasnije) načelnikov pregled stanica.
 * Sve prolazi kroz org scope (descendantsOf), pa je izolacija zadržana.
 */

function prevYM(ym: string): string {
  let [y, m] = ym.split('-').map(Number);
  m -= 1;
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/** Zadnji kompletan mjesec (mjesec prije demo-danas) i prethodni — za period-over-period. */
export const LAST_COMPLETE_MONTH = prevYM(DEMO_TODAY.slice(0, 7));
export const PREV_MONTH = prevYM(LAST_COMPLETE_MONTH);

export interface UnitStat {
  node: OrgNode;
  headcount: number;
  active: number;
  godisnji: number;
  bolovanje: number;
  establishment: number;
  coveragePct: number;
  sickPct: number;
  /** Prekovremeni sati u zadnjem kompletnom mjesecu i prethodnom (period-over-period). */
  otHours: number;
  otHoursPrev: number;
  otKM: number;
  /** Intervencije (učinak) u zadnjem kompletnom mjesecu i prethodnom. */
  intervencije: number;
  intervencijePrev: number;
  /** Postotak važećih certifikata (usklađenost/readiness). */
  certValidPct: number;
}

export function unitStat(w: World, nodeId: string): UnitStat {
  const node = w.orgNodes.find((n) => n.id === nodeId)!;
  const inScope = descendantsOf(w.orgNodes, nodeId);
  const officers = w.officers.filter((o) => inScope.has(o.orgNodeId));
  const ids = new Set(officers.map((o) => o.id));

  const active = officers.filter((o) => o.status === 'aktivan').length;
  const godisnji = officers.filter((o) => o.status === 'godisnji').length;
  const bolovanje = officers.filter((o) => o.status === 'bolovanje').length;
  const establishment = establishmentUnder(w.orgNodes, nodeId);
  const coveragePct =
    establishment > 0
      ? Math.min(100, Math.round((active / establishment) * 100))
      : officers.length > 0
        ? Math.round((active / officers.length) * 100)
        : 0;
  const sickPct = officers.length > 0 ? +((bolovanje / officers.length) * 100).toFixed(1) : 0;

  let otHours = 0;
  let otHoursPrev = 0;
  let intervencije = 0;
  let intervencijePrev = 0;
  for (const p of w.performance) {
    if (!ids.has(p.officerId)) continue;
    if (p.yearMonth === LAST_COMPLETE_MONTH) {
      otHours += p.sati.prekovremeni;
      intervencije += p.intervencije;
    } else if (p.yearMonth === PREV_MONTH) {
      otHoursPrev += p.sati.prekovremeni;
      intervencijePrev += p.intervencije;
    }
  }

  let needCerts = 0;
  let validCerts = 0;
  for (const o of officers) {
    for (const c of o.certifications) {
      needCerts += 1;
      if (!c.expires || c.expires >= DEMO_TODAY) validCerts += 1; // bez roka = trajan
    }
  }
  const certValidPct = needCerts > 0 ? Math.round((validCerts / needCerts) * 100) : 100;

  return {
    node,
    headcount: officers.length,
    active,
    godisnji,
    bolovanje,
    establishment,
    coveragePct,
    sickPct,
    otHours,
    otHoursPrev,
    otKM: otHours * w.finance.overtimeRateKM,
    intervencije,
    intervencijePrev,
    certValidPct,
  };
}

const UNIT_KINDS: OrgNode['kind'][] = ['pu', 'ps', 'smjena', 'posebna'];

/** Direktna djeca-jedinice datog čvora (za drill-down). Posebna jedinica je dijete Uprave. */
export function childUnitsOf(w: World, nodeId: string): OrgNode[] {
  return w.orgNodes.filter((n) => n.parentId === nodeId && UNIT_KINDS.includes(n.kind));
}

export function hasChildUnits(w: World, nodeId: string): boolean {
  return childUnitsOf(w, nodeId).length > 0;
}

/** Putanja od root-a scope-a do fokusiranog čvora (za breadcrumb). */
export function pathFromRoot(w: World, nodeId: string, rootId: string): OrgNode[] {
  const path: OrgNode[] = [];
  let cur: OrgNode | undefined = w.orgNodes.find((n) => n.id === nodeId);
  while (cur) {
    path.unshift(cur);
    if (cur.id === rootId) break;
    cur = w.orgNodes.find((n) => n.id === cur!.parentId);
  }
  return path;
}

/** Mjesečni niz intervencija za scope čvora (za trend graf). */
export function monthlyIntervencije(w: World, nodeId: string, yearPrefix = '2026'): Array<{ label: string; value: number }> {
  const inScope = descendantsOf(w.orgNodes, nodeId);
  const ids = new Set(w.officers.filter((o) => inScope.has(o.orgNodeId)).map((o) => o.id));
  const byMonth = new Map<string, number>();
  for (const p of w.performance) {
    if (!ids.has(p.officerId) || !p.yearMonth.startsWith(yearPrefix)) continue;
    byMonth.set(p.yearMonth, (byMonth.get(p.yearMonth) ?? 0) + p.intervencije);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, v]) => ({ label: ym.slice(5, 7), value: v }));
}
