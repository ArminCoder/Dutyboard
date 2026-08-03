import { useMemo, useState } from 'react';
import { Bell, Calendar, ChevronRight, MapPin, Users, Car, Gavel, ClipboardCheck, GraduationCap } from 'lucide-react';
import { useSoftić } from './useOfficer';
import { world } from '../../data/world';
import { useStore } from '../../app/store';
import { DEMO_TODAY, dayNameBs, formatBs, longBs, monthNameBs } from '../../data/generator/dates';
import { SHIFT_TIME, type Notification } from '../../data/types';
import { ScheduleSection } from './ScheduleSection';

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

  /** Slot u kojem je policajac — ne slots[0]; on nije uvijek auto-patrola. */
  const mySlot = useMemo(
    () => nextShift?.slots.find((sl) => sl.assignedOfficerIds.includes(officer.id)) ?? null,
    [nextShift, officer.id],
  );

  const partnerName = useMemo(() => {
    const partnerId = mySlot?.assignedOfficerIds.find((id) => id !== officer.id);
    return partnerId ? world.officers.find((o) => o.id === partnerId)?.name ?? null : null;
  }, [mySlot, officer.id]);

  const notifications = store.notifications.filter((n) => n.officerId === officer.id);
  const unread = notifications.filter((n) => !n.read).length;

  const firstName = officer.name.split(' ')[0];
  const greeting = greetingFor(new Date().getHours());

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400">{longBs(DEMO_TODAY)}</div>
        <h1 className="mt-1 text-xl font-heading font-medium text-ink-800">
          {greeting}, {firstName}.
        </h1>
      </div>

      {nextShift ? (
        <section className=" bg-gradient-to-br from-navy-900 to-navy-700 p-5 text-paper-50 ">
          <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-200">
            <Calendar className="h-3.5 w-3.5" />
            Sljedeća smjena
          </div>
          <div className="mb-3 text-2xl font-semibold">
            {nextShift.date === DEMO_TODAY ? 'Danas' : dayNameBs(nextShift.date)},{' '}
            <span className="text-ink-100">{formatBs(nextShift.date)}</span>
          </div>
          <div className="mb-4 text-sm text-ink-100">
            {SHIFT_TIME[nextShift.kind].label} ({nextShift.kind} smjena)
          </div>

          <dl className="space-y-2 text-sm">
            <ShiftMeta icon={<MapPin className="h-3.5 w-3.5" />} label="Uloga">
              {mySlot?.callSign ?? '—'}
            </ShiftMeta>
            <ShiftMeta icon={<Users className="h-3.5 w-3.5" />} label="Partner">
              {partnerName ?? 'samostalno'}
            </ShiftMeta>
            <ShiftMeta icon={<Car className="h-3.5 w-3.5" />} label="Vozilo">
              {mySlot?.vehiclePlate ?? '—'}
            </ShiftMeta>
          </dl>
        </section>
      ) : (
        <EmptyCard title="Nema zakazanih smjena" body="Raspored za naredni period još nije objavljen." />
      )}

      <ScheduleSection officerId={officer.id} />

      <section className=" bg-paper-0 p-4 border border-paper-200">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-ink-500" />
            <h2 className="text-sm font-heading font-medium text-ink-800">Obavještenja</h2>
            {unread > 0 && (
              <span className="rounded-full bg-signal-alarm px-1.5 py-0.5 text-[10px] font-semibold text-paper-50">
                {unread}
              </span>
            )}
          </div>
          <span className="text-xs text-ink-400">{notifications.length} ukupno</span>
        </div>
        <ul className="divide-y divide-paper-200">
          {notifications.length === 0 ? (
            <li className="py-4 text-center text-xs text-ink-400">Nema obavještenja.</li>
          ) : null}
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </ul>
      </section>

      <p className="pt-2 text-center text-[11px] text-ink-400">
        {monthNameBs(Number(DEMO_TODAY.slice(5, 7)) - 1)} {DEMO_TODAY.slice(0, 4)}. · Dutyboard demo
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

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <section className=" border border-dashed border-paper-200 bg-paper-0 p-6 text-center">
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
        <span className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center  ${bgFor(n.severity)}`}>
          <Icon className={`h-4 w-4 ${fgFor(n.severity)}`} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`truncate text-sm ${n.read ? 'font-medium text-ink-700' : 'font-heading font-medium text-ink-800'}`}>
              {n.title}
            </span>
            {!n.read && <span className="h-2 w-2 flex-none rounded-full bg-signal-alarm" />}
          </span>
          <span className="mt-0.5 block text-xs text-ink-500">{n.body}</span>
        </span>
        <ChevronRight className="mt-1 h-4 w-4 flex-none text-paper-400" />
      </button>
      {n.action ? (
        <div className="mt-2 pl-11">
          {n.action.kind === 'court_confirm' && summonsId ? (
            <button
              onClick={() => store.confirmCourtSummons(summonsId)}
              className="inline-flex items-center gap-1.5  bg-navy-900 px-3 py-1.5 text-xs font-medium text-paper-50 transition hover:bg-navy-800"
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
                  className=" border border-paper-200 bg-paper-0 px-2 py-1 text-xs"
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
                  className=" bg-navy-900 px-3 py-1.5 text-xs font-medium text-paper-50"
                >
                  Evidentiraj
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLogging(true)}
                className="inline-flex items-center gap-1.5  bg-navy-900 px-3 py-1.5 text-xs font-medium text-paper-50 transition hover:bg-navy-800"
              >
                {n.action.label}
              </button>
            )
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
    case 'prekovremeni_nalog': return Users;
    case 'obuka': return GraduationCap;
    case 'certifikat_upozorenje': return Bell;
    default: return Bell;
  }
}

function bgFor(sev: Notification['severity']): string {
  switch (sev) {
    case 'action': return 'bg-navy-900';
    case 'warn': return 'bg-signal-warn/15';
    default: return 'bg-paper-100';
  }
}

function fgFor(sev: Notification['severity']): string {
  switch (sev) {
    case 'action': return 'text-paper-50';
    case 'warn': return 'text-signal-warn';
    default: return 'text-ink-600';
  }
}
