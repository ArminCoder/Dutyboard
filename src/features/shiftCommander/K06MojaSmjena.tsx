import { useMemo } from 'react';
import { Users, Car, MapPin, Info } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useSession } from '../../app/RoleContext';
import { SHIFT_TIME, RANK_LABEL, type Shift } from '../../data/types';
import { DEMO_TODAY, dayNameBs, formatBs } from '../../data/generator/dates';

// K06 — pregled vlastite smjene. Šef smjene ne pravi raspored (to radi komandir);
// on vidi ko mu je večeras dodijeljen, na kojoj ulozi i s kojim vozilom.

export function K06MojaSmjena() {
  const w = useScopedWorld();
  const session = useSession();

  const shift: Shift | undefined = useMemo(
    () => w.shifts.find((s) => s.date === DEMO_TODAY && s.kind === 'II'),
    [w.shifts],
  );

  const roleName = (roleId: string) => w.operationalRoles.find((r) => r.id === roleId)?.name ?? roleId;
  const officer = (id: string) => w.officers.find((o) => o.id === id);

  const total = shift?.slots.reduce((s, sl) => s + sl.assignedOfficerIds.length, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-1">
        <div className="section-label text-brass-600">Moja smjena</div>
        <h1 className="font-heading text-2xl text-ink-800">
          {dayNameBs(DEMO_TODAY)}, {formatBs(DEMO_TODAY)} · II smjena
        </h1>
      </div>
      <p className="mb-5 mt-1 text-sm text-ink-500">
        {session.scopeLabel} · {SHIFT_TIME.II.label} · {total} policajaca u smjeni
      </p>

      <div className="mb-4 flex items-start gap-2 border border-paper-200 bg-paper-0 px-4 py-2.5 text-xs text-ink-500">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
        <span>
          Raspored za mjesec pravi komandir stanice. Ovdje vidiš svoju smjenu — raspoređivanje unutar
          smjene i evidencija događaja idu kroz Aktivnu smjenu i Knjigu događaja.
        </span>
      </div>

      {!shift ? (
        <div className="border border-paper-200 bg-paper-0 px-5 py-10 text-center text-sm text-ink-500">
          Za ovaj datum nema generisane smjene u demou.
        </div>
      ) : (
        <div className="space-y-3">
          {shift.slots.map((slot) => {
            const assigned = slot.assignedOfficerIds.map(officer).filter(Boolean);
            const underfilled = assigned.length < slot.capacity;
            return (
              <section key={slot.id} className="border border-paper-200 bg-paper-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-200 px-5 py-3">
                  <div>
                    <div className="font-heading text-base text-ink-800">
                      {slot.callSign ?? roleName(slot.requiredRoleId)}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
                      <span>{roleName(slot.requiredRoleId)}</span>
                      {slot.vehiclePlate ? (
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {slot.vehiclePlate}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          pješice
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      underfilled ? 'bg-signal-alarm/15 text-signal-alarm' : 'bg-signal-ok/15 text-signal-ok'
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    {assigned.length}/{slot.capacity}
                  </span>
                </div>
                {assigned.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-signal-alarm">Slot nije popunjen.</div>
                ) : (
                  <ul className="divide-y divide-paper-100">
                    {assigned.map((o) => (
                      <li key={o!.id} className="flex items-center gap-3 px-5 py-2.5">
                        <div className="flex h-8 w-8 flex-none items-center justify-center bg-navy-900 text-[11px] font-medium text-paper-50">
                          {o!.name.split(' ').map((p) => p[0]).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-ink-800">{o!.name}</div>
                          <div className="text-[11px] text-ink-500">{RANK_LABEL[o!.rank]}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
