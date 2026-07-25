import type { KpiTargets, RestRules } from '../types';

/** Kantonalni ciljevi za semafor-indikatore (Compstat strelice, ministarski merači). */
export function buildTargets(): KpiTargets {
  return {
    coveragePct: 90,
    sickLeavePctMax: 5,
    certValidityPct: 98,
    overtimeHoursPerOfficerMax: 16,
  };
}

/** Pravila radnog vremena (EU direktiva o radnom vremenu) — usklađenost i zaštita odmora. */
export function buildRestRules(): RestRules {
  return {
    maxConsecutiveNights: 4,
    minRestHours: 12,
    maxWeeklyHours: 48,
  };
}
