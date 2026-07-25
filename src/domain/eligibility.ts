import type { Officer, OperationalRole, Shift, Vehicle, World } from '../data/types';
import { addDays } from '../data/generator/dates';

/**
 * Non-negotiable behavior #2 (SPEC linija 347): eligibility vraća razloge na bosanskom.
 *
 * Razlozi su tačno kako SPEC K01 (linija 126) navodi:
 *  - "Godišnji"
 *  - "Certifikat istekao MM/YY"
 *  - "Obavezni odmor — radio prošlu noć"
 *  - "Van sezone za ovu ulogu"
 *  - "Nema slobodnog motocikla" (analogno za druge kategorije opreme)
 *
 * Dodano (izvedeno iz istih principa, i dalje na bosanskom):
 *  - "Bolovanje" — logičan pandan godišnjem
 *  - "Već raspoređen u ovoj smjeni" — spriječi duplo popunjavanje
 *  - "Nema kvalifikacije za ovu ulogu" — oficir nema operativnu ulogu u katalogu
 */

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

const MONTHS_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec',
];

interface Ctx {
  officer: Officer;
  slot: Shift['slots'][number];
  shift: Shift;
  world: Pick<World, 'shifts' | 'operationalRoles' | 'vehicles'>;
}

export function checkEligibility(ctx: Ctx): EligibilityResult {
  return (
    ruleAlreadyAssignedThisShift(ctx) ??
    ruleHasStatus(ctx) ??
    ruleHasRole(ctx) ??
    ruleSeasonWindow(ctx) ??
    ruleCertificationExpiry(ctx) ??
    ruleMandatoryRest(ctx) ??
    ruleEquipmentAvailable(ctx) ??
    { eligible: true }
  );
}

function ruleAlreadyAssignedThisShift(ctx: Ctx): EligibilityResult | null {
  for (const s of ctx.shift.slots) {
    if (s.id !== ctx.slot.id && s.assignedOfficerIds.includes(ctx.officer.id)) {
      return { eligible: false, reason: 'Već raspoređen u ovoj smjeni' };
    }
  }
  return null;
}

function ruleHasStatus(ctx: Ctx): EligibilityResult | null {
  const st = ctx.officer.status;
  if (st === 'godisnji') return { eligible: false, reason: 'Godišnji' };
  if (st === 'bolovanje') return { eligible: false, reason: 'Bolovanje' };
  return null;
}

function ruleHasRole(ctx: Ctx): EligibilityResult | null {
  if (!ctx.officer.operationalRoleIds.includes(ctx.slot.requiredRoleId)) {
    return { eligible: false, reason: 'Nema kvalifikacije za ovu ulogu' };
  }
  return null;
}

function ruleSeasonWindow(ctx: Ctx): EligibilityResult | null {
  const role = ctx.world.operationalRoles.find((r) => r.id === ctx.slot.requiredRoleId);
  if (!role?.seasonWindow) return null;
  const month = Number(ctx.shift.date.slice(5, 7));
  const { fromMonth, toMonth } = role.seasonWindow;
  const inSeason = fromMonth <= toMonth ? month >= fromMonth && month <= toMonth : month >= fromMonth || month <= toMonth;
  if (!inSeason) return { eligible: false, reason: 'Van sezone za ovu ulogu' };
  return null;
}

function ruleCertificationExpiry(ctx: Ctx): EligibilityResult | null {
  const role = ctx.world.operationalRoles.find((r) => r.id === ctx.slot.requiredRoleId);
  if (!role) return null;
  for (const certId of role.requiredCertIds) {
    const cert = ctx.officer.certifications.find((c) => c.certId === certId);
    if (!cert) return { eligible: false, reason: 'Nema traženi certifikat' };
    if (cert.expires < ctx.shift.date) {
      return {
        eligible: false,
        reason: `Certifikat istekao ${formatMY(cert.expires)}`,
      };
    }
  }
  return null;
}

function ruleMandatoryRest(ctx: Ctx): EligibilityResult | null {
  // Obavezni odmor: ako je oficir radio prethodnu noćnu (II) smjenu, ne može u sljedeću I smjenu istog dana.
  if (ctx.shift.kind !== 'I') return null;
  const prevDate = addDays(ctx.shift.date, -1);
  const prevNight = ctx.world.shifts.find(
    (s) => s.psId === ctx.shift.psId && s.date === prevDate && s.kind === 'II',
  );
  if (!prevNight) return null;
  const workedPrevNight = prevNight.slots.some((s) => s.assignedOfficerIds.includes(ctx.officer.id));
  if (workedPrevNight) return { eligible: false, reason: 'Obavezni odmor — radio prošlu noć' };
  return null;
}

function ruleEquipmentAvailable(ctx: Ctx): EligibilityResult | null {
  const role = ctx.world.operationalRoles.find((r) => r.id === ctx.slot.requiredRoleId);
  if (!role?.requiredEquipmentType) return null;

  const need = role.requiredEquipmentType;
  const inShiftUsage = countEquipmentInUse(need, ctx);
  const pool = ctx.world.vehicles.filter((v) => v.psId === ctx.shift.psId && v.kind === need && v.status === 'ispravno');
  if (pool.length - inShiftUsage <= 0) {
    return { eligible: false, reason: humanizeEquipment(need, 'nemaSlobodnog') };
  }
  return null;
}

function countEquipmentInUse(kind: Vehicle['kind'], ctx: Ctx): number {
  let count = 0;
  for (const s of ctx.shift.slots) {
    if (s.id === ctx.slot.id) continue;
    const r = ctx.world.operationalRoles.find((role) => role.id === s.requiredRoleId);
    if (r?.requiredEquipmentType === kind && s.assignedOfficerIds.length > 0) count++;
  }
  return count;
}

function humanizeEquipment(kind: Vehicle['kind'], variant: 'nemaSlobodnog'): string {
  if (variant === 'nemaSlobodnog') {
    switch (kind) {
      case 'motocikl': return 'Nema slobodnog motocikla';
      case 'bicikl': return 'Nema slobodnog bicikla';
      case 'auto': return 'Nema slobodnog vozila';
    }
  }
  return 'Nema slobodnog vozila';
}

function formatMY(dateISO: string): string {
  const parts = dateISO.split('-');
  const y = parts[0].slice(-2);
  const m = Number(parts[1]);
  return `${MONTHS_SHORT[m - 1]}/${y}`;
}

/** Vraća listu razloga koji nedostaju za minimum popune slot-a — koristi K01 za crvenu boju. */
export function slotUnderfilled(slot: Shift['slots'][number]): boolean {
  return slot.assignedOfficerIds.length < slot.capacity;
}

/** Sezonsko upozorenje pri objavljivanju / dodavanju uloge van sezone (SPEC K01 linija 128). */
export function seasonWarningForRole(role: OperationalRole, date: string): string | null {
  if (!role.seasonWindow) return null;
  const month = Number(date.slice(5, 7));
  const { fromMonth, toMonth } = role.seasonWindow;
  const inSeason = fromMonth <= toMonth ? month >= fromMonth && month <= toMonth : month >= fromMonth || month <= toMonth;
  if (inSeason) return null;
  const from = MONTHS_SHORT[fromMonth - 1];
  const to = MONTHS_SHORT[toMonth - 1];
  return `${role.name} aktivna ${from}–${to}. Nastaviti?`;
}
