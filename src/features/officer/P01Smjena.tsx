import { useMemo, useState } from 'react';
import { Bell, Calendar, ChevronRight, MapPin, Users, Car, Gavel, ClipboardCheck } from 'lucide-react';
import { useSoftić } from './useOfficer';
import { world } from '../../data/world';
import { useStore } from '../../app/store';
import {
  DEMO_TODAY,
  addDays,
  dayNameBs,
  dayNameBsShort,
  formatBs,
  formatBsShort,
  longBs,
  monthNameBs,
} from '../../data/generator/dates';
import type { Notification } from '../../data/types';

export function P01Smjena() {
  const officer = useSoftić();
  const store = useStore();

  const nextShift = useMemo(() => {
    const upcoming = world.shifts
      .filter((s) => s.slots.some((sl) => sl.assignedOfficerIds.includes(officer.id)))
      .filter((s) => s.date >= DEMO_TODAY)
      .sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
    return upcoming[0] ?? null;
  }, [officer.id]);

  const partnerName = useMemo(() => {
    if (!nextShift) return null;
    const slot = nextShift.slots.find((sl) => sl.assignedOfficerIds.includes(officer.id));
    const partnerId = slot?.assignedOfficerIds.find((id) => id !== officer.id);
    return partnerId ? world.officers.find((o) => o.id === partnerId)?.name ?? null : null;
  }, [nextShift, officer.id]);

  const weekly = useMemo(() => {
    const days: Array<{ date: string; label: string; kind: 'radi' | 'slobodan' | 'godisnji' }> = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(DEMO_TODAY, i);
      const worksThatDay = world.shifts.some(
        (s) => s.date === date && s.slots.some((sl) => sl.assignedOfficerIds.includes(officer.id)),
      );
      days.push({
        date,
        label: dayNameBsShort(date),
        kind: worksThatDay ? 'radi' : 'slobodan',
      });
    }
    return days;
  }, [officer.id]);

  const notifications = store.notifications.filter((n) => n.officerId === officer.id);
  const unread = notifications.filter((n) => !n.read).length;

  const firstName = officer.name.split(' ')[0];
  const greeting = greetingFor(new Date().getHours());

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400">{longBs(DEMO_TODAY)}</div>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">
          {greeting}, {firstName}.
        </h1>
      </div>

      {nextShift ? (
        <section className="rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 p-5 text-white shadow-lg">
          <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-200">
            <Calendar className="h-3.5 w-3.5" />
            Sljedeća smjena
          </div>
          <div className="mb-3 text-2xl font-semibold">
            {nextShift.date === DEMO_TODAY ? 'Danas' : dayNameBs(nextShift.date)},{' '}
            <span className="text-ink-100">{formatBs(nextShift.date)}</span>
          </div>
          <div className="mb-4 text-sm text-ink-100">
            {nextShift.kind === 'I' ? '07:00 – 19:00 (I smjena)' : '19:00 – 07:00 (II smjena)'}
          </div>

          <dl className="space-y-2 text-sm">
            <ShiftMeta icon={<MapPin className="h-3.5 w-3.5" />} label="Uloga">
              {nextShift.slots[0]?.callSign ?? '—'}
            </ShiftMeta>
            <ShiftMeta icon={<Users className="h-3.5 w-3.5" />} label="Partner">
              {partnerName ?? '—'}
            </ShiftMeta>
            <ShiftMeta icon={<Car className="h-3.5 w-3.5" />} label="Vozilo">
              {nextShift.slots[0]?.vehiclePlate ?? '—'}
            </ShiftMeta>
          </dl>
        </section>
      ) : (
        <EmptyCard title="Nema zakazanih smjena" body="Raspored za naredni period još nije objavljen." />
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Sedmični pregled</h2>
          <span className="text-xs text-ink-400">
            {formatBsShort(DEMO_TODAY)} – {formatBsShort(addDays(DEMO_TODAY, 6))}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekly.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div className="text-[10px] uppercase text-ink-400">{d.label}</div>
              <div
                className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium ${
                  d.kind === 'radi'
                    ? 'bg-ink-900 text-white'
                    : d.kind === 'godisnji'
                    ? 'bg-signal-warn/15 text-signal-warn'
                    : 'bg-ink-100 text-ink-500'
                }`}
              >
                {d.date.slice(-2)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-ink-500">
          <LegendDot color="bg-ink-900" label="rad" />
          <LegendDot color="bg-ink-200" label="slobodan" />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-ink-500" />
            <h2 className="text-sm font-semibold text-ink-900">Obavještenja</h2>
            {unread > 0 && (
              <span className="rounded-full bg-signal-alarm px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </div>
          <span className="text-xs text-ink-400">{notifications.length} ukupno</span>
        </div>
        <ul className="divide-y divide-ink-100">
          {notifications.length === 0 ? (
            <li className="py-4 text-center text-xs text-ink-400">Nema obavještenja.</li>
          ) : null}
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </ul>
      </section>

      <p className="pt-2 text-center text-[11px] text-ink-400">
        {monthNameBs(new Date().getMonth())} {new Date().getFullYear()}. · Dutyboard demo
      </p>
    </div>
  );
}

function greetingFor(hour: number): string {
  if (hour < 4) return 'Sretna smjena';
  if (hour < 11) return 'Dobro jutro';
  if (hour < 17) return 'Zdravo';
  return 'Dobro veče';
}

function ShiftMeta({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-24 items-center gap-1.5 text-xs uppercase tracking-wider text-ink-200">
        {icon}
        {label}
      </div>
      <div className="flex-1 font-medium">{children}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded ${color}`} />
      <span>{label}</span>
    </span>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-ink-200 bg-white p-6 text-center">
      <div className="text-sm font-semibold text-ink-700">{title}</div>
      <div className="mt-1 text-xs text-ink-500">{body}</div>
    </section>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const store = useStore();
  const [logging, setLogging] = useState(false);
  const [hours, setHours] = useState<string>('2');

  const Icon = iconFor(n.kind);
  const summonsId = typeof n.action?.payload?.summonsId === 'string' ? n.action.payload.summonsId : null;

  return (
    <li className="py-3">
      <button
        className="flex w-full items-start gap-3 text-left"
        onClick={() => store.markNotificationRead(n.id)}
      >
        <span className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg ${bgFor(n.severity)}`}>
          <Icon className={`h-4 w-4 ${fgFor(n.severity)}`} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`truncate text-sm ${n.read ? 'font-medium text-ink-700' : 'font-semibold text-ink-900'}`}>
              {n.title}
            </span>
            {!n.read && <span className="h-2 w-2 flex-none rounded-full bg-signal-alarm" />}
          </span>
          <span className="mt-0.5 block text-xs text-ink-500">{n.body}</span>
        </span>
        <ChevronRight className="mt-1 h-4 w-4 flex-none text-ink-300" />
      </button>
      {n.action ? (
        <div className="mt-2 pl-11">
          {n.action.kind === 'court_confirm' && summonsId ? (
            <button
              onClick={() => store.confirmCourtSummons(summonsId)}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-ink-800"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              {n.action.label}
            </button>
          ) : null}
          {n.action.kind === 'court_log_hours' && summonsId ? (
            logging ? (
              <div className="flex items-center gap-2">
                <select
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="rounded-md border border-ink-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="1">1 sat</option>
                  <option value="2">2 sata</option>
                  <option value="3">3 sata</option>
                  <option value="4">drugo (4 h)</option>
                </select>
                <button
                  onClick={() => {
                    store.logCourtHours(summonsId, Number(hours));
                    setLogging(false);
                  }}
                  className="rounded-md bg-ink-900 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Evidentiraj
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLogging(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-ink-800"
              >
                {n.action.label}
              </button>
            )
          ) : null}
          {n.action.kind === 'accept_overtime' ? (
            <button
              onClick={() => store.markNotificationRead(n.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 transition hover:border-ink-500"
            >
              {n.action.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function iconFor(kind: Notification['kind']) {
  switch (kind) {
    case 'sudski_poziv': return Gavel;
    case 'raspored': return Calendar;
    case 'prekovremeni_ponuda': return Users;
    case 'certifikat_upozorenje': return Bell;
    default: return Bell;
  }
}

function bgFor(sev: Notification['severity']): string {
  switch (sev) {
    case 'action': return 'bg-ink-900';
    case 'warn': return 'bg-signal-warn/15';
    default: return 'bg-ink-100';
  }
}

function fgFor(sev: Notification['severity']): string {
  switch (sev) {
    case 'action': return 'text-white';
    case 'warn': return 'text-signal-warn';
    default: return 'text-ink-600';
  }
}
