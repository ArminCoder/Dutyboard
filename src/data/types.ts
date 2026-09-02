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
  /** Neke obuke se polažu jednom i vrijede trajno (npr. osnovna policijska obuka). */
  permanent?: boolean;
}

export interface OfficerCertificate {
  certId: string;
  /** ISO datum "YYYY-MM-DD". Izostaje kod trajnih certifikata. */
  expires?: string;
}

export type EquipmentType =
  | 'vozilo' | 'motocikl' | 'bicikl'
  | 'radio' | 'oruzje' | 'znacka' | 'uniforma' | 'prsluk' | 'palica'
  | 'radar' | 'racunar';

export const EQUIPMENT_LABEL: Record<EquipmentType, string> = {
  vozilo: 'Vozilo', motocikl: 'Motocikl', bicikl: 'Bicikl',
  radio: 'Radio-stanica', oruzje: 'Službeno oružje', znacka: 'Značka',
  uniforma: 'Uniforma', prsluk: 'Balistički prsluk', palica: 'Službena palica',
  radar: 'Radar', racunar: 'Računar',
};

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
  | 'komandir'
  | 'dezurni'
  | 'nacelnik'
  | 'komesar'
  | 'ministar'
  | 'administracija'
  | 'admin';

export const ACCESS_ROLE_LABEL: Record<AccessRole, string> = {
  policajac: 'Policajac',
  sefSmjene: 'Šef smjene',
  komandir: 'Komandir PS',
  dezurni: 'Dežurni operativac',
  nacelnik: 'Načelnik PU',
  komesar: 'Policijski komesar',
  ministar: 'Ministar',
  administracija: 'Administrativna služba',
  admin: 'Administrator',
};

// --- Phase 2 additions ---

export type ShiftKind = 'I' | 'II'; // I: 07-19, II: 19-07

/** Noćni rad se po propisu računa 22:00–06:00 — dakle 8 h unutar noćne smjene, ne cijelih 12 h. */
export const NIGHT_HOURS_PER_SHIFT = 8;

/** Jedinstveni izvor za trajanje i oznaku smjene (izbjegava duplirane stringove po ekranima). */
export const SHIFT_TIME: Record<ShiftKind, { label: string; hours: number; night: boolean; nightHours: number }> = {
  I: { label: '07:00 – 19:00', hours: 12, night: false, nightHours: 0 },
  II: { label: '19:00 – 07:00', hours: 12, night: true, nightHours: NIGHT_HOURS_PER_SHIFT },
};

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

// Premještaj je izbačen — rijedak je i vodi se kroz e-Pisarnicu (X01), ne kroz ovaj tok.
export type LeaveRequestKind = 'slobodan_dan' | 'godisnji' | 'bolovanje' | 'ostalo';

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
  /** Prekovremeni se NALAŽE (ne nudi) — policajac se obavještava o rasporedu. */
  | 'prekovremeni_nalog'
  /** Obuka i gađanje su zakazani za sve u terminu — obavještenje, ne rezervacija. */
  | 'obuka'
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
    kind: 'court_confirm' | 'court_log_hours' | 'open_request';
    payload?: Record<string, string | number>;
  };
}

// --- Administracija: zahtjevi građana za dokumente ---
// Građanin (portal) podnosi zahtjev; administrativna služba ga obrađuje i objavljuje
// status + lokaciju preuzimanja. Neki dokumenti nose naknadu (prihod za MUP).

export type DocumentKind =
  | 'uvjerenje_prebivaliste'
  | 'uvjerenje_nekaznjavanje'
  | 'pristup_informacijama'
  | 'vozacka'
  | 'licna';

/** Linearni tok statusa (uz 'odbijen' kao sporedni izlaz). */
export type DocumentRequestStatus =
  | 'podnesen'
  | 'u_obradi'
  | 'spreman'
  | 'preuzet'
  | 'odbijen';

export const DOC_REQUEST_STATUS_LABEL: Record<DocumentRequestStatus, string> = {
  podnesen: 'Podnesen',
  u_obradi: 'U obradi',
  spreman: 'Spreman za preuzimanje',
  preuzet: 'Preuzet',
  odbijen: 'Odbijen',
};

export interface DocumentRequest {
  id: string;
  /** JMB podnosioca — veže zahtjev za građanski nalog. */
  citizenId: string;
  citizenName: string;
  kind: DocumentKind;
  /** Stanica/šalter koji obrađuje i gdje se preuzima (scope za administraciju). */
  psId: string;
  pickupLocation: string;
  status: DocumentRequestStatus;
  feeKM: number;
  paid: boolean;
  /** Napomena/svrha koju upisuje građanin. */
  note?: string;
  createdAt: string;
  submittedAt: string;
  updatedAt?: string;
}

// --- Knjiga dnevnih događaja (KDD) ---
// Glavna evidencija šefa smjene: svaki poziv i događaj se upisuje hronološki.
// Komandir PS i načelnik PU čitaju/pretražuju svoju jedinicu; komesar sve.

export type KddEntryType = 'poziv_122' | 'intervencija' | 'dogadjaj' | 'ostalo';
export type KddEntryStatus = 'otvoren' | 'u_toku' | 'zakljucen';

export const KDD_TYPE_LABEL: Record<KddEntryType, string> = {
  poziv_122: 'Poziv 122',
  intervencija: 'Intervencija',
  dogadjaj: 'Događaj',
  ostalo: 'Ostalo',
};

export const KDD_STATUS_LABEL: Record<KddEntryStatus, string> = {
  otvoren: 'Otvoren',
  u_toku: 'U toku',
  zakljucen: 'Zaključen',
};

export interface KddEntry {
  id: string;
  /** Stanica kojoj upis pripada — osnova za scoping (komandir/načelnik/komesar). */
  psId: string;
  /** "YYYY-MM-DDTHH:mm" — sidreno na demo vrijeme (demoNow). */
  when: string;
  type: KddEntryType;
  /** Opis događaja. Službena evidencija — lični podaci se unose kad su potrebni. */
  description: string;
  /** Pozivni znak patrole kojoj je događaj dodijeljen. */
  assignedPatrol?: string;
  outcome?: string;
  status: KddEntryStatus;
  /** Ko je upisao (šef smjene, OKC, sistem). */
  recordedBy: string;
  /** Trag izmjena — dopunjava se, nikad se ne briše. */
  revisions?: KddRevision[];
}

/** Svaka izmjena upisa ostavlja trag: ko, kada, šta je promijenjeno. */
export interface KddRevision {
  at: string;
  by: string;
  field: 'description' | 'outcome' | 'status' | 'assignedPatrol';
  from: string;
  to: string;
}

/** Upis se može mijenjati 24 h; poslije toga samo komandir stanice. */
export const KDD_EDIT_WINDOW_HOURS = 24;

/** Bilten — sažetak smjene koji šef smjene na kraju šalje OKC-u.
 *  OKC iz svih biltena pravi jutarnji brifing za komesara. */
export interface Bilten {
  id: string;
  psId: string;
  /** Datum smjene i koja smjena (I/II). */
  shiftDate: string;
  shiftKind: ShiftKind;
  counts: {
    dogadjaji: number;
    intervencije: number;
    prekrsajniNalozi: number;
  };
  note?: string;
  submittedBy: string;
  submittedAt: string;
}

// --- Izvještaji i službene zabilješke ---
// Pisanje dokumenata je stvarno opterećenje: policajci ostaju poslije smjene da
// pišu, pa traže gdje da odštampaju. Ovdje se piše kratak opis, sistem sastavi
// dokument po obrascu, a štampa se naručuje u stanici.

export type ReportKind = 'sluzbena_zabiljeska' | 'izvjestaj' | 'prekrsajna_prijava';
export type ReportStatus = 'nacrt' | 'predan' | 'za_stampu' | 'odstampan';

export const REPORT_KIND_LABEL: Record<ReportKind, string> = {
  sluzbena_zabiljeska: 'Službena zabilješka',
  izvjestaj: 'Izvještaj',
  prekrsajna_prijava: 'Prekršajna prijava',
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  nacrt: 'Nacrt',
  predan: 'Predan',
  za_stampu: 'Za štampu',
  odstampan: 'Odštampan',
};

export interface PoliceReport {
  id: string;
  officerId: string;
  psId: string;
  kind: ReportKind;
  /** Kratak opis koji policajac unese — osnova za sastavljanje dokumenta. */
  summary: string;
  /** Sastavljen tekst dokumenta (obrazac + opis). Policajac ga može doraditi. */
  body: string;
  status: ReportStatus;
  createdAt: string;
  submittedAt?: string;
  /** Vezani upis iz knjige događaja, ako je dokument nastao iz događaja. */
  kddEntryId?: string;
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

// Helikopter i specijalna vozila su kantonalni resursi (Uprava / posebna jedinica),
// ne pripadaju pojedinoj stanici.
export type VehicleKind = 'auto' | 'motocikl' | 'bicikl' | 'helikopter' | 'specijalno';

export const VEHICLE_KIND_LABEL: Record<VehicleKind, string> = {
  auto: 'Automobili',
  motocikl: 'Motocikli',
  bicikl: 'Bicikli',
  helikopter: 'Helikopter',
  specijalno: 'Specijalna vozila',
};

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
