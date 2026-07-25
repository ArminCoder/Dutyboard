import type { FinanceConfig } from '../types';

/** Deterministički, plauzibilni budžeti ljudstva po PU (KM). Novi Grad je veći → veći budžet.
 *  Koriste ga komesarska kontrola prekovremenih i ministarska tabla troška/simulacije. */
const BUDGET_BY_PU: Record<string, { personnel: number; overtime: number }> = {
  'pu-centar': { personnel: 8_400_000, overtime: 620_000 },
  'pu-novi-grad': { personnel: 9_900_000, overtime: 780_000 },
};

export function buildFinance(puIds: string[]): FinanceConfig {
  return {
    overtimeRateKM: 20,
    avgMonthlyBaseKM: 1650,
    unitBudgets: puIds.map((puId) => ({
      puId,
      annualPersonnelKM: BUDGET_BY_PU[puId]?.personnel ?? 7_500_000,
      annualOvertimeKM: BUDGET_BY_PU[puId]?.overtime ?? 500_000,
    })),
  };
}
