import { useMemo } from 'react';
import { Car, Bike, Zap, Wrench, AlertTriangle } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { formatBs } from '../../data/generator/dates';

export function N04Oprema() {
  const world = useScopedWorld();

  const byPs = useMemo(() => {
    const pss = world.orgNodes.filter((n) => n.kind === 'ps');
    return pss.map((ps) => {
      const vehicles = world.vehicles.filter((v) => v.psId === ps.id);
      const auto = vehicles.filter((v) => v.kind === 'auto');
      const moto = vehicles.filter((v) => v.kind === 'motocikl');
      const bicikl = vehicles.filter((v) => v.kind === 'bicikl');
      return { ps, vehicles, auto, moto, bicikl };
    });
  }, [world]);

  const allWarnings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const in30ISO = in30.toISOString().slice(0, 10);
    return world.vehicles.flatMap((v) => {
      const w: string[] = [];
      if (v.registrationDue && v.registrationDue < today) w.push(`${v.plate} — registracija istekla`);
      else if (v.registrationDue && v.registrationDue < in30ISO) w.push(`${v.plate} — registracija ističe ${formatBs(v.registrationDue)}`);
      if (v.serviceDue && v.serviceDue < today) w.push(`${v.plate} — servis prekoračen`);
      return w;
    });
  }, [world.vehicles]);

  const tonightAvailable = world.vehicles.filter((v) => v.kind === 'auto' && v.status === 'ispravno').length;
  const tonightTotal = world.vehicles.filter((v) => v.kind === 'auto').length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-wider text-ink-400">Oprema i vozni park</div>
        <h1 className="mt-0.5 text-2xl font-heading font-medium text-ink-800">Stanje resursa</h1>
      </header>

      <div className="mb-6  bg-gradient-to-br from-navy-900 to-navy-700 p-5 text-paper-50 ">
        <div className="text-xs uppercase tracking-wider text-ink-200">Večeras raspoloživo</div>
        <div className="mt-1 text-3xl font-semibold">
          {tonightAvailable}
          <span className="text-lg font-normal text-ink-200">/{tonightTotal} vozila</span>
        </div>
        <div className="mt-1 text-xs text-ink-200">
          Jedan klik umjesto sedmice telefoniranja. Ovaj prikaz je dokument dovoljan za budžetski zahtjev.
        </div>
      </div>

      {allWarnings.length > 0 && (
        <div className="mb-6  bg-paper-0 p-4 border ring-signal-warn/30">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-signal-warn">
            <AlertTriangle className="h-4 w-4" /> Upozorenja
          </div>
          <ul className="space-y-1 text-xs">
            {allWarnings.slice(0, 6).map((w, i) => (
              <li key={i} className=" bg-signal-warn/10 px-3 py-2 text-signal-warn">{w}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="space-y-4">
        {byPs.map(({ ps, auto, moto, bicikl }) => (
          <div key={ps.id} className=" bg-paper-0 p-5 border border-paper-200">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-heading font-medium text-ink-800">{ps.name}</h2>
              <span className="text-[11px] text-ink-500">
                {auto.length} + {moto.length} + {bicikl.length}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <FleetGroup label="Auta" icon={<Car className="h-4 w-4" />} vehicles={auto} />
              <FleetGroup label="Motocikli" icon={<Zap className="h-4 w-4" />} vehicles={moto} />
              <FleetGroup label="Bicikli" icon={<Bike className="h-4 w-4" />} vehicles={bicikl} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function FleetGroup({
  label,
  icon,
  vehicles,
}: {
  label: string;
  icon: React.ReactNode;
  vehicles: ReturnType<typeof useScopedWorld>['vehicles'];
}) {
  const ok = vehicles.filter((v) => v.status === 'ispravno').length;
  const servis = vehicles.filter((v) => v.status === 'servis').length;
  return (
    <div className=" bg-paper-50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-500">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1 text-xl font-heading font-medium text-ink-800">
        {ok}
        <span className="text-xs font-normal text-ink-500">/{vehicles.length}</span>
      </div>
      {servis > 0 ? (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-signal-warn">
          <Wrench className="h-3 w-3" /> {servis} u servisu
        </div>
      ) : (
        <div className="mt-1 text-[11px] text-ink-400">svi ispravni</div>
      )}
    </div>
  );
}
