import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Info } from 'lucide-react';
import { useScopedWorld } from '../../data/useScopedWorld';
import { CHART_COLORS } from '../../components/chartTheme';

export function N02Analitika() {
  const world = useScopedWorld();
  const roles = world.operationalRoles;
  const [selectedRole, setSelectedRole] = useState<string>(roles[0]?.id ?? '');
  const [metric, setMetric] = useState<'intervencije' | 'hapsenja' | 'prekrsajni'>('intervencije');

  const topOfficers = useMemo(() => {
    const withRole = world.officers.filter((o) => o.operationalRoleIds.includes(selectedRole));
    const scored = withRole.map((o) => {
      const total = world.performance
        .filter((p) => p.officerId === o.id && p.yearMonth.startsWith('2026'))
        .reduce((s, p) => s + p[metric], 0);
      return { officer: o, total };
    });
    return scored.sort((a, b) => b.total - a.total).slice(0, 10);
  }, [world, selectedRole, metric]);

  const chartData = topOfficers.map((s) => ({ label: s.officer.name.split(' ')[1] ?? s.officer.name, value: s.total }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-wider text-ink-400">Analitika učinka</div>
        <h1 className="mt-0.5 text-2xl font-heading font-medium text-ink-800">Poređenja unutar iste vrste posla</h1>
      </header>

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="flex-1 min-w-[200px]">
          <div className="mb-1 text-xs font-medium text-ink-600">Operativna uloga *</div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full  border border-paper-200 bg-paper-0 px-3 py-2 text-sm"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
        <label className="flex-1 min-w-[200px]">
          <div className="mb-1 text-xs font-medium text-ink-600">Metrika</div>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as typeof metric)}
            className="w-full  border border-paper-200 bg-paper-0 px-3 py-2 text-sm"
          >
            <option value="intervencije">Intervencije</option>
            <option value="hapsenja">Hapšenja</option>
            <option value="prekrsajni">Prekršajni nalozi</option>
          </select>
        </label>
      </div>

      <div className="mb-4 flex items-start gap-2  bg-paper-100 px-3 py-2 text-xs text-ink-600">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
        Poređenje se uvijek radi unutar iste vrste posla — interventna i pozornik ne rade isti posao.
      </div>

      <section className="mb-6  bg-paper-0 p-5 border border-paper-200">
        <h2 className="mb-3 text-sm font-heading font-medium text-ink-800">Top 10</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, left: 100, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className=" bg-paper-0 p-5 border border-paper-200">
        <h2 className="mb-3 text-sm font-heading font-medium text-ink-800">Poredak sa kontekstom</h2>
        <ol className="divide-y divide-paper-200">
          {topOfficers.map((s, i) => (
            <li key={s.officer.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-100 text-xs font-semibold text-ink-700">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-ink-800">{s.officer.name}</div>
                  <div className="text-[11px] text-ink-500">{s.officer.rank.replace('_', ' ')}</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-ink-800">{s.total}</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
