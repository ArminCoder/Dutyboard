import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Layers, Megaphone, AlertTriangle, X, Info } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { checkEligibility, seasonWarningForRole, slotUnderfilled } from '../../domain/eligibility';
import type { Officer, Shift, ShiftSlot } from '../../data/types';
import { addDays, dayNameBs, dayNameBsShort, formatBs, monthNameBs } from '../../data/generator/dates';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';

const MONTHS_BS_LONG = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];

interface SlotFocus {
  shift: Shift;
  slot: ShiftSlot;
}

export function K01Raspored() {
  const world = useScopedWorld();
  const [monthYm, setMonthYm] = useState('2026-08');
  const [focus, setFocus] = useState<SlotFocus | null>(null);
  const [publishToast, setPublishToast] = useState(false);

  const monthDays = useMemo(() => enumerateMonth(monthYm), [monthYm]);
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of world.shifts) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [world.shifts]);

  const seasonWarnings = useMemo(() => {
    const anyDate = `${monthYm}-15`;
    const warnings: string[] = [];
    for (const role of world.operationalRoles) {
      const w = seasonWarningForRole(role, anyDate);
      if (w) warnings.push(w);
    }
    return warnings;
  }, [world.operationalRoles, monthYm]);

  const stepMonth = (dir: number) => {
    const [y, m] = monthYm.split('-').map(Number);
    let ny = y;
    let nm = m + dir;
    if (nm < 1) { nm = 12; ny -= 1; }
    if (nm > 12) { nm = 1; ny += 1; }
    setMonthYm(`${ny}-${String(nm).padStart(2, '0')}`);
  };

  const nightAlarmCount = countNightInterventnaAlarms(world.shifts, monthYm);

  return (
    <div className="relative flex h-[calc(100vh-49px)] flex-col lg:h-screen">
      <header className="border-b border-paper-200 bg-paper-0 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3">
          <div>
            <div className="section-label mb-1 text-brass-600">Mjesečni raspored · PS Centar</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepMonth(-1)}
                className="border border-paper-300 bg-paper-0 p-1.5 text-ink-600 transition hover:border-navy-700"
                aria-label="Prethodni mjesec"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h1 className="font-heading text-2xl text-ink-800">
                {MONTHS_BS_LONG[Number(monthYm.slice(5, 7)) - 1]}{' '}
                <span className="text-ink-500">{monthYm.slice(0, 4)}.</span>
              </h1>
              <button
                onClick={() => stepMonth(1)}
                className="border border-paper-300 bg-paper-0 p-1.5 text-ink-600 transition hover:border-navy-700"
                aria-label="Sljedeći mjesec"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 h-[2px] w-12 bg-brass-500" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={<Layers className="h-4 w-4" />}>Šablon sedmice</Button>
            <Button
              variant="primary"
              icon={<Megaphone className="h-4 w-4" />}
              onClick={() => {
                setPublishToast(true);
                setTimeout(() => setPublishToast(false), 2500);
              }}
            >
              Objavi raspored
            </Button>
          </div>
        </div>
      </header>

      {seasonWarnings.length > 0 && (
        <div className="border-b border-signal-warn/40 bg-signal-warn-soft px-6 py-2.5 text-sm text-signal-warn">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-none" />
            {seasonWarnings[0]}
          </div>
        </div>
      )}

      {nightAlarmCount > 0 && (
        <div className="border-b border-signal-alarm/40 bg-signal-alarm-soft px-6 py-2.5 text-sm text-signal-alarm">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-none" />
            {nightAlarmCount === 1
              ? 'Jedna noćna smjena bez interventne — minimum popune ispod praga.'
              : `${nightAlarmCount} noćnih smjena bez interventne — minimum popune ispod praga.`}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-paper-50">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="border border-paper-200 bg-paper-0">
            <div className="grid grid-cols-[110px_1fr_1fr] items-center border-b border-paper-200 bg-paper-100 px-4 py-2.5">
              <div className="section-label">Dan</div>
              <div className="section-label">I smjena · 07:00 – 19:00</div>
              <div className="section-label">II smjena · 19:00 – 07:00</div>
            </div>

            {monthDays.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="text-sm font-medium text-ink-700">Raspored za ovaj mjesec nije generisan u demou</div>
                <div className="mt-1 max-w-md text-xs text-ink-500">
                  U produkciji šef smjene koristi Šablon sedmice ili ručno popunjava. Za demo je pun raspored generisan samo za avgust 2026.
                </div>
              </div>
            ) : null}

            {monthDays.map((date) => {
              const shifts = shiftsByDate.get(date) ?? [];
              const shiftI = shifts.find((s) => s.kind === 'I');
              const shiftII = shifts.find((s) => s.kind === 'II');
              const isWeekend = ['sub', 'ned'].includes(dayNameBsShort(date));
              return (
                <div
                  key={date}
                  className={`grid grid-cols-[110px_1fr_1fr] items-stretch border-t border-paper-200 first:border-t-0 hover:bg-paper-50/70 ${
                    isWeekend ? 'bg-paper-100/40' : ''
                  }`}
                >
                  <div className="flex flex-col justify-center border-r border-paper-200 px-4 py-3">
                    <div className="section-label text-ink-400">{dayNameBsShort(date)}</div>
                    <div className="mt-0.5 font-heading text-3xl leading-none text-ink-800">{date.slice(-2)}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">{monthNameBs(Number(date.slice(5, 7)) - 1).slice(0, 3)}</div>
                  </div>
                  <ShiftCell shift={shiftI ?? null} world={world} onSlotClick={setFocus} />
                  <ShiftCell shift={shiftII ?? null} world={world} onSlotClick={setFocus} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {focus && <SlotDrawer focus={focus} world={world} onClose={() => setFocus(null)} />}

      {publishToast && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="border border-brass-500 bg-navy-900 px-4 py-2 text-sm text-paper-50 ">
            Raspored objavljen — svi policajci primili obavještenje.
          </div>
        </div>
      )}
    </div>
  );
}

function ShiftCell({
  shift,
  world,
  onSlotClick,
}: {
  shift: Shift | null;
  world: ReturnType<typeof useScopedWorld>;
  onSlotClick: (f: SlotFocus) => void;
}) {
  if (!shift) {
    return <div className="border-l border-paper-200 px-3 py-3 text-xs text-paper-400">—</div>;
  }
  return (
    <div className="flex flex-wrap items-start gap-1.5 border-l border-paper-200 px-3 py-3">
      {shift.slots.map((slot) => (
        <SlotTag key={slot.id} shift={shift} slot={slot} world={world} onClick={() => onSlotClick({ shift, slot })} />
      ))}
    </div>
  );
}

function SlotTag({
  shift,
  slot,
  world,
  onClick,
}: {
  shift: Shift;
  slot: ShiftSlot;
  world: ReturnType<typeof useScopedWorld>;
  onClick: () => void;
}) {
  const role = world.operationalRoles.find((r) => r.id === slot.requiredRoleId);
  const label = role ? shortRoleLabel(role.name) : slot.requiredRoleId;
  const filled = slot.assignedOfficerIds.length;
  const under = slotUnderfilled(slot);
  const isInterventnaNight = shift.kind === 'II' && slot.requiredRoleId.endsWith(':interventna');
  const alarm = under && isInterventnaNight && filled === 0;

  const cls = alarm
    ? 'border-signal-alarm bg-signal-alarm-soft text-signal-alarm hover:bg-signal-alarm/10'
    : under
    ? 'border-signal-warn bg-signal-warn-soft text-signal-warn hover:bg-signal-warn/10'
    : 'border-paper-300 bg-paper-0 text-ink-700 hover:border-navy-700 hover:bg-paper-100';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[11px] font-medium transition ${cls}`}
      title={`${role?.name ?? label} · ${filled}/${slot.capacity}`}
    >
      <span className="uppercase tracking-wider">{label}</span>
      <span className="font-mono tabular-nums text-[10px]">
        {filled}/{slot.capacity}
      </span>
    </button>
  );
}

function shortRoleLabel(name: string): string {
  if (name === 'Auto-patrola') return 'Auto';
  if (name === 'Interventna') return 'Interv.';
  if (name === 'Moto patrola') return 'Moto';
  if (name === 'Pješačka patrola') return 'Pješ.';
  if (name === 'Bicikl patrola') return 'Bicikl';
  if (name === 'Civilna patrola') return 'Civ.';
  return name;
}

function SlotDrawer({
  focus,
  world,
  onClose,
}: {
  focus: SlotFocus;
  world: ReturnType<typeof useScopedWorld>;
  onClose: () => void;
}) {
  const role = world.operationalRoles.find((r) => r.id === focus.slot.requiredRoleId);
  const assigned = focus.slot.assignedOfficerIds
    .map((id) => world.officers.find((o) => o.id === id))
    .filter(Boolean) as Officer[];

  const others = world.officers.filter((o) => !focus.slot.assignedOfficerIds.includes(o.id));
  const evaluated = others.map((o) => ({
    officer: o,
    result: checkEligibility({ officer: o, slot: focus.slot, shift: focus.shift, world }),
  }));
  const eligible = evaluated.filter((e) => e.result.eligible);
  const ineligible = evaluated.filter((e) => !e.result.eligible);

  const seasonWarn = role ? seasonWarningForRole(role, focus.shift.date) : null;

  return (
    <div className="fixed inset-0 z-30 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-navy-900/40 " onClick={onClose} />
      <aside className="flex w-full max-w-md flex-col border-l border-paper-200 bg-paper-0">
        <header className="border-b border-paper-200 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="section-label text-brass-600">
                {focus.shift.kind === 'I' ? 'I smjena · 07:00 – 19:00' : 'II smjena · 19:00 – 07:00'}
              </div>
              <h2 className="mt-1 font-heading text-2xl text-ink-800">{role?.name ?? focus.slot.requiredRoleId}</h2>
              <div className="mt-1 text-xs text-ink-500">
                {dayNameBs(focus.shift.date)}, {formatBs(focus.shift.date)}
                {focus.slot.callSign ? ` · ${focus.slot.callSign}` : ''}
              </div>
              <div className="mt-3 h-[2px] w-10 bg-brass-500" />
            </div>
            <button onClick={onClose} className="border border-paper-300 p-1.5 text-ink-500 hover:border-navy-700" aria-label="Zatvori">
              <X className="h-4 w-4" />
            </button>
          </div>
          {seasonWarn && (
            <div className="mt-4 flex items-start gap-2 border border-signal-warn/40 bg-signal-warn-soft px-3 py-2 text-xs text-signal-warn">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {seasonWarn}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <Section
            eyebrow="Trenutno raspoređeni"
            right={`${assigned.length}/${focus.slot.capacity}`}
          >
            {assigned.length === 0 ? (
              <div className="border border-dashed border-paper-300 px-3 py-4 text-center text-xs text-ink-400">
                Nema raspoređenih.
              </div>
            ) : (
              <ul className="divide-y divide-paper-200 border border-paper-200 bg-paper-0">
                {assigned.map((o) => (
                  <li key={o.id} className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm font-medium text-ink-800">{o.name}</span>
                    <span className="text-xs text-ink-500">{o.rank.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section eyebrow="Dostupni" right={String(eligible.length)}>
            {eligible.length === 0 ? (
              <div className="border border-dashed border-paper-300 px-3 py-4 text-center text-xs text-ink-400">
                Nema dostupnih kandidata za ovaj slot.
              </div>
            ) : (
              <ul className="divide-y divide-signal-ok/20 border border-signal-ok/30">
                {eligible.slice(0, 12).map(({ officer }) => (
                  <li
                    key={officer.id}
                    className="flex items-center justify-between bg-signal-ok-soft/30 px-3 py-2 transition hover:bg-signal-ok-soft"
                  >
                    <span className="text-sm text-ink-800">{officer.name}</span>
                    <StatusBadge tone="ok" size="sm">dostupan</StatusBadge>
                  </li>
                ))}
                {eligible.length > 12 && (
                  <li className="bg-paper-50 px-3 py-2 text-center text-[11px] text-ink-400">
                    +{eligible.length - 12} više
                  </li>
                )}
              </ul>
            )}
          </Section>

          <Section eyebrow="Nedostupni" right={String(ineligible.length)}>
            <ul className="divide-y divide-paper-200 border border-paper-200">
              {ineligible.slice(0, 15).map(({ officer, result }) => (
                <li
                  key={officer.id}
                  className="flex items-center justify-between bg-paper-50/60 px-3 py-2"
                  title={result.reason}
                >
                  <span className="truncate text-sm text-ink-500">{officer.name}</span>
                  <span className="ml-2 flex-none border border-paper-300 bg-paper-0 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-600">
                    {result.reason}
                  </span>
                </li>
              ))}
              {ineligible.length > 15 && (
                <li className="bg-paper-50 px-3 py-2 text-center text-[11px] text-ink-400">
                  +{ineligible.length - 15} više
                </li>
              )}
            </ul>
          </Section>

          <div className="mt-6 flex items-start gap-2 border border-paper-200 bg-paper-100 p-3 text-[11px] text-ink-600">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
            Sistem prijavljuje razlog za svakog nedostupnog. U produkciji klik „Rasporedi" gura oficira u slot i logira u dnevnik smjene.
          </div>
        </div>
      </aside>
    </div>
  );
}

function Section({
  eyebrow,
  right,
  children,
}: {
  eyebrow: string;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="section-label">{eyebrow}</div>
        {right ? <div className="font-mono text-xs tabular-nums text-ink-500">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function enumerateMonth(ym: string): string[] {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0).getDate();
  const dates: string[] = [];
  const firstISO = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01`;
  for (let i = 0; i < last; i++) dates.push(addDays(firstISO, i));
  return dates;
}

function countNightInterventnaAlarms(shifts: Shift[], monthYm: string): number {
  let count = 0;
  for (const s of shifts) {
    if (!s.date.startsWith(monthYm)) continue;
    if (s.kind !== 'II') continue;
    const int = s.slots.find((sl) => sl.requiredRoleId.endsWith(':interventna'));
    if (int && int.assignedOfficerIds.length === 0) count++;
  }
  return count;
}
