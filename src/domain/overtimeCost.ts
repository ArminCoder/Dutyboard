import type { World } from '../data/types';
import { descendantsOf } from '../data/generator/org';

/**
 * Zajednički obračun prekovremenog rada — dijele ga ministarski budžet (M03)
 * i komesarska kontrola prekovremenih (C03), da se brojevi nikad ne raziđu.
 *
 * Napomena: rate iz finance.ts je puni trošak poslodavca (bruto + doprinosi),
 * ne iznos na platnoj listi policajca.
 */

export function officerIdsUnder(w: World, nodeId: string): Set<string> {
  const inScope = descendantsOf(w.orgNodes, nodeId);
  return new Set(w.officers.filter((o) => inScope.has(o.orgNodeId)).map((o) => o.id));
}

/** Broj mjeseci tekuće godine koji imaju podatke (izbjegava dijeljenje s 12 na pola godine). */
export function monthsWithData(w: World, yearPrefix = '2026'): number {
  return new Set(w.performance.filter((p) => p.yearMonth.startsWith(yearPrefix)).map((p) => p.yearMonth)).size || 1;
}

/** Godišnji (anualizirani) sati prekovremenog za čvor. */
export function annualOvertimeHours(w: World, nodeId: string, yearPrefix = '2026'): number {
  const ids = officerIdsUnder(w, nodeId);
  const months = monthsWithData(w, yearPrefix);
  const h = w.performance
    .filter((p) => p.yearMonth.startsWith(yearPrefix) && ids.has(p.officerId))
    .reduce((s, p) => s + p.sati.prekovremeni, 0);
  return Math.round((h / months) * 12);
}

export function annualOvertimeKM(w: World, nodeId: string, yearPrefix = '2026'): number {
  return annualOvertimeHours(w, nodeId, yearPrefix) * w.finance.overtimeRateKM;
}

/** Puni godišnji trošak jednog policajca (plata + doprinosi) — za budžetske ekvivalente. */
export function loadedAnnualCostPerOfficer(w: World): number {
  return Math.round(w.finance.avgMonthlyBaseKM * 12 * 1.5);
}

export interface OvertimeFairness {
  /** Udio ukupnih prekovremenih sati koji nosi gornjih 10% policajaca. */
  topDecileSharePct: number;
  /** Prosjek sati po policajcu mjesečno. */
  avgPerOfficer: number;
  /** Broj policajaca iznad internog limita. */
  overLimit: number;
  withData: number;
}

/** Koncentracija prekovremenog rada — je li teret ravnomjerno raspoređen. */
export function overtimeFairness(w: World, nodeId: string, yearPrefix = '2026'): OvertimeFairness {
  const ids = officerIdsUnder(w, nodeId);
  const months = monthsWithData(w, yearPrefix);
  const perOfficer = new Map<string, number>();
  for (const p of w.performance) {
    if (!p.yearMonth.startsWith(yearPrefix) || !ids.has(p.officerId)) continue;
    perOfficer.set(p.officerId, (perOfficer.get(p.officerId) ?? 0) + p.sati.prekovremeni);
  }
  const values = [...perOfficer.values()].sort((a, b) => b - a);
  if (values.length === 0) return { topDecileSharePct: 0, avgPerOfficer: 0, overLimit: 0, withData: 0 };

  const total = values.reduce((s, v) => s + v, 0);
  const decile = Math.max(1, Math.round(values.length * 0.1));
  const topSum = values.slice(0, decile).reduce((s, v) => s + v, 0);
  const limit = w.targets.overtimeHoursPerOfficerMax;

  return {
    topDecileSharePct: total > 0 ? Math.round((topSum / total) * 100) : 0,
    avgPerOfficer: +(total / values.length / months).toFixed(1),
    overLimit: values.filter((v) => v / months > limit).length,
    withData: values.length,
  };
}
