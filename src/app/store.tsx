// Provider + useStore hook co-located (standard React context pattern); the
// fast-refresh rule is a false positive since the hook depends on this context.
/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CourtSummons, LeaveRequest, Notification } from '../data/types';
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
}

export interface ShiftLogEntry {
  id: string;
  when: string;
  who: string;
  event: string;
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

  markOfficerSick: (patrolId: string, officerId: string) => void;
  reassignOfficer: (patrolId: string, newOfficerId: string) => void;
}

export interface DraftLeaveRequest {
  officerId: string;
  officerName: string;
  kind: LeaveRequest['kind'];
  fromDate?: string;
  toDate?: string;
  reason?: string;
}

const StoreCtx = createContext<Store | null>(null);

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
      kind: 'prekovremeni_ponuda',
      severity: 'action',
      title: 'Prekovremeni: interventna, subota 06.09.',
      body: 'PS Centar traži 2 osobe za popunu interventne smjene.',
      createdAt: yestIso,
      read: false,
      action: { label: 'Prihvati', kind: 'accept_overtime', payload: { postingId: 'ot-0001' } },
    },
    {
      id: 'notif-cert-1',
      officerId: 'off-0001',
      kind: 'certifikat_upozorenje',
      severity: 'warn',
      title: 'Godišnje gađanje ističe za 21 dan',
      body: 'Rezerviši termin kod komandira PS Centar.',
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
          role: 'sefSmjene',
          approverName: 'Damir Kovač',
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
        {
          role: 'sefSmjene',
          approverName: 'Damir Kovač',
          status: 'odobreno',
          resolvedAt: `${addDays(DEMO_TODAY, -1)}T15:10`,
        },
        { role: 'komandir', approverName: 'Adnan Softić', status: 'ceka' },
        { role: 'nacelnik', approverName: 'Samir Begić', status: 'ceka' },
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
          role: 'sefSmjene',
          approverName: 'Damir Kovač',
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
  return [
    {
      id: 'patrol-auto-2-1',
      callSign: 'Auto-patrola 2-1 · Interventna',
      vehiclePlate: 'A-311-K-121',
      officers: ['off-0001', 'off-0005'],
      status: 'na_terenu',
      location: 'Ferhadija',
    },
    {
      id: 'patrol-auto-2-2',
      callSign: 'Auto-patrola 2-2',
      vehiclePlate: 'A-311-K-122',
      officers: ['off-0006', 'off-0007'],
      status: 'pauza',
      location: 'PS Centar',
    },
    {
      id: 'patrol-moto-4-1',
      callSign: 'Moto 4-1',
      vehiclePlate: 'A-311-M-104',
      officers: ['off-0008'],
      status: 'na_terenu',
      location: 'Marijin dvor',
    },
    {
      id: 'patrol-pjes-1-1',
      callSign: 'Pješačka 1-1',
      officers: ['off-0009', 'off-0010'],
      status: 'intervencija',
      location: 'Titova',
    },
    {
      id: 'patrol-pjes-1-2',
      callSign: 'Pješačka 1-2',
      officers: ['off-0011', 'off-0012'],
      status: 'na_terenu',
      location: 'Baščaršija',
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
      approvalChain:
        draft.kind === 'slobodan_dan'
          ? [{ role: 'sefSmjene', approverName: 'Damir Kovač', status: 'ceka' }]
          : [
              { role: 'sefSmjene', approverName: 'Damir Kovač', status: 'ceka' },
              { role: 'komandir', approverName: 'Adnan Softić', status: 'ceka' },
              { role: 'nacelnik', approverName: 'Samir Begić', status: 'ceka' },
            ],
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

  const appendLog = useCallback((entry: Omit<ShiftLogEntry, 'id' | 'when'>) => {
    setShiftLog((prev) => [
      ...prev,
      { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, when: demoNow(), ...entry },
    ]);
  }, []);

  const markOfficerSick = useCallback(
    (patrolId: string, officerId: string) => {
      const officer = world.officers.find((o) => o.id === officerId);
      setActivePatrols((prev) =>
        prev.map((p) => {
          if (p.id !== patrolId) return p;
          const remaining = p.officers.filter((id) => id !== officerId);
          return {
            ...p,
            officers: remaining,
            status: 'nepotpuna',
            incompleteReason: `${officer?.name ?? 'Policajac'} napustio smjenu (bolovanje)`,
          };
        }),
      );
      appendLog({
        who: 'Damir Kovač',
        event: `${officer?.name ?? 'Policajac'} napustio smjenu (bolovanje). ${patrolId} označen kao NEPOTPUNA.`,
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
    }),
    [
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
