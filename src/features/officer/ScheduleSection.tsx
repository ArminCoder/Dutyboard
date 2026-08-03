import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Moon, MapPin, Users, Car, CalendarOff } from 'lucide-react';
import { world } from '../../data/world';
import { useStore } from '../../app/store';
import { SHIFT_TIME, type LeaveRequestKind, type Shift, type ShiftSlot } from '../../data/types';
import {
  DEMO_TODAY,
  addDays,
  dayNameBs,
  dayNameBsShort,
  formatBs,
  formatBsShort,
  monthNameBs,
  parseISO,
} from '../../data/generator/dates';

// Raspored policajca — sedmični strip ili mjesečni kalendar s detaljem dana
// i sažetkom sati. Sve se izvodi iz world.shifts + odobrenih zahtjeva u store-u.

type View = 'sedmica' | 'mjesec';

interface DayEntry {
  shift: Shift;
  slot: ShiftSlot;
}

interface LeaveDay {
  kind: LeaveRequestKind;
  label: string;
}

const LEAVE_LABEL: Record<LeaveRequestKind, string> = {
  slobodan_dan: 'Slobodan dan',
  godisnji: 'Godišnji odmor',
  bolovanje: 'Bolovanje',
  ostalo: 'Odsustvo',
};

/** Prvi dan mjeseca kao ponedjeljak-bazirani indeks (0 = ponedjeljak). */
function mondayIndex(dateStr: string): number {
  return (parseISO(dateStr).getDay() + 6) % 7;
}

function daysInMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function stepMonth(ym: string, dir: 1 | -1): string {
  let [y, m] = ym.split('-').map(Number);
  m += dir;
  if (m > 12) { m = 1; y += 1; }
  if (m < 1) { m = 12; y -= 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function ScheduleSection({ officerId }: { officerId: string }) {
  const store = useStore();
  const [view, setView] = useState<View>('sedmica');
  const [monthYm, setMonthYm] = useState(DEMO_TODAY.slice(0, 7));
  const [selected, setSelected] = useState<string | null>(null);

  /** Sve smjene policajca po datumu (smjena se broji jednom i kad je u više slotova). */
  const byDate = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    for (const shift of world.shifts) {
      const slot = shift.slots.find((sl) => sl.assignedOfficerIds.includes(officerId));
      if (!slot) continue;
      const list = map.get(shift.date) ?? [];
      if (!list.some((e) => e.shift.id === shift.id)) list.push({ shift, slot });
      map.set(shift.date, list);
    }
    return map;
  }, [officerId]);

  /** Odobrena odsustva razvijena po danima. */
  const leaveByDate = useMemo(() => {
    const map = new Map<string, LeaveDay>();
    for (const r of store.leaveRequests) {
      if (r.officerId !== officerId || r.status !== 'odobren' || !r.fromDate) continue;
      let d = r.fromDate;
      const end = r.toDate ?? r.fromDate;
      let guard = 0;
      while (d <= end && guard++ < 90) {
        map.set(d, { kind: r.kind, label: LEAVE_LABEL[r.kind] });
        d = addDays(d, 1);
      }
    }
    return map;
  }, [store.leaveRequests, officerId]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(DEMO_TODAY, i)),
    [],
  );

  const monthDays = useMemo(() => {
    const n = daysInMonth(monthYm);
    return Array.from({ length: n }, (_, i) => `${monthYm}-${String(i + 1).padStart(2, '0')}`);
  }, [monthYm]);

  /** Sažetak sati za prikazani mjesec. */
  const summary = useMemo(() => {
    let shifts = 0;
    let hours = 0;
    let night = 0;
    const leaveCount: Record<string, number> = {};
    for (const date of monthDays) {
      const leave = leaveByDate.get(date);
      if (leave) {
        leaveCount[leave.kind] = (leaveCount[leave.kind] ?? 0) + 1;
        continue; // odsustvo ima prednost nad rasporedom
      }
      for (const e of byDate.get(date) ?? []) {
        shifts += 1;
        hours += SHIFT_TIME[e.shift.kind].hours;
        night += SHIFT_TIME[e.shift.kind].nightHours; // 22:00–06:00, ne cijela smjena
      }
    }
    return { shifts, hours, night, leaveCount };
  }, [monthDays, byDate, leaveByDate]);

  const monthLabel = `${monthNameBs(Number(monthYm.slice(5, 7)) - 1)} ${monthYm.slice(0, 4)}.`;
  const detail = selected ? { date: selected, entries: byDate.get(selected) ?? [], leave: leaveByDate.get(selected) } : null;

  return (
    <section className="border border-paper-200 bg-paper-0 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-heading font-medium text-ink-800">Moj raspored</h2>
        <div className="flex gap-1 bg-paper-100 p-1">
          {(['sedmica', 'mjesec'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setSelected(null); }}
              className={`px-2.5 py-1 text-xs font-medium capitalize transition ${
                view === v ? 'bg-paper-0 text-ink-800' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              {v === 'sedmica' ? 'Sedmica' : 'Mjesec'}
            </button>
          ))}
        </div>
      </div>

      {view === 'sedmica' ? (
        <>
          <div className="mb-2 text-xs text-ink-400">
            {formatBsShort(DEMO_TODAY)} – {formatBsShort(addDays(DEMO_TODAY, 6))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((date) => (
              <button
                key={date}
                onClick={() => setSelected(selected === date ? null : date)}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[10px] uppercase text-ink-400">{dayNameBsShort(date)}</span>
                <DayCell
                  date={date}
                  entries={byDate.get(date) ?? []}
                  leave={leaveByDate.get(date)}
                  selected={selected === date}
                />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <button
              onClick={() => { setMonthYm(stepMonth(monthYm, -1)); setSelected(null); }}
              className="p-1 text-ink-500 transition hover:bg-paper-100 hover:text-navy-900"
              aria-label="Prethodni mjesec"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-ink-700">{monthLabel}</span>
            <button
              onClick={() => { setMonthYm(stepMonth(monthYm, 1)); setSelected(null); }}
              className="p-1 text-ink-500 transition hover:bg-paper-100 hover:text-navy-900"
              aria-label="Sljedeći mjesec"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1.5">
            {['pon', 'uto', 'sri', 'čet', 'pet', 'sub', 'ned'].map((d) => (
              <div key={d} className="text-center text-[10px] uppercase text-ink-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: mondayIndex(monthDays[0]) }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {monthDays.map((date) => (
              <button key={date} onClick={() => setSelected(selected === date ? null : date)}>
                <DayCell
                  date={date}
                  entries={byDate.get(date) ?? []}
                  leave={leaveByDate.get(date)}
                  selected={selected === date}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {detail ? <DayDetail date={detail.date} entries={detail.entries} leave={detail.leave} officerId={officerId} /> : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
        <LegendDot className="bg-navy-400" label="dnevna" />
        <LegendDot className="bg-navy-900" label="noćna" />
        <LegendDot className="bg-brass-300" label="godišnji" />
        <LegendDot className="bg-paper-300" label="slobodan dan" />
        <LegendDot className="bg-signal-warn-soft" label="bolovanje" />
        <LegendDot className="bg-paper-50 ring-1 ring-inset ring-paper-200" label="neraspoređen" />
      </div>

      {/* Sažetak sati za prikazani mjesec */}
      <div className="mt-4 border-t border-paper-200 pt-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="section-label">Sažetak · {monthLabel}</span>
          <span className="text-[11px] text-ink-400">{summary.shifts} smjena</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryTile icon={<Clock className="h-3.5 w-3.5" />} label="Radnih sati" value={`${summary.hours} h`} />
          <SummaryTile icon={<Moon className="h-3.5 w-3.5" />} label="Noćnih sati" value={`${summary.night} h`} />
          <SummaryTile
            icon={<CalendarOff className="h-3.5 w-3.5" />}
            label="Godišnji"
            value={`${summary.leaveCount.godisnji ?? 0} d`}
          />
          <SummaryTile
            icon={<CalendarOff className="h-3.5 w-3.5" />}
            label="Bolovanje"
            value={`${summary.leaveCount.bolovanje ?? 0} d`}
            tone={(summary.leaveCount.bolovanje ?? 0) > 0 ? 'warn' : undefined}
          />
        </div>
        {(summary.leaveCount.slobodan_dan ?? 0) > 0 ? (
          <div className="mt-2 text-[11px] text-ink-500">
            Slobodnih dana po odobrenju: {summary.leaveCount.slobodan_dan}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DayCell({
  date,
  entries,
  leave,
  selected,
}: {
  date: string;
  entries: DayEntry[];
  leave?: LeaveDay;
  selected: boolean;
}) {
  const isToday = date === DEMO_TODAY;
  const works = entries.length > 0 && !leave;
  const night = works && entries.some((e) => SHIFT_TIME[e.shift.kind].night);

  // Dnevna = svijetla plava, noćna = tamna plava s mjesecom: smjene se razlikuju
  // na prvi pogled, a odsustva imaju svoju boju (godišnji ≠ slobodan ≠ bolovanje).
  const tone = leave
    ? leave.kind === 'bolovanje'
      ? 'bg-signal-warn-soft text-signal-warn'
      : leave.kind === 'godisnji'
        ? 'bg-brass-300 text-brass-800'
        : 'bg-paper-300 text-ink-700'
    : night
      ? 'bg-navy-900 text-paper-50'
      : works
        ? 'bg-navy-400 text-paper-50'
        : 'bg-paper-50 text-ink-400 ring-1 ring-inset ring-paper-200';

  return (
    <div
      className={`relative flex h-9 w-full items-center justify-center text-xs font-medium transition ${tone} ${
        selected ? 'ring-2 ring-brass-600' : ''
      } ${isToday && !selected ? 'ring-1 ring-ink-500' : ''}`}
    >
      {date.slice(-2)}
      {night ? <Moon className="absolute left-0.5 top-0.5 h-2.5 w-2.5 opacity-70" /> : null}
      {works && entries.length > 1 ? (
        <span className="absolute right-0.5 top-0.5 text-[8px] opacity-80">2</span>
      ) : null}
    </div>
  );
}

function DayDetail({
  date,
  entries,
  leave,
  officerId,
}: {
  date: string;
  entries: DayEntry[];
  leave?: LeaveDay;
  officerId: string;
}) {
  return (
    <div className="mt-3 border border-paper-200 bg-paper-50 p-3">
      <div className="mb-2 text-xs font-medium text-ink-800">
        {dayNameBs(date)}, {formatBs(date)}
      </div>

      {leave ? (
        <div className="flex items-center gap-2 text-sm text-ink-700">
          <CalendarOff className="h-4 w-4 text-signal-warn" />
          {leave.label} — odobreno
        </div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-ink-500">Slobodan dan.</div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => {
            const partners = e.slot.assignedOfficerIds
              .filter((id) => id !== officerId)
              .map((id) => world.officers.find((o) => o.id === id)?.name)
              .filter(Boolean) as string[];
            const t = SHIFT_TIME[e.shift.kind];
            return (
              <li key={e.shift.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-800">
                    {e.shift.kind === 'I' ? 'I smjena' : 'II smjena'} · {t.label}
                  </span>
                  <span className="font-mono text-xs text-ink-500">
                    {t.hours} h{t.night ? ' (noćna)' : ''}
                  </span>
                </div>
                <DetailRow icon={<MapPin className="h-3.5 w-3.5" />} label="Uloga">
                  {e.slot.callSign ?? '—'}
                </DetailRow>
                <DetailRow icon={<Users className="h-3.5 w-3.5" />} label="Partner">
                  {partners.length > 0 ? partners.join(', ') : 'samostalno'}
                </DetailRow>
                {e.slot.vehiclePlate ? (
                  <DetailRow icon={<Car className="h-3.5 w-3.5" />} label="Vozilo">
                    {e.slot.vehiclePlate}
                  </DetailRow>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-ink-400">{icon}</span>
      <span className="w-14 text-ink-500">{label}</span>
      <span className="flex-1 text-ink-800">{children}</span>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'warn';
}) {
  return (
    <div className={`border border-paper-200 p-2 ${tone === 'warn' ? 'bg-signal-warn/10' : 'bg-paper-50'}`}>
      <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-400">
        {icon}
        {label}
      </div>
      <div className={`font-mono text-sm font-medium tabular-nums ${tone === 'warn' ? 'text-signal-warn' : 'text-ink-800'}`}>
        {value}
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 ${className}`} />
      {label}
    </span>
  );
}
