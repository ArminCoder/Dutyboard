// Domain types — SPEC linije 335-343.
// Phase 1 uvodi org tree + osoblje + operativne uloge + certifikate + opremu.
// Shift/Roster/LeaveRequest/OvertimePosting/CourtSummons/PerformanceMonth/AuditEntry
// dodajemo u kasnijim fazama kad ih koristimo.

export type OrgNodeKind =
  | 'mup' // MUP DK root
  | 'uprava' // Uprava policije
  | 'pu' // Policijska uprava (npr. PU Centar)
  | 'ps' // Policijska stanica (npr. PS Centar)
  | 'smjena' // Smjenska grupa unutar PS
  | 'posebna'; // Posebna jedinica (specijalci) — sibling PU-a

export interface OrgNode {
  id: string;
  kind: OrgNodeKind;
  name: string;
  parentId: string | null;
  /** Ako je true, ova uloga/jedinica je ekskluzivna (specijalci ne rade druge poslove). */
  exclusiveRoles?: boolean;
  /** Sistematizovan broj izvršilaca za ovaj čvor (postavljen na PS/posebna; više čvorove zbraja `establishmentUnder`). */
  establishment?: number;
}

export type Rank =
  | 'policajac'
  | 'stariji_policajac'
  | 'narednik'
  | 'stariji_narednik'
  | 'mladji_inspektor'
  | 'inspektor'
  | 'stariji_inspektor'
  | 'glavni_inspektor';

export const RANK_LABEL: Record<Rank, string> = {
  policajac: 'policajac',
  stariji_policajac: 'stariji policajac',
  narednik: 'narednik',
  stariji_narednik: 'stariji narednik',
  mladji_inspektor: 'mlađi inspektor',
  inspektor: 'inspektor',
  stariji_inspektor: 'stariji inspektor',
  glavni_inspektor: 'glavni inspektor',
};

export type Season = 'sve' | 'ljeto' | 'zima';

export interface OperationalRole {
  id: string;
  name: string;
  /** Katalog vlasnika (PU ili posebna jedinica). */
  orgNodeId: string;
  /** Ako sezonski, prozor "od-do" u obliku dd.mm. */
  seasonWindow?: { fromMonth: number; toMonth: number };
  requiredCertIds: string[];
  requiredEquipmentType?: 'auto' | 'motocikl' | 'bicikl';
  /** Ako true, oficir sa ovom ulogom ne može biti dodijeljen drugoj u istoj smjeni. */
  exclusive: boolean;
  /** Uloge s kojima se ova može kombinovati u istom slot-u (npr. pješačka + interventna). */
  combinableWith: string[];
  /** Minimum ljudi po smjeni na razini PS (alarm ako nije popunjeno). */
  minPerShift?: number;
}

export interface Certification {
  id: string;
  name: string;
}

export interface OfficerCertificate {
  certId: string;
  /** ISO datum "YYYY-MM-DD". */
  expires: string;
}

export type EquipmentType = 'vozilo' | 'motocikl' | 'bicikl' | 'radio' | 'oruzje' | 'znacka' | 'uniforma' | 'radar' | 'racunar';

export interface EquipmentAssignment {
  equipmentId: string;
  type: EquipmentType;
  /** Serijski broj / registracija / oznaka. */
  identifier: string;
}

export type OfficerStatus = 'aktivan' | 'godisnji' | 'bolovanje' | 'slobodan_dan';

export interface Officer {
  id: string;
  name: string;
  rank: Rank;
  /** Najdublji čvor kojem osoba pripada (obično PS/smjena). */
  orgNodeId: string;
  operationalRoleIds: string[];
  certifications: OfficerCertificate[];
  clearanceLevel: 'interno' | 'povjerljivo' | 'tajno';
  equipmentAssigned: EquipmentAssignment[];
  status: OfficerStatus;
  /** "YYYY-MM-DD" — datum zaposlenja (staž, projekcija penzionisanja). */
  hireDate: string;
  /** "YYYY-MM-DD" — datum rođenja (dobna piramida, penzionisanje). */
  birthDate: string;
}

export type AccessRole =
  | 'policajac'
  | 'sefSmjene'
  | 'dezurni'
  | 'nacelnik'
  | 'komesar'
  | 'ministar'
  | 'admin';

export const ACCESS_ROLE_LABEL: Record<AccessRole, string> = {
  policajac: 'Policajac',
  sefSmjene: 'Šef smjene',
  dezurni: 'Dežurni operativac',
  nacelnik: 'Načelnik PU',
  komesar: 'Policijski komesar',
  ministar: 'Ministar',
  admin: 'Administrator',
};

// --- Phase 2 additions ---

export type ShiftKind = 'I' | 'II'; // I: 07-19, II: 19-07

export interface Shift {
  id: string;
  /** "YYYY-MM-DD" — datum početka smjene. */
  date: string;
  kind: ShiftKind;
  psId: string;
  /** Slot-ovi u smjeni. Za Phase 2 seed generiramo pojednostavljeno. */
  slots: ShiftSlot[];
}

export interface ShiftSlot {
  id: string;
  requiredRoleId: string;
  capacity: number;
  assignedOfficerIds: string[];
  vehiclePlate?: string;
  callSign?: string; // "Auto-patrola 2-1" i sl.
}

export type LeaveRequestKind = 'slobodan_dan' | 'godisnji' | 'premjestaj' | 'ostalo';

export type ApprovalStepStatus = 'ceka' | 'odobreno' | 'odbijeno';

export interface ApprovalStep {
  role: 'sefSmjene' | 'komandir' | 'nacelnik';
  approverName: string;
  status: ApprovalStepStatus;
  /** ISO datetime kad je korak razriješen. */
  resolvedAt?: string;
  note?: string;
}

export type LeaveRequestStatus = 'u_toku' | 'odobren' | 'odbijen';

export interface LeaveRequest {
  id: string;
  officerId: string;
  kind: LeaveRequestKind;
  /** ISO datetime kad je podnesen. */
  submittedAt: string;
  /** "YYYY-MM-DD" — traženi datum početka (za slobodan dan/godišnji). */
  fromDate?: string;
  toDate?: string;
  reason?: string;
  status: LeaveRequestStatus;
  approvalChain: ApprovalStep[];
}

export type NotificationKind =
  | 'raspored'
  | 'zahtjev'
  | 'sudski_poziv'
  | 'prekovremeni_ponuda'
  | 'certifikat_upozorenje'
  | 'info';

export type NotificationSeverity = 'info' | 'action' | 'warn';

export interface Notification {
  id: string;
  officerId: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  body: string;
  /** ISO datetime. */
  createdAt: string;
  read: boolean;
  /** Poziv na akciju — npr. za sudski poziv "Potvrdi prisustvo". */
  action?: {
    label: string;
    kind: 'court_confirm' | 'court_log_hours' | 'accept_overtime' | 'open_request';
    payload?: Record<string, string | number>;
  };
}

export type CourtSummonsStatus = 'nepotvrdjen' | 'potvrdjen' | 'evidentirano';

export interface CourtSummons {
  id: string;
  officerId: string;
  court: string;
  caseNumber: string; // "K-441/26"
  /** "YYYY-MM-DDTHH:mm" lokalno. */
  scheduledAt: string;
  status: CourtSummonsStatus;
  hoursCredited?: number;
}

export interface PerformanceMonth {
  officerId: string;
  /** "YYYY-MM". */
  yearMonth: string;
  hapsenja: number;
  prekrsajni: number;
  intervencije: number;
  asistencije: number;
  sati: {
    redovni: number;
    nocni: number;
    prekovremeni: number;
    sud: number;
  };
}

export interface PayslipLine {
  label: string;
  amount: number;
}

export interface Payslip {
  officerId: string;
  yearMonth: string;
  lines: PayslipLine[];
  net: number;
}

export type VehicleKind = 'auto' | 'motocikl' | 'bicikl';

export type VehicleStatus = 'ispravno' | 'servis' | 'ostecen';

export interface Vehicle {
  id: string;
  kind: VehicleKind;
  plate: string; // "A-311-K-121"
  model: string;
  psId: string; // gdje je vozilo stacionirano
  status: VehicleStatus;
  /** "YYYY-MM-DD". */
  serviceDue?: string;
  registrationDue?: string;
}

// --- Strateški podaci (finansije, ciljevi, pravila) — Phase 1 seed enrichment ---

export interface UnitBudget {
  puId: string;
  /** Godišnji budžet za plate (KM). */
  annualPersonnelKM: number;
  /** Godišnji budžet za prekovremeni rad (KM). */
  annualOvertimeKM: number;
}

export interface FinanceConfig {
  /** KM po satu prekovremenog rada. */
  overtimeRateKM: number;
  /** Prosječna mjesečna osnovna plata (modeliranje troška ljudstva). */
  avgMonthlyBaseKM: number;
  unitBudgets: UnitBudget[];
}

/** Ciljne vrijednosti za semafor-indikatore (Compstat, ministarske table). */
export interface KpiTargets {
  /** Ciljna popunjenost smjena (%). */
  coveragePct: number;
  /** Maksimalna prihvatljiva stopa bolovanja (%). */
  sickLeavePctMax: number;
  /** Ciljna važnost certifikata (%). */
  certValidityPct: number;
  /** Maksimum prekovremenih sati po policajcu mjesečno. */
  overtimeHoursPerOfficerMax: number;
}

/** Pravila radnog vremena (EU direktiva) — usklađenost i zaštita odmora. */
export interface RestRules {
  /** Maksimum uzastopnih noćnih smjena. */
  maxConsecutiveNights: number;
  /** Minimum sati odmora između smjena. */
  minRestHours: number;
  /** Maksimum radnih sati sedmično. */
  maxWeeklyHours: number;
}

// --- World envelope ---

export interface World {
  orgNodes: OrgNode[];
  officers: Officer[];
  operationalRoles: OperationalRole[];
  certifications: Certification[];
  shifts: Shift[];
  courtSummonses: CourtSummons[];
  performance: PerformanceMonth[];
  payslips: Payslip[];
  vehicles: Vehicle[];
  finance: FinanceConfig;
  targets: KpiTargets;
  restRules: RestRules;
}
