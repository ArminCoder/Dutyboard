import type { OrgNode, World } from '../data/types';
import { descendantsOf } from '../data/generator/org';
import { LAST_COMPLETE_MONTH } from './unitStats';

/**
 * Usklađenost s pravilima radnog vremena (EU direktiva) na nivou Uprave.
 * Sedmično radno vrijeme je u seed-u zdravo (~38 h prosjek), pa je stvarni signal
 * prekomjeran prekovremeni rad — regulisan kao dio radnog vremena. Klasifikacija je
 * izvedena iz stvarnih sati zadnjeg kompletnog mjeseca; ništa se ne izmišlja.
 */

export type WtStatus = 'compliant' | 'atRisk' | 'breached';

/** Radni sati mjesečno = redovni + prekovremeni + sud (noćni je opisni podskup, ne dodaje se). */
function monthlyWorkHours(p: { redovni: number; prekovremeni: number; sud: number }): number {
  return p.redovni + p.prekovremeni + p.sud;
}

export function classifyWt(w: World, prekovremeni: number, weeklyHours: number): WtStatus {
  const otMax = w.targets.overtimeHoursPerOfficerMax;
  if (prekovremeni > otMax * 1.25 || weeklyHours > w.restRules.maxWeeklyHours) return 'breached';
  if (prekovremeni > otMax || weeklyHours > w.restRules.maxWeeklyHours * 0.9) return 'atRisk';
  return 'compliant';
}

export interface WorkTimeStat {
  node: OrgNode;
  withData: number;
  compliant: number;
  atRisk: number;
  breached: number;
  compliancePct: number;
  avgWeeklyHours: number;
  nightSharePct: number;
  otOverLimit: number;
}

export function workTimeStat(w: World, nodeId: string): WorkTimeStat {
  const node = w.orgNodes.find((n) => n.id === nodeId)!;
  const inScope = descendantsOf(w.orgNodes, nodeId);
  const ids = new Set(w.officers.filter((o) => inScope.has(o.orgNodeId)).map((o) => o.id));

  let withData = 0;
  let compliant = 0;
  let atRisk = 0;
  let breached = 0;
  let sumWeekly = 0;
  let sumNight = 0;
  let otOverLimit = 0;
  const otMax = w.targets.overtimeHoursPerOfficerMax;

  for (const p of w.performance) {
    if (p.yearMonth !== LAST_COMPLETE_MONTH || !ids.has(p.officerId)) continue;
    withData += 1;
    const weekly = monthlyWorkHours(p.sati) / 4.33;
    sumWeekly += weekly;
    const denom = p.sati.redovni + p.sati.prekovremeni;
    sumNight += denom > 0 ? p.sati.nocni / denom : 0;
    if (p.sati.prekovremeni > otMax) otOverLimit += 1;
    const st = classifyWt(w, p.sati.prekovremeni, weekly);
    if (st === 'breached') breached += 1;
    else if (st === 'atRisk') atRisk += 1;
    else compliant += 1;
  }

  return {
    node,
    withData,
    compliant,
    atRisk,
    breached,
    compliancePct: withData > 0 ? Math.round((compliant / withData) * 100) : 100,
    avgWeeklyHours: withData > 0 ? +(sumWeekly / withData).toFixed(1) : 0,
    nightSharePct: withData > 0 ? Math.round((sumNight / withData) * 100) : 0,
    otOverLimit,
  };
}

export interface OtBucket {
  label: string;
  count: number;
  tone: 'ok' | 'warn' | 'alarm';
}

/** Raspodjela prekovremenih sati (zadnji mjesec) — za histogram s repom prekoračenja. */
export function overtimeDistribution(w: World, nodeId: string): OtBucket[] {
  const inScope = descendantsOf(w.orgNodes, nodeId);
  const ids = new Set(w.officers.filter((o) => inScope.has(o.orgNodeId)).map((o) => o.id));
  const buckets: OtBucket[] = [
    { label: '0–8 h', count: 0, tone: 'ok' },
    { label: '8–16 h', count: 0, tone: 'ok' },
    { label: '16–20 h', count: 0, tone: 'warn' },
    { label: '20+ h', count: 0, tone: 'alarm' },
  ];
  for (const p of w.performance) {
    if (p.yearMonth !== LAST_COMPLETE_MONTH || !ids.has(p.officerId)) continue;
    const ot = p.sati.prekovremeni;
    const i = ot <= 8 ? 0 : ot <= 16 ? 1 : ot <= 20 ? 2 : 3;
    buckets[i].count += 1;
  }
  return buckets;
}
