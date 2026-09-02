// Provider + useStore hook co-located (standard React context pattern); the
// fast-refresh rule is a false positive since the hook depends on this context.
/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ApprovalStep, Bilten, CourtSummons, KddEntry, KddRevision, LeaveRequest, Notification, PoliceReport, ReportStatus } from '../data/types';
import { world } from '../data/world';
import { DEMO_TODAY, addDays, demoNow } from '../data/generator/dates';

// --- Phase 4 additions: overtime postings + active shift crisis + shift log ---

export interface OvertimePosting {
  id: string;
  psId: string;
  requiredRoleId: string;
  when: string; // "YYYY-MM-DDTHH:mm"
  duration: string; // "8 h", "12 h"
  neededCount: number;
  offerLog: Array<{ officerId: string; officerName: string; offeredAt: string; accepted?: boolean }>;
  createdAt: string;
}

export interface ActivePatrolCard {
  id: string;
  callSign: string;
  vehiclePlate?: string;
  officers: string[]; // officer IDs
  status: 'na_terenu' | 'pauza' | 'intervencija' | 'nepotpuna';
  location?: string;
  incompleteReason?: string;
  /** "YYYY-MM-DDTHH:mm" — do kada traje pauza (odbrojavanje u K02). */
  pauzaDo?: string;
}

export interface ShiftLogEntry {
  id: string;
  when: string;
  who: string;
  event: string;
}

/** Jedan pokušaj testa u MUP Akademiji (rezultat provjere znanja). */
export interface AcademyAttempt {
  id: string;
  officerId: string;
  oblastId: string;
  correct: number;
  total: number;
  takenAt: string;
}

// Sve mutabilne stvari (obavještenja, zahtjevi, sudski poziv statusi) žive ovdje.
// Reset na reload je namjeran i prihvatljiv za demo.

interface Store {
  notifications: Notification[];
  leaveRequests: LeaveRequest[];
  courtSummonses: CourtSummons[];
  overtimePostings: OvertimePosting[];
  activePatrols: ActivePatrolCard[];
  shiftLog: ShiftLogEntry[];

  markNotificationRead: (id: string) => void;
  confirmCourtSummons: (id: string) => void;
  logCourtHours: (id: string, hours: number) => void;
  submitLeaveRequest: (draft: DraftLeaveRequest) => LeaveRequest;
  advanceApproval: (id: string, decision: 'odobreno' | 'odbijeno', note?: string) => void;

  createOvertimePosting: (input: Omit<OvertimePosting, 'id' | 'offerLog' | 'createdAt'>) => OvertimePosting;
  offerOvertime: (postingId: string, officerId: string, officerName: string) => void;
  acceptOvertime: (postingId: string, officerId: string) => void;

  markOfficerSick: (patrolId: string, officerId: string, reason: string) => void;
  reassignOfficer: (patrolId: string, newOfficerId: string) => void;
  setPatrolStatus: (patrolId: string, status: ActivePatrolCard['status'], minutes?: number) => void;

  kddEntries: KddEntry[];
  addKddEntry: (input: KddDraft) => KddEntry;
  updateKddEntry: (
    id: string,
    patch: Partial<Pick<KddEntry, 'description' | 'outcome' | 'status' | 'assignedPatrol'>>,
    actor: string,
  ) => void;

  biltens: Bilten[];
  submitBilten: (input: Omit<Bilten, 'id' | 'submittedAt'>) => Bilten;

  reports: PoliceReport[];
  saveReport: (input: ReportDraft) => PoliceReport;
  setReportStatus: (id: string, status: ReportStatus) => void;

  academyAttempts: AcademyAttempt[];
  recordAcademyAttempt: (input: Omit<AcademyAttempt, 'id' | 'takenAt'>) => AcademyAttempt;
}

/** Novi ili izmijenjen dokument; bez `id` je novi. */
export type ReportDraft = Omit<PoliceReport, 'id' | 'createdAt' | 'status'> & {
  id?: string;
  status?: ReportStatus;
};

/** Novi upis u knjigu — vrijeme se popunjava demo satom ako nije zadano. */
export type KddDraft = Omit<KddEntry, 'id' | 'when'> & { when?: string };

export interface DraftLeaveRequest {
  officerId: string;
  officerName: string;
  kind: LeaveRequest['kind'];
  fromDate?: string;
  toDate?: string;
  reason?: string;
}

const StoreCtx = createContext<Store | null>(null);

const KOMANDIR_NAME = 'Adnan Softić';
const NACELNIK_NAME = 'Samir Begić';

/** Lanac odobravanja po vrsti zahtjeva.
 *  Slobodan dan i bolovanje rješava komandir stanice; godišnji ide i na načelnika PU. */
function chainFor(kind: LeaveRequest['kind']): ApprovalStep[] {
  const komandir: ApprovalStep = { role: 'komandir', approverName: KOMANDIR_NAME, status: 'ceka' };
  if (kind === 'godisnji' || kind === 'ostalo') {
    return [komandir, { role: 'nacelnik', approverName: NACELNIK_NAME, status: 'ceka' }];
  }
  return [komandir];
}

function seedNotifications(): Notification[] {
  const nowIso = `${DEMO_TODAY}T08:15`;
  const yestIso = `${addDays(DEMO_TODAY, -1)}T18:40`;
  const twoDaysAgoIso = `${addDays(DEMO_TODAY, -2)}T09:00`;

  return [
    {
      id: 'notif-court-0001',
      officerId: 'off-0001',
      kind: 'sudski_poziv',
      severity: 'action',
      title: 'Sudski poziv — Općinski sud',
      body: `Predmet K-441/26, ${formatDayHour(`${DEMO_TODAY}T09:00`)}.`,
      createdAt: nowIso,
      read: false,
      action: { label: 'Potvrdi prisustvo', kind: 'court_confirm', payload: { summonsId: 'court-0001' } },
    },
    {
      id: 'notif-raspored-1',
      officerId: 'off-0001',
      kind: 'raspored',
      severity: 'info',
      title: 'Objavljen raspored za septembar',
      body: 'PS Centar · 4 smjenske grupe · pregledaj u P01.',
      createdAt: yestIso,
      read: false,
    },
    {
      id: 'notif-overtime-1',
      officerId: 'off-0001',
      // Prekovremeni rad se nalaže rješenjem — policajac se obavještava, ne bira.
      kind: 'prekovremeni_nalog',
      severity: 'warn',
      title: 'Nalog za prekovremeni rad — subota, 06.09.',
      body: 'Interventna, 19:00–07:00. Nalog izdao komandir PS Centar. Sati se evidentiraju u obračun.',
      createdAt: yestIso,
      read: false,
    },
    {
      id: 'notif-cert-1',
      officerId: 'off-0001',
      kind: 'certifikat_upozorenje',
      severity: 'warn',
      title: 'Godišnje gađanje ističe za 21 dan',
      body: 'Termin gađanja je zakazan — vidi obavještenje o godišnjem gađanju.',
      createdAt: twoDaysAgoIso,
      read: true,
    },
    {
      id: 'notif-gadjanje-1',
      officerId: 'off-0001',
      kind: 'obuka',
      severity: 'info',
      title: 'Godišnje gađanje — Suhodol, 15.09.2026. u 09:00',
      body: 'Strelište Suhodol. Obavezno za sve pripadnike II smjene. Ponijeti službeno oružje i značku.',
      createdAt: yestIso,
      read: false,
    },
    {
      id: 'notif-obuka-1',
      officerId: 'off-0001',
      kind: 'obuka',
      severity: 'info',
      title: 'Permanentna obuka — 21.09. do 25.09.2026.',
      body: 'Policijska akademija, svaki dan 08:00–15:00. Raspored smjena je usklađen za period obuke.',
      createdAt: twoDaysAgoIso,
      read: true,
    },
    {
      id: 'notif-info-1',
      officerId: 'off-0001',
      kind: 'info',
      severity: 'info',
      title: 'Nova instrukcija — postupanje u kontroli saobraćaja',
      body: 'Objavljeno u dijelu Instrukcije. Rok za upoznavanje: 30 dana.',
      createdAt: twoDaysAgoIso,
      read: true,
    },
  ];
}

function seedLeaveRequests(): LeaveRequest[] {
  return [
    {
      id: 'lr-0001',
      officerId: 'off-0001',
      kind: 'slobodan_dan',
      submittedAt: `${addDays(DEMO_TODAY, -3)}T11:20`,
      fromDate: addDays(DEMO_TODAY, 6),
      toDate: addDays(DEMO_TODAY, 6),
      reason: 'Privatne obaveze',
      status: 'odobren',
      approvalChain: [
        {
          role: 'komandir',
          approverName: KOMANDIR_NAME,
          status: 'odobreno',
          resolvedAt: `${addDays(DEMO_TODAY, -3)}T14:05`,
        },
      ],
    },
    {
      id: 'lr-0002',
      officerId: 'off-0001',
      kind: 'godisnji',
      submittedAt: `${addDays(DEMO_TODAY, -1)}T09:50`,
      fromDate: addDays(DEMO_TODAY, 20),
      toDate: addDays(DEMO_TODAY, 27),
      reason: 'Ljetni odmor',
      status: 'u_toku',
      approvalChain: [
        { role: 'komandir', approverName: KOMANDIR_NAME, status: 'ceka' },
        { role: 'nacelnik', approverName: NACELNIK_NAME, status: 'ceka' },
      ],
    },
    {
      // Odobreno bolovanje usred avgusta — vidljivo u mjesečnom kalendaru (P01).
      id: 'lr-0003',
      officerId: 'off-0001',
      kind: 'bolovanje',
      submittedAt: `${addDays(DEMO_TODAY, -13)}T07:40`,
      fromDate: addDays(DEMO_TODAY, -12),
      toDate: addDays(DEMO_TODAY, -11),
      reason: 'Prehlada — ljekarsko uvjerenje dostavljeno',
      status: 'odobren',
      approvalChain: [
        {
          role: 'komandir',
          approverName: KOMANDIR_NAME,
          status: 'odobreno',
          resolvedAt: `${addDays(DEMO_TODAY, -12)}T08:10`,
        },
      ],
    },
  ];
}

function seedOvertimePostings(): OvertimePosting[] {
  return [
    {
      id: 'ot-0001',
      psId: 'ps-centar',
      requiredRoleId: 'pu-centar:interventna',
      when: `${addDays(DEMO_TODAY, 13)}T19:00`,
      duration: '12 h',
      neededCount: 2,
      offerLog: [
        { officerId: 'off-0001', officerName: 'Amar Softić', offeredAt: `${addDays(DEMO_TODAY, -1)}T18:40` },
      ],
      createdAt: `${addDays(DEMO_TODAY, -1)}T18:40`,
    },
  ];
}

function seedActivePatrols(): ActivePatrolCard[] {
  // Izvedeno iz stvarnog rasporeda (tekuća noćna smjena PS Centar) — jedan izvor
  // istine: raspored, kartice aktivne smjene i mapa prikazuju iste patrole.
  const shift = world.shifts.find(
    (s) => s.psId === 'ps-centar' && s.date === DEMO_TODAY && s.kind === 'II',
  );
  if (!shift) return [];

  const LOCATIONS = ['Ferhadija', 'Titova', 'Marijin dvor', 'Baščaršija', 'Skenderija', 'Koševo', 'Mejtaš', 'Bistrik'];

  return shift.slots
    .filter((sl) => sl.assignedOfficerIds.length > 0)
    .map((sl, i) => ({
      id: `patrol-${sl.id}`,
      callSign: sl.callSign ?? 'Patrola',
      vehiclePlate: sl.vehiclePlate,
      officers: sl.assignedOfficerIds,
      // Straža je na fiksnom mjestu; ostale patrole su na terenu.
      status: sl.callSign === 'Straža PS' ? ('na_terenu' as const) : i === 1 ? ('pauza' as const) : i === 3 ? ('intervencija' as const) : ('na_terenu' as const),
      location: sl.callSign === 'Straža PS' ? 'ispred stanice' : LOCATIONS[i % LOCATIONS.length],
    }));
}

/** Knjiga dnevnih događaja — upisi za sve stanice (scoping se radi u useScopedKdd). */
function seedKdd(): KddEntry[] {
  const d = DEMO_TODAY;
  const y = addDays(DEMO_TODAY, -1);
  const kovac = 'Damir Kovač';

  const rows: Array<Omit<KddEntry, 'id'>> = [
    // --- PS Centar, tekuća II smjena ---
    { psId: 'ps-centar', when: `${d}T19:05`, type: 'dogadjaj', description: 'Primopredaja smjene izvršena. Stanje ljudstva i vozila uredno.', status: 'zakljucen', outcome: 'Bez primjedbi.', recordedBy: kovac },
    { psId: 'ps-centar', when: `${d}T19:42`, type: 'poziv_122', description: 'Prijava buke iz ugostiteljskog objekta, Ferhadija.', assignedPatrol: 'Pješačka 1-1', status: 'zakljucen', outcome: 'Upozorenje vlasniku, buka prekinuta.', recordedBy: kovac },
    { psId: 'ps-centar', when: `${d}T20:15`, type: 'intervencija', description: 'Saobraćajna nezgoda bez povrijeđenih, Titova ulica.', assignedPatrol: 'Auto-patrola 2-1 · Interventna', status: 'zakljucen', outcome: 'Uviđaj izvršen, sačinjena službena zabilješka.', recordedBy: kovac },
    { psId: 'ps-centar', when: `${d}T21:03`, type: 'poziv_122', description: 'Prijava sumnjivog lica u haustoru, Mis Irbina.', assignedPatrol: 'Pješačka 1-2', status: 'zakljucen', outcome: 'Provjera identiteta, lice udaljeno.', recordedBy: kovac },
    { psId: 'ps-centar', when: `${d}T21:48`, type: 'intervencija', description: 'Narušavanje javnog reda i mira ispred lokala, Baščaršija.', assignedPatrol: 'Auto-patrola 2-2', status: 'u_toku', recordedBy: kovac },
    { psId: 'ps-centar', when: `${d}T22:20`, type: 'dogadjaj', description: 'Kontrola saobraćaja — punkt Marijin dvor.', assignedPatrol: 'Moto 4-1', status: 'otvoren', recordedBy: kovac },
    { psId: 'ps-centar', when: `${d}T22:35`, type: 'poziv_122', description: 'Prijava krađe mobilnog telefona, prijavilac upućen u stanicu.', status: 'otvoren', recordedBy: kovac },
    // --- PS Centar, prethodna smjena ---
    { psId: 'ps-centar', when: `${y}T14:10`, type: 'intervencija', description: 'Porodična svađa, bez fizičkog nasilja, Koševo.', assignedPatrol: 'Auto-patrola 2-1 · Interventna', status: 'zakljucen', outcome: 'Strane smirene, upućene na medijaciju.', recordedBy: 'Mirza Delić' },
    // --- ostale stanice ---
    { psId: 'ps-stari-grad', when: `${d}T20:05`, type: 'poziv_122', description: 'Prijava parkiranja na pješačkoj zoni, Kovači.', assignedPatrol: 'Pješačka 3-1', status: 'zakljucen', outcome: 'Izdat prekršajni nalog.', recordedBy: 'Haris Bešlija' },
    { psId: 'ps-stari-grad', when: `${d}T22:00`, type: 'dogadjaj', description: 'Osiguranje kulturne manifestacije, Vijećnica.', assignedPatrol: 'Pješačka 3-2', status: 'u_toku', recordedBy: 'Haris Bešlija' },
    { psId: 'ps-novi-grad', when: `${d}T19:30`, type: 'intervencija', description: 'Provala u poslovni prostor, Alipašino Polje.', assignedPatrol: 'Auto-patrola 5-1', status: 'u_toku', recordedBy: 'Senad Karić' },
    { psId: 'ps-novi-grad', when: `${d}T21:15`, type: 'poziv_122', description: 'Prijava nesavjesne vožnje, Bulevar Meše Selimovića.', assignedPatrol: 'Auto-patrola 5-2', status: 'zakljucen', outcome: 'Vozilo zaustavljeno, izdat prekršajni nalog.', recordedBy: 'Senad Karić' },
    { psId: 'ps-dobrinja', when: `${d}T20:40`, type: 'dogadjaj', description: 'Redovna patrolna aktivnost u naselju Dobrinja C5.', assignedPatrol: 'Auto-patrola 6-1', status: 'zakljucen', outcome: 'Bez posebnih zapažanja.', recordedBy: 'Amir Šehić' },
  ];

  return rows.map((r, i) => ({ ...r, id: `kdd-seed-${String(i + 1).padStart(3, '0')}` }));
}

/** Bilteni prethodne (noćne) smjene — PS Dobrinja namjerno nedostaje (čeka se). */
function seedBiltens(): Bilten[] {
  const y = addDays(DEMO_TODAY, -1);
  const rows: Array<Omit<Bilten, 'id'>> = [
    {
      psId: 'ps-centar', shiftDate: y, shiftKind: 'II',
      counts: { dogadjaji: 9, intervencije: 4, prekrsajniNalozi: 7 },
      note: 'Bez težih incidenata. Jedna saobraćajna nezgoda bez povrijeđenih.',
      submittedBy: 'Mirza Delić', submittedAt: `${DEMO_TODAY}T07:12`,
    },
    {
      psId: 'ps-stari-grad', shiftDate: y, shiftKind: 'II',
      counts: { dogadjaji: 6, intervencije: 2, prekrsajniNalozi: 11 },
      note: 'Pojačan promet u zoni Baščaršije zbog manifestacije.',
      submittedBy: 'Haris Bešlija', submittedAt: `${DEMO_TODAY}T07:05`,
    },
    {
      psId: 'ps-novi-grad', shiftDate: y, shiftKind: 'II',
      counts: { dogadjaji: 12, intervencije: 6, prekrsajniNalozi: 9 },
      note: 'Provala u poslovni prostor — uviđaj u toku.',
      submittedBy: 'Senad Karić', submittedAt: `${DEMO_TODAY}T07:20`,
    },
  ];
  return rows.map((r, i) => ({ ...r, id: `bilten-seed-${i + 1}` }));
}

/** Dva ranija dokumenta — da ekran nije prazan i da komandir ima šta vidjeti. */
function seedReports(): PoliceReport[] {
  return [
    {
      id: 'rep-seed-1',
      officerId: 'off-0001',
      psId: 'ps-centar',
      kind: 'sluzbena_zabiljeska',
      summary: 'Zatečeno oštećenje stakla na izlogu, vlasnik obaviješten telefonom.',
      body: 'Sačinjena službena zabilješka o oštećenju izloga u ul. Ferhadija.',
      status: 'odstampan',
      createdAt: `${addDays(DEMO_TODAY, -6)}T21:10`,
      submittedAt: `${addDays(DEMO_TODAY, -6)}T22:05`,
    },
    {
      id: 'rep-seed-2',
      officerId: 'off-0001',
      psId: 'ps-centar',
      kind: 'prekrsajna_prijava',
      summary: 'Vozač zatečen bez vozačke dozvole tokom kontrole saobraćaja.',
      body: 'Podnesena prekršajna prijava zbog upravljanja vozilom bez dozvole.',
      status: 'predan',
      createdAt: `${addDays(DEMO_TODAY, -2)}T23:40`,
      submittedAt: `${addDays(DEMO_TODAY, -2)}T23:55`,
    },
  ];
}

/** Raniji položen test — da Akademija nije prazna i da odmah ima jedan certifikat. */
function seedAcademyAttempts(): AcademyAttempt[] {
  return [
    {
      id: 'aca-seed-1',
      officerId: 'off-0001',
      oblastId: 'jrm',
      correct: 5,
      total: 6,
      takenAt: `${addDays(DEMO_TODAY, -9)}T20:15`,
    },
  ];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => seedNotifications());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => seedLeaveRequests());
  const [courtSummonses, setCourtSummonses] = useState<CourtSummons[]>(() => world.courtSummonses);
  const [overtimePostings, setOvertimePostings] = useState<OvertimePosting[]>(() => seedOvertimePostings());
  const [activePatrols, setActivePatrols] = useState<ActivePatrolCard[]>(() => seedActivePatrols());
  const [shiftLog, setShiftLog] = useState<ShiftLogEntry[]>(() => [
    { id: 'log-init-1', when: `${DEMO_TODAY}T19:00`, who: 'Damir Kovač', event: 'Otvorena II smjena.' },
    { id: 'log-init-2', when: `${DEMO_TODAY}T19:05`, who: 'Sistem', event: 'Sve patrole na terenu.' },
  ]);
  const [kddEntries, setKddEntries] = useState<KddEntry[]>(() => seedKdd());
  const [reports, setReports] = useState<PoliceReport[]>(() => seedReports());
  const [biltens, setBiltens] = useState<Bilten[]>(() => seedBiltens());
  const [academyAttempts, setAcademyAttempts] = useState<AcademyAttempt[]>(() => seedAcademyAttempts());

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const confirmCourtSummons = useCallback((id: string) => {
    setCourtSummonses((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'potvrdjen' } : c)));
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.action?.payload?.summonsId !== id) return n;
        return {
          ...n,
          action: { label: 'Unesi trajanje', kind: 'court_log_hours', payload: { summonsId: id } },
          body: 'Prisustvo potvrđeno. Nakon termina evidentiraj trajanje.',
          read: true,
        };
      }),
    );
  }, []);

  const logCourtHours = useCallback((id: string, hours: number) => {
    setCourtSummonses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'evidentirano', hoursCredited: hours } : c)),
    );
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.action?.payload?.summonsId !== id) return n;
        const { ...rest } = n;
        delete (rest as { action?: unknown }).action;
        return {
          ...rest,
          title: `${hours} h evidentirano za obračun`,
          body: 'Sati sa suda idu automatski u obračun august 2026.',
          severity: 'info',
          read: true,
        } as Notification;
      }),
    );
  }, []);

  const submitLeaveRequest = useCallback((draft: DraftLeaveRequest): LeaveRequest => {
    const req: LeaveRequest = {
      id: `lr-${Date.now()}`,
      officerId: draft.officerId,
      kind: draft.kind,
      submittedAt: demoNow(),
      fromDate: draft.fromDate,
      toDate: draft.toDate,
      reason: draft.reason,
      status: 'u_toku',
      // Odobrava komandir stanice, ne šef smjene — šef smjene vodi smjenu na terenu.
      // Godišnji ide i na načelnika PU; bolovanje se samo evidentira kod komandira.
      approvalChain: chainFor(draft.kind),
    };
    setLeaveRequests((prev) => [req, ...prev]);
    return req;
  }, []);

  const advanceApproval = useCallback(
    (id: string, decision: 'odobreno' | 'odbijeno', note?: string) => {
      setLeaveRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const chain = [...r.approvalChain];
          const idx = chain.findIndex((s) => s.status === 'ceka');
          if (idx === -1) return r;
          chain[idx] = {
            ...chain[idx],
            status: decision,
            resolvedAt: demoNow(),
            note,
          };
          const rejected = decision === 'odbijeno';
          const stillCeka = chain.some((s) => s.status === 'ceka');
          const status: LeaveRequest['status'] = rejected
            ? 'odbijen'
            : stillCeka
            ? 'u_toku'
            : 'odobren';
          return { ...r, approvalChain: chain, status };
        }),
      );
    },
    [],
  );

  const createOvertimePosting = useCallback(
    (input: Omit<OvertimePosting, 'id' | 'offerLog' | 'createdAt'>) => {
      const p: OvertimePosting = {
        ...input,
        id: `ot-${Date.now()}`,
        offerLog: [],
        createdAt: demoNow(),
      };
      setOvertimePostings((prev) => [p, ...prev]);
      return p;
    },
    [],
  );

  const offerOvertime = useCallback((postingId: string, officerId: string, officerName: string) => {
    setOvertimePostings((prev) =>
      prev.map((p) =>
        p.id !== postingId || p.offerLog.some((o) => o.officerId === officerId)
          ? p
          : { ...p, offerLog: [...p.offerLog, { officerId, officerName, offeredAt: demoNow() }] },
      ),
    );
  }, []);

  const acceptOvertime = useCallback((postingId: string, officerId: string) => {
    setOvertimePostings((prev) =>
      prev.map((p) =>
        p.id !== postingId
          ? p
          : { ...p, offerLog: p.offerLog.map((o) => (o.officerId === officerId ? { ...o, accepted: true } : o)) },
      ),
    );
  }, []);

  const addKddEntry = useCallback((input: KddDraft): KddEntry => {
    const entry: KddEntry = {
      ...input,
      id: `kdd-${Date.now()}`,
      when: input.when ?? demoNow(),
    };
    setKddEntries((prev) => [...prev, entry]);
    return entry;
  }, []);

  const updateKddEntry = useCallback(
    (
      id: string,
      patch: Partial<Pick<KddEntry, 'description' | 'outcome' | 'status' | 'assignedPatrol'>>,
      actor: string,
    ) => {
      setKddEntries((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          // Svaka izmjena se dopisuje u trag — postojeći zapisi se ne mijenjaju i ne brišu.
          const revisions = [...(e.revisions ?? [])];
          for (const [field, to] of Object.entries(patch) as Array<[KddRevision['field'], string]>) {
            const from = (e[field] as string | undefined) ?? '';
            if (from === to) continue;
            revisions.push({ at: demoNow(), by: actor, field, from, to });
          }
          return { ...e, ...patch, revisions };
        }),
      );
    },
    [],
  );

  const appendLog = useCallback((entry: Omit<ShiftLogEntry, 'id' | 'when'>) => {
    setShiftLog((prev) => [
      ...prev,
      { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, when: demoNow(), ...entry },
    ]);
  }, []);

  const submitBilten = useCallback(
    (input: Omit<Bilten, 'id' | 'submittedAt'>): Bilten => {
      const bilten: Bilten = { ...input, id: `bilten-${Date.now()}`, submittedAt: demoNow() };
      setBiltens((prev) => [...prev.filter((b) => !(b.psId === input.psId && b.shiftDate === input.shiftDate && b.shiftKind === input.shiftKind)), bilten]);
      appendLog({ who: input.submittedBy, event: 'Smjena zaključena — bilten poslan OKC-u.' });
      return bilten;
    },
    [appendLog],
  );

  const markOfficerSick = useCallback(
    (patrolId: string, officerId: string, reason: string) => {
      const officer = world.officers.find((o) => o.id === officerId);
      setActivePatrols((prev) =>
        prev.map((p) => {
          if (p.id !== patrolId) return p;
          const remaining = p.officers.filter((id) => id !== officerId);
          return {
            ...p,
            officers: remaining,
            status: 'nepotpuna',
            incompleteReason: `${officer?.name ?? 'Policajac'} — ${reason}`,
          };
        }),
      );
      appendLog({
        who: 'Damir Kovač',
        event: `${officer?.name ?? 'Policajac'} napustio smjenu — ${reason}. Patrola označena kao NEPOTPUNA.`,
      });
    },
    [appendLog],
  );

  const reassignOfficer = useCallback(
    (patrolId: string, newOfficerId: string) => {
      const officer = world.officers.find((o) => o.id === newOfficerId);
      setActivePatrols((prev) =>
        prev.map((p) => {
          if (p.id !== patrolId) return p;
          return {
            ...p,
            officers: [...p.officers, newOfficerId],
            status: 'na_terenu',
            incompleteReason: undefined,
          };
        }),
      );
      appendLog({
        who: 'Damir Kovač',
        event: `${officer?.name ?? 'Policajac'} premješten u ${patrolId}. Patrola ponovo popunjena.`,
      });
    },
    [appendLog],
  );

  const saveReport = useCallback((input: ReportDraft): PoliceReport => {
    let saved!: PoliceReport;
    setReports((prev) => {
      if (input.id) {
        return prev.map((r) => {
          if (r.id !== input.id) return r;
          saved = { ...r, ...input, id: r.id };
          return saved;
        });
      }
      saved = {
        ...input,
        id: `rep-${Date.now()}`,
        status: input.status ?? 'nacrt',
        createdAt: demoNow(),
      } as PoliceReport;
      return [saved, ...prev];
    });
    return saved;
  }, []);

  const setReportStatus = useCallback((id: string, status: ReportStatus) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, submittedAt: status === 'predan' ? demoNow() : r.submittedAt } : r,
      ),
    );
  }, []);

  const recordAcademyAttempt = useCallback((input: Omit<AcademyAttempt, 'id' | 'takenAt'>): AcademyAttempt => {
    const attempt: AcademyAttempt = { ...input, id: `aca-${Date.now()}`, takenAt: demoNow() };
    setAcademyAttempts((prev) => [attempt, ...prev]);
    return attempt;
  }, []);

  /** Status patrole postavlja šef smjene kad mu se patrola javi (pauza ima trajanje). */
  const setPatrolStatus = useCallback(
    (patrolId: string, status: ActivePatrolCard['status'], minutes?: number) => {
      let label = '';
      setActivePatrols((prev) =>
        prev.map((p) => {
          if (p.id !== patrolId) return p;
          label = p.callSign;
          const pauzaDo =
            status === 'pauza' && minutes
              ? (() => {
                  const [d, t] = demoNow().split('T');
                  const [hh, mm] = t.split(':').map(Number);
                  const end = new Date(2000, 0, 1, hh, mm + minutes);
                  return `${d}T${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
                })()
              : undefined;
          return { ...p, status, pauzaDo };
        }),
      );
      const text =
        status === 'pauza'
          ? `${label}: pauza${minutes ? ` (${minutes} min)` : ''}.`
          : status === 'intervencija'
            ? `${label}: upućena na intervenciju.`
            : `${label}: ponovo na terenu.`;
      appendLog({ who: 'Šef smjene', event: text });
    },
    [appendLog],
  );

  const value = useMemo<Store>(
    () => ({
      notifications,
      leaveRequests,
      courtSummonses,
      overtimePostings,
      activePatrols,
      shiftLog,
      markNotificationRead,
      confirmCourtSummons,
      logCourtHours,
      submitLeaveRequest,
      advanceApproval,
      createOvertimePosting,
      offerOvertime,
      acceptOvertime,
      markOfficerSick,
      reassignOfficer,
      setPatrolStatus,
      kddEntries,
      addKddEntry,
      updateKddEntry,
      biltens,
      submitBilten,
      reports,
      saveReport,
      setReportStatus,
      academyAttempts,
      recordAcademyAttempt,
    }),
    [
      academyAttempts,
      recordAcademyAttempt,
      kddEntries,
      addKddEntry,
      updateKddEntry,
      biltens,
      submitBilten,
      reports,
      saveReport,
      setReportStatus,
      notifications,
      leaveRequests,
      courtSummonses,
      overtimePostings,
      activePatrols,
      shiftLog,
      markNotificationRead,
      confirmCourtSummons,
      logCourtHours,
      submitLeaveRequest,
      advanceApproval,
      createOvertimePosting,
      offerOvertime,
      acceptOvertime,
      markOfficerSick,
      reassignOfficer,
      setPatrolStatus,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreCtx);
  if (!s) throw new Error('StoreProvider nije montiran.');
  return s;
}

function formatDayHour(iso: string): string {
  const [datePart, timePart] = iso.split('T');
  const [, m, d] = datePart.split('-');
  return `${d}.${m}. u ${timePart ?? ''}`;
}
