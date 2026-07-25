import { useMemo } from 'react';
import { Building2, TrendingUp, HeartPulse, Calendar, ChevronRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from 'recharts';
import { world } from '../../data/world';
import { descendantsOf } from '../../data/generator/org';
import { useRoleActions } from '../../app/RoleContext';
import { LogOut } from 'lucide-react';

export function C01Uprava() {
  const { logout } = useRoleActions();

  const pus = world.orgNodes.filter((n) => n.kind === 'pu');
  const puStats = useMemo(() => {
    return pus.map((pu) => {
      const inScope = descendantsOf(world.orgNodes, pu.id);
      const officers = world.officers.filter((o) => inScope.has(o.orgNodeId));
      const active = officers.filter((o) => o.status === 'aktivan').length;
      const godisnji = officers.filter((o) => o.status === 'godisnji').length;
      const bolovanje = officers.filter((o) => o.status === 'bolovanje').length;
      const popPct = officers.length > 0 ? Math.round((active / officers.length) * 100) : 0;
      const prekov = world.performance
        .filter((p) => officers.some((o) => o.id === p.officerId) && p.yearMonth.startsWith('2026'))
        .reduce((s, p) => s + p.sati.prekovremeni, 0);
      const intervencije = world.performance
        .filter((p) => officers.some((o) => o.id === p.officerId) && p.yearMonth.startsWith('2026'))
        .reduce((s, p) => s + p.intervencije, 0);
      return { pu, officers, active, godisnji, bolovanje, popPct, prekov, intervencije };
    });
  }, [pus]);

  const yearlyTrend = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const p of world.performance) {
      byMonth.set(p.yearMonth, (byMonth.get(p.yearMonth) ?? 0) + p.intervencije);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([ym, v]) => ({ label: ym.slice(5, 7), value: v }));
  }, []);

  const prekovByPu = puStats.map((s) => ({ label: s.pu.name.replace('PU ', ''), prekov: s.prekov }));

  return (
    <div className="min-h-screen bg-paper-50">
      <header className="border-b border-paper-200 bg-paper-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-400">Uprava policije MUP DK</div>
            <h1 className="mt-0.5 text-lg font-heading font-medium text-ink-800">Komandna tabla komesara</h1>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="inline-flex items-center gap-1.5  border border-paper-200 bg-paper-0 px-3 py-1.5 text-sm text-ink-600 hover:border-navy-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            Odjava
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <p className="mb-6 text-sm text-ink-500">Od Kantona do konkretne smjene u tri klika.</p>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          {puStats.map((s) => (
            <PuCard key={s.pu.id} stats={s} />
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className=" bg-paper-0 p-5 border border-paper-200">
            <div className="mb-3 flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
              <TrendingUp className="h-4 w-4 text-ink-500" />
              Trend intervencija (12 mjeseci)
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4d8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#524d42' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#524d42' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="value" stroke="#14203a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className=" bg-paper-0 p-5 border border-paper-200">
            <div className="mb-3 flex items-center gap-2 text-sm font-heading font-medium text-ink-800">
              <HeartPulse className="h-4 w-4 text-ink-500" />
              Prekovremeni po PU (2026.)
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prekovByPu} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4d8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#524d42' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#524d42' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="prekov" fill="#14203a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function PuCard({ stats }: { stats: { pu: (typeof world.orgNodes)[number]; officers: typeof world.officers; active: number; godisnji: number; bolovanje: number; popPct: number; prekov: number; intervencije: number } }) {
  return (
    <div className=" bg-paper-0 p-5 border border-paper-200 transition hover:">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center  bg-navy-900 text-paper-50">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-heading font-medium text-ink-800">{stats.pu.name}</div>
            <div className="text-[11px] text-ink-500">{stats.officers.length} policajaca ukupno</div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-paper-400" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Popunj." value={`${stats.popPct}%`} />
        <MiniStat label="Godišnji" value={stats.godisnji} icon={<Calendar className="h-3 w-3" />} />
        <MiniStat label="Bolovanja" value={stats.bolovanje} icon={<HeartPulse className="h-3 w-3" />} tone={stats.bolovanje > stats.officers.length * 0.05 ? 'warn' : undefined} />
        <MiniStat label="Prekov." value={`${stats.prekov} h`} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon, tone }: { label: string; value: string | number; icon?: React.ReactNode; tone?: 'warn' }) {
  return (
    <div className={` p-2 ${tone === 'warn' ? 'bg-signal-warn/10' : 'bg-paper-50'}`}>
      <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-400">
        {icon}
        {label}
      </div>
      <div className={`text-sm font-semibold ${tone === 'warn' ? 'text-signal-warn' : 'text-ink-800'}`}>{value}</div>
    </div>
  );
}
