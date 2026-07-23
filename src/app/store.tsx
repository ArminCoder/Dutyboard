import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CourtSummons, LeaveRequest, Notification } from '../data/types';
import { world } from '../data/world';
import { DEMO_TODAY, addDays } from '../data/generator/dates';

// Sve mutabilne stvari (obavještenja, zahtjevi, sudski poziv statusi) žive ovdje.
// Reset na reload je namjeran i prihvatljiv za demo.

interface Store {
  notifications: Notification[];
  leaveRequests: LeaveRequest[];
  courtSummonses: CourtSummons[];

  markNotificationRead: (id: string) => void;
  confirmCourtSummons: (id: string) => void;
  logCourtHours: (id: string, hours: number) => void;
  submitLeaveRequest: (draft: DraftLeaveRequest) => LeaveRequest;
  advanceApproval: (id: string, decision: 'odobreno' | 'odbijeno', note?: string) => void;
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
      title: 'Godišnje gađanje ističe za 34 dana',
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
  ];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => seedNotifications());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => seedLeaveRequests());
  const [courtSummonses, setCourtSummonses] = useState<CourtSummons[]>(() => world.courtSummonses);

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
      submittedAt: new Date().toISOString().slice(0, 16),
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
            resolvedAt: new Date().toISOString().slice(0, 16),
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

  const value = useMemo<Store>(
    () => ({
      notifications,
      leaveRequests,
      courtSummonses,
      markNotificationRead,
      confirmCourtSummons,
      logCourtHours,
      submitLeaveRequest,
      advanceApproval,
    }),
    [
      notifications,
      leaveRequests,
      courtSummonses,
      markNotificationRead,
      confirmCourtSummons,
      logCourtHours,
      submitLeaveRequest,
      advanceApproval,
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
