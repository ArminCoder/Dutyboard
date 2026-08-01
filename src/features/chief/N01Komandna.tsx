import { useMemo } from 'react';
import { Users, Calendar, HeartPulse, Inbox, Car, AlertTriangle, MapPin, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useStore } from '../../app/store';
import { useSession } from '../../app/RoleContext';
import { CHART_COLORS } from '../../components/chartTheme';

export function N01Komandna() {
  const world = useScopedWorld();
  const store = useStore();
  const session = useSession();

  const totals = useMemo(() => {
    const active = world.officers.filter((o) => o.status === 'aktivan').length;
    const godisnji = world.officers.filter((o) => o.status === 'godisnji').length;
    const bolovanje = world.officers.filter((o) => o.status === 'bolovanje').length;
    const total = world.officers.length;
    const popunjenostPct = total > 0 ? Math.round((active / total) * 100) : 0;

    const vozilaIspravno = world.vehicles.filter((v) => v.status === 'ispravno').length;
    const vozilaUkupno = world.vehicles.length;

    const openRequests = store.leaveRequests.filter(
      (r) => r.status === 'u_toku' && world.officers.some((o) => o.id === r.officerId),
    ).length;

    return { active, godisnji, bolovanje, total, popunjenostPct, vozilaIspravno, vozilaUkupno, openRequests };
  }, [world, store.leaveRequests]);

  const trend = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const p of world.performance) {
      if (!p.yearMonth.startsWith('2026')) continue;
      byMonth.set(p.yearMonth, (byMonth.get(p.yearMonth) ?? 0) + p.sati.prekovremeni);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, sati]) => ({ label: ym.slice(5, 7), sati }));
  }, [world.performance]);

  const alerts = useMemo(() => {
    const list: string[] = [];
    // Isticanje certifikata u sljedećih 30 dana
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const in30ISO = in30.toISOString().slice(0, 10);
    let expSoon = 0;
    let expired = 0;
    for (const o of world.officers) {
      for (const c of o.certifications) {
        if (c.expires < today) expired++;
        else if (c.expires < in30ISO) expSoon++;
      }
    }
    if (expired > 0) list.push(`${expired} isteklih certifikata u ${session.scopeLabel.toLowerCase()}`);
    if (expSoon > 0) list.push(`${expSoon} certifikata ističe u sljedećih 30 dana`);
    if (totals.bolovanje > totals.total * 0.05) list.push(`Povišena stopa bolovanja (${Math.round((totals.bolovanje / totals.total) * 100)}%)`);
    return list;
  }, [world.officers, totals, session.scopeLabel]);

  const psList = world.orgNodes.filter((n) => n.kind === 'ps');

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">Komandna tabla</div>
          <h1 className="mt-0.5 text-2xl font-heading font-medium text-ink-800">{session.scopeLabel}</h1>
          <p className="mt-1 text-xs text-ink-500">Sve što vidiš je u okviru tvoje uprave. Drugi PU nisu vidljivi.</p>
        </div>
      </header>

      <section className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Popunjenost danas" value={`${totals.popunjenostPct}%`} icon={<Users className="h-4 w-4" />} sub={`${totals.active} od ${totals.total}`} />
        <Kpi label="Na godišnjem" value={totals.godisnji} icon={<Calendar className="h-4 w-4" />} />
        <Kpi label="Bolovanja" value={totals.bolovanje} icon={<HeartPulse className="h-4 w-4" />} tone={totals.bolovanje > totals.total * 0.05 ? 'warn' : undefined} />
        <Kpi label="Otvoreni zahtjevi" value={totals.openRequests} icon={<Inbox className="h-4 w-4" />} />
        <Kpi label="Vozila ispravna" value={`${totals.vozilaIspravno}/${totals.vozilaUkupno}`} icon={<Car className="h-4 w-4" />} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className=" bg-paper-0 p-5 border border-paper-200">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-heading font-medium text-ink-800">Trend prekovremenih 2026.</h2>
            <span className="flex items-center gap-1 text-xs text-ink-500">
              <TrendingUp className="h-3.5 w-3.5" /> sati po mjesecu
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="prekovG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="sati" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#prekovG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="space-y-4">
          <div className=" bg-paper-0 p-4 border border-paper-200">
            <div className="mb-2 flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
              <MapPin className="h-4 w-4 text-ink-500" /> Teritorija
            </div>
            <div className="grid gap-2 text-xs">
              {psList.length === 0 ? (
                <div className="text-ink-400">Nema podređenih stanica.</div>
              ) : null}
              {psList.map((ps) => (
                <div key={ps.id} className="flex items-center justify-between  bg-paper-50 px-3 py-2">
                  <span className="text-ink-800">{ps.name}</span>
                  <span className="text-[11px] text-ink-500">
                    {world.officers.filter((o) => o.orgNodeId.startsWith(ps.id)).length} lj.
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className=" bg-paper-0 p-4 border border-paper-200">
            <div className="mb-2 flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
              <AlertTriangle className="h-4 w-4 text-signal-warn" /> Upozorenja
            </div>
            {alerts.length === 0 ? (
              <div className="text-xs text-ink-500">Nema aktivnih upozorenja u tvom scope-u.</div>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {alerts.map((a, i) => (
                  <li key={i} className=" bg-signal-warn/10 px-3 py-2 text-signal-warn">{a}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  tone?: 'warn' | 'alarm';
}) {
  const border =
    tone === 'warn' ? 'ring-signal-warn/30 bg-signal-warn/5' : tone === 'alarm' ? 'ring-signal-alarm/30 bg-signal-alarm/5' : 'border-paper-200';
  return (
    <div className={` bg-paper-0 p-4 border ${border}`}>
      <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-400">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-heading font-medium text-ink-800">{value}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-ink-500">{sub}</div> : null}
    </div>
  );
}
