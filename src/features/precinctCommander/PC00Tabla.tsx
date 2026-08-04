import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Car, Crosshair, AlertTriangle, Inbox, CalendarRange, Clock, ChevronRight, ShieldCheck } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { useStore } from '../../app/store';
import { SHIFT_TIME, type OfficerStatus } from '../../data/types';
import { DEMO_TODAY, dayNameBs, formatBs } from '../../data/generator/dates';
import { establishmentUnder } from '../../data/generator/org';

// PC00 — komandirska tabla. Za razliku od načelnikove (N01, agregatna),
// ovdje je sve konkretno: ko je večeras na terenu, šta fali, šta zahtijeva odluku.

export function PC00Tabla() {
  const w = useScopedWorld();
  const session = useSession();
  const store = useStore();

  const stats = useMemo(() => {
    const total = w.officers.length;
    const by = (st: OfficerStatus) => w.officers.filter((o) => o.status === st).length;
    const establishment = establishmentUnder(w.orgNodes, session.scopeNodeId);
    return {
      total,
      establishment,
      vacancies: Math.max(0, establishment - total),
      aktivan: by('aktivan'),
      godisnji: by('godisnji'),
      bolovanje: by('bolovanje'),
    };
  }, [w.officers, w.orgNodes, session.scopeNodeId]);

  const tonight = useMemo(
    () => w.shifts.find((s) => s.date === DEMO_TODAY && s.kind === 'II'),
    [w.shifts],
  );
  const tonightOfficers = tonight?.slots.reduce((s, sl) => s + sl.assignedOfficerIds.length, 0) ?? 0;
  const underfilled = tonight?.slots.filter((sl) => sl.assignedOfficerIds.length < sl.capacity) ?? [];

  const fleet = useMemo(() => {
    const vs = w.vehicles.filter((v) => v.kind === 'auto');
    return { total: vs.length, ok: vs.filter((v) => v.status === 'ispravno').length };
  }, [w.vehicles]);

  const certAlarms = useMemo(() => {
    const soon = new Date(DEMO_TODAY);
    soon.setDate(soon.getDate() + 30);
    const soonIso = soon.toISOString().slice(0, 10);
    let expired = 0;
    let expiring = 0;
    for (const o of w.officers)
      for (const c of o.certifications) {
        if (!c.expires) continue;
        if (c.expires < DEMO_TODAY) expired += 1;
        else if (c.expires < soonIso) expiring += 1;
      }
    return { expired, expiring };
  }, [w.officers]);

  const pendingRequests = useMemo(
    () =>
      store.leaveRequests.filter(
        (r) => r.status === 'u_toku' && r.approvalChain.find((s) => s.status === 'ceka')?.role === 'komandir',
      ).length,
    [store.leaveRequests],
  );

  const equipMissing = w.officers.filter((o) => !o.equipmentAssigned.some((e) => e.type === 'prsluk')).length;

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Komandna tabla</div>
        <h1 className="font-heading text-2xl text-ink-800">{session.scopeLabel}</h1>
      </div>
      <p className="mb-5 mt-1 text-sm text-ink-500">
        {dayNameBs(DEMO_TODAY)}, {formatBs(DEMO_TODAY)} · stanje stanice i šta traži odluku
      </p>

      {/* Ključni brojevi */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi icon={<Users className="h-4 w-4" />} label="Ljudstvo" value={`${stats.total}/${stats.establishment}`}
          foot={stats.vacancies > 0 ? `${stats.vacancies} upražnjeno` : 'popunjeno'} tone={stats.vacancies > 5 ? 'warn' : undefined} />
        <Kpi icon={<ShieldCheck className="h-4 w-4" />} label="Na raspolaganju" value={String(stats.aktivan)}
          foot={`godišnji ${stats.godisnji} · bolovanje ${stats.bolovanje}`} />
        <Kpi icon={<Clock className="h-4 w-4" />} label="Večeras na terenu" value={String(tonightOfficers)}
          foot={`II smjena · ${SHIFT_TIME.II.label}`} tone={underfilled.length > 0 ? 'alarm' : undefined} />
        <Kpi icon={<Car className="h-4 w-4" />} label="Vozila" value={`${fleet.ok}/${fleet.total}`}
          foot={fleet.ok < fleet.total ? `${fleet.total - fleet.ok} u servisu` : 'sva ispravna'} />
        <Kpi icon={<Inbox className="h-4 w-4" />} label="Zahtjevi za odluku" value={String(pendingRequests)}
          foot="čeka komandira" tone={pendingRequests > 0 ? 'warn' : undefined} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sastav večerašnje smjene */}
        <section className="border border-paper-200 bg-paper-0">
          <div className="flex items-center justify-between border-b border-paper-200 px-5 py-3">
            <span className="section-label">Sastav večerašnje smjene</span>
            <Link to="/komandir/raspored" className="flex items-center gap-1 text-[11px] text-ink-500 hover:text-brass-600">
              Raspored <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {!tonight ? (
            <div className="px-5 py-8 text-sm text-ink-500">Nema generisane smjene za danas.</div>
          ) : (
            <ul className="divide-y divide-paper-100">
              {tonight.slots.map((sl) => {
                const under = sl.assignedOfficerIds.length < sl.capacity;
                return (
                  <li key={sl.id} className="flex items-center justify-between px-5 py-2">
                    <span className="text-sm text-ink-800">{sl.callSign}</span>
                    <span className={`font-mono text-xs ${under ? 'text-signal-alarm' : 'text-ink-500'}`}>
                      {sl.assignedOfficerIds.length}/{sl.capacity}
                      {sl.vehiclePlate ? ` · ${sl.vehiclePlate}` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Šta traži pažnju */}
        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <span className="section-label">Traži pažnju</span>
          </div>
          <ul className="divide-y divide-paper-100">
            {underfilled.map((sl) => (
              <Alarm key={sl.id} tone="alarm" icon={<AlertTriangle className="h-3.5 w-3.5" />}
                text={`${sl.callSign} nije popunjena (${sl.assignedOfficerIds.length}/${sl.capacity}) u večerašnjoj smjeni.`} />
            ))}
            {certAlarms.expired > 0 ? (
              <Alarm tone="alarm" icon={<AlertTriangle className="h-3.5 w-3.5" />}
                text={`${certAlarms.expired} isteklih certifikata — ti policajci ne mogu na uloge koje ih traže.`}
                to="/komandir/ljudstvo" />
            ) : null}
            {certAlarms.expiring > 0 ? (
              <Alarm tone="warn" icon={<Clock className="h-3.5 w-3.5" />}
                text={`${certAlarms.expiring} certifikata ističe u narednih 30 dana.`} to="/komandir/ljudstvo" />
            ) : null}
            {fleet.ok < fleet.total ? (
              <Alarm tone="warn" icon={<Car className="h-3.5 w-3.5" />}
                text={`${fleet.total - fleet.ok} vozila u servisu — provjeri raspored patrola.`} to="/komandir/oprema" />
            ) : null}
            {equipMissing > 0 ? (
              <Alarm tone="warn" icon={<Crosshair className="h-3.5 w-3.5" />}
                text={`${equipMissing} policajaca nema zadužen balistički prsluk.`} to="/komandir/oprema" />
            ) : null}
            {pendingRequests > 0 ? (
              <Alarm tone="warn" icon={<Inbox className="h-3.5 w-3.5" />}
                text={`${pendingRequests} zahtjev(a) čeka tvoju odluku.`} to="/komandir/odobrenja" />
            ) : null}
            {underfilled.length === 0 && certAlarms.expired === 0 && fleet.ok === fleet.total && pendingRequests === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-ink-500">Nema otvorenih stavki.</li>
            ) : null}
          </ul>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Quick to="/komandir/ljudstvo" icon={<Users className="h-3.5 w-3.5" />}>Ljudstvo</Quick>
        <Quick to="/komandir/oprema" icon={<Crosshair className="h-3.5 w-3.5" />}>Naoružanje i oprema</Quick>
        <Quick to="/komandir/raspored" icon={<CalendarRange className="h-3.5 w-3.5" />}>Mjesečni raspored</Quick>
        <Quick to="/komandir/odobrenja" icon={<Inbox className="h-3.5 w-3.5" />}>Odobrenja</Quick>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, foot, tone }: { icon: React.ReactNode; label: string; value: string; foot: string; tone?: 'warn' | 'alarm' }) {
  const bar = tone === 'alarm' ? 'bg-signal-alarm' : tone === 'warn' ? 'bg-signal-warn' : '';
  const txt = tone === 'alarm' ? 'text-signal-alarm' : tone === 'warn' ? 'text-signal-warn' : 'text-ink-800';
  return (
    <div className="relative overflow-hidden border border-paper-200 bg-paper-0 p-4">
      {tone ? <span className={`absolute left-0 top-0 h-full w-[3px] ${bar}`} /> : null}
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-ink-500">{icon}</span>
        <div className="section-label">{label}</div>
      </div>
      <div className={`font-mono text-2xl font-medium tabular-nums ${txt}`}>{value}</div>
      <div className="mt-1 text-[11px] text-ink-500">{foot}</div>
    </div>
  );
}

function Alarm({ tone, icon, text, to }: { tone: 'warn' | 'alarm'; icon: React.ReactNode; text: string; to?: string }) {
  const cls = tone === 'alarm' ? 'text-signal-alarm' : 'text-signal-warn';
  const body = (
    <span className="flex items-start gap-2 px-5 py-2.5 text-sm">
      <span className={`mt-0.5 flex-none ${cls}`}>{icon}</span>
      <span className="flex-1 text-ink-700">{text}</span>
      {to ? <ChevronRight className="mt-0.5 h-3.5 w-3.5 flex-none text-paper-400" /> : null}
    </span>
  );
  return <li>{to ? <Link to={to} className="block transition hover:bg-paper-50">{body}</Link> : body}</li>;
}

function Quick({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 border border-paper-300 bg-paper-0 px-3 py-2 text-sm text-ink-700 transition hover:border-brass-500 hover:text-navy-900"
    >
      {icon}
      {children}
    </Link>
  );
}
