import type { FinanceConfig } from '../types';

/** Deterministički, plauzibilni budžeti ljudstva po PU (KM). Novi Grad je veći → veći budžet.
 *  Koriste ga komesarska kontrola prekovremenih i ministarska tabla troška/simulacije. */
// Skala je usklađena s demo brojem izvršilaca (~50 po PU). Budžet prekovremenih je
// namjerno tijesan: PU Novi Grad je blago iznad svog OT budžeta (crveni signal).
const BUDGET_BY_PU: Record<string, { personnel: number; overtime: number }> = {
  'pu-centar': { personnel: 1_450_000, overtime: 120_000 },
  'pu-novi-grad': { personnel: 1_400_000, overtime: 100_000 },
};

export function buildFinance(puIds: string[]): FinanceConfig {
  return {
    overtimeRateKM: 20,
    avgMonthlyBaseKM: 1650,
    unitBudgets: puIds.map((puId) => ({
      puId,
      annualPersonnelKM: BUDGET_BY_PU[puId]?.personnel ?? 1_400_000,
      annualOvertimeKM: BUDGET_BY_PU[puId]?.overtime ?? 110_000,
    })),
  };
}
