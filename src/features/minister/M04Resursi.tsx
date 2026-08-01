import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Printer, Car, ShieldCheck, Users, Plane, Truck, Bike } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { descendantsOf, establishmentUnder } from '../../data/generator/org';
import { VEHICLE_KIND_LABEL, type Vehicle } from '../../data/types';
import { Button } from '../../components/Button';
import { CHART_COLORS, CHART_TICK, CHART_TOOLTIP, CHART_TOOLTIP_LABEL } from '../../components/chartTheme';

// M04 — resursi i oprema. Ministarski nivo: zbirno po upravama, bez ličnih podataka.

export function M04Resursi() {
  const w = useScopedWorld();

  const data = useMemo(() => {
    const pus = w.orgNodes.filter((n) => n.kind === 'pu');

    const byPu = pus.map((pu) => {
      const inScope = descendantsOf(w.orgNodes, pu.id);
      const vehicles = w.vehicles.filter((v) => inScope.has(v.psId));
      const officers = w.officers.filter((o) => inScope.has(o.orgNodeId));
      const establishment = establishmentUnder(w.orgNodes, pu.id);
      return {
        node: pu,
        auto: vehicles.filter((v) => v.kind === 'auto').length,
        motocikl: vehicles.filter((v) => v.kind === 'motocikl').length,
        bicikl: vehicles.filter((v) => v.kind === 'bicikl').length,
        ispravno: vehicles.filter((v) => v.status === 'ispravno').length,
        ukupno: vehicles.length,
        officers: officers.length,
        establishment,
        fillPct: establishment > 0 ? Math.round((officers.length / establishment) * 100) : 0,
      };
    });

    // Kantonalni resursi — ne pripadaju nijednoj PU.
    const kantonAssets = w.vehicles.filter((v) => v.kind === 'helikopter' || v.kind === 'specijalno');

    const totalVehicles = w.vehicles.length;
    const totalOk = w.vehicles.filter((v) => v.status === 'ispravno').length;
    const totalOfficers = w.officers.length;
    const totalEstablishment = establishmentUnder(w.orgNodes, 'mup');

    return { byPu, kantonAssets, totalVehicles, totalOk, totalOfficers, totalEstablishment };
  }, [w]);

  const fleetChart = data.byPu.map((r) => ({
    label: r.node.name.replace('PU ', ''),
    Automobili: r.auto,
    Motocikli: r.motocikl,
    Bicikli: r.bicikl,
  }));

  const staffChart = data.byPu.map((r) => ({
    label: r.node.name.replace('PU ', ''),
    Stvarno: r.officers,
    Sistematizacija: r.establishment,
  }));

  const fleetPct = Math.round((data.totalOk / data.totalVehicles) * 100);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 print:py-0">
      <div className="mb-6 flex items-start justify-between print:hidden">
        <div>
          <div className="section-label text-brass-600">Resursi i oprema</div>
          <h1 className="font-heading text-2xl text-ink-800">Materijalni i ljudski resursi Uprave policije</h1>
        </div>
        <Button variant="primary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
          Izvezi u PDF
        </Button>
      </div>

      <div className="mb-6 border-l-2 border-brass-500 bg-paper-0 px-4 py-2.5 text-xs text-ink-600">
        Klasifikacija: <span className="font-medium">INTERNO</span> — prikazuju se isključivo zbirni podaci
        o resursima, bez ličnih podataka policajaca i bez operativnih detalja.
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Car className="h-4 w-4" />} label="Vozni park" value={String(data.totalVehicles)} foot={`${data.totalOk} ispravno (${fleetPct}%)`} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Policijski službenici" value={String(data.totalOfficers)} foot={`sistematizacija ${data.totalEstablishment}`} />
        <Kpi icon={<Plane className="h-4 w-4" />} label="Zračna podrška" value="1" foot="helikopter (Uprava)" />
        <Kpi icon={<ShieldCheck className="h-4 w-4" />} label="Specijalna vozila" value={String(data.kantonAssets.filter((v) => v.kind === 'specijalno').length)} foot="posebna jedinica" />
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Vozni park po upravama</div>
            <div className="font-heading text-base text-ink-800">Struktura vozila</div>
          </div>
          <div className="px-4 py-5">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fleetChart} margin={{ top: 4, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                  <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} cursor={{ fill: 'rgba(184,147,90,0.08)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Automobili" stackId="a" fill={CHART_COLORS.primary} />
                  <Bar dataKey="Motocikli" stackId="a" fill={CHART_COLORS.tertiary} />
                  <Bar dataKey="Bicikli" stackId="a" fill={CHART_COLORS.secondary} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="border border-paper-200 bg-paper-0">
          <div className="border-b border-paper-200 px-5 py-3">
            <div className="section-label text-brass-600">Ljudstvo prema sistematizaciji</div>
            <div className="font-heading text-base text-ink-800">Stvarno stanje vs. planirano</div>
          </div>
          <div className="px-4 py-5">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffChart} margin={{ top: 4, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                  <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} cursor={{ fill: 'rgba(184,147,90,0.08)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Sistematizacija" fill={CHART_COLORS.tertiary} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Stvarno" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      <section className="mb-6 border border-paper-200 bg-paper-0">
        <div className="border-b border-paper-200 px-5 py-3">
          <div className="section-label text-brass-600">Pregled po upravama</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-left text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-5 py-2.5 font-medium">Uprava</th>
                <th className="px-3 py-2.5 font-medium">Policajci</th>
                <th className="px-3 py-2.5 font-medium">Popunjenost</th>
                <th className="px-3 py-2.5 font-medium">Automobili</th>
                <th className="px-3 py-2.5 font-medium">Motocikli</th>
                <th className="px-3 py-2.5 font-medium">Bicikli</th>
                <th className="px-3 py-2.5 font-medium">Ispravno</th>
              </tr>
            </thead>
            <tbody>
              {data.byPu.map((r) => (
                <tr key={r.node.id} className="border-b border-paper-100 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink-800">{r.node.name}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-800">
                    {r.officers} <span className="text-ink-400">/ {r.establishment}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 flex-none rounded-full ${r.fillPct >= 95 ? 'bg-signal-ok' : r.fillPct >= 85 ? 'bg-signal-warn' : 'bg-signal-alarm'}`} />
                      <span className="font-mono tabular-nums text-ink-800">{r.fillPct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-700">{r.auto}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-700">{r.motocikl}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-700">{r.bicikl}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-ink-700">
                    {r.ispravno}/{r.ukupno}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-paper-200 bg-paper-0">
        <div className="border-b border-paper-200 px-5 py-3">
          <div className="section-label text-brass-600">Kantonalni resursi</div>
          <div className="font-heading text-base text-ink-800">Angažuju se za područje cijelog Kantona</div>
        </div>
        <ul className="divide-y divide-paper-100">
          {data.kantonAssets.map((v) => (
            <AssetRow key={v.id} vehicle={v} />
          ))}
        </ul>
      </section>

      <div className="mt-8 border-t border-paper-200 pt-4 text-center text-xs text-ink-500 print:hidden">
        Prikaz je namijenjen za budžetski zahtjev i sjednicu Vlade.
      </div>
    </div>
  );
}

function AssetRow({ vehicle }: { vehicle: Vehicle }) {
  const Icon = vehicle.kind === 'helikopter' ? Plane : vehicle.kind === 'bicikl' ? Bike : Truck;
  const ok = vehicle.status === 'ispravno';
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="flex h-9 w-9 flex-none items-center justify-center bg-navy-900 text-paper-50">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink-800">{vehicle.model}</div>
        <div className="text-[11px] text-ink-500">
          {VEHICLE_KIND_LABEL[vehicle.kind]} · oznaka {vehicle.plate}
        </div>
      </div>
      <span
        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
          ok ? 'bg-signal-ok/15 text-signal-ok' : 'bg-signal-warn/15 text-signal-warn'
        }`}
      >
        {ok ? 'ispravno' : 'u servisu'}
      </span>
    </li>
  );
}

function Kpi({ icon, label, value, foot }: { icon: React.ReactNode; label: string; value: string; foot: string }) {
  return (
    <div className="relative overflow-hidden border border-paper-200 bg-paper-0 p-4 print:border-paper-300">
      <span className="absolute left-0 top-0 h-full w-[3px] bg-brass-500" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-ink-500">{icon}</span>
        <div className="section-label">{label}</div>
      </div>
      <div className="font-mono text-2xl font-medium tabular-nums text-ink-800">{value}</div>
      <div className="mt-1 text-[11px] text-ink-500">{foot}</div>
    </div>
  );
}
