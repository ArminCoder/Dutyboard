import { useMemo, useState } from 'react';
import { Plus, X, Send, CheckCircle2, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useScopedWorld } from '../../data/useScopedWorld';
import { useStore, type OvertimePosting } from '../../app/store';
import { addDays, DEMO_TODAY, formatBs } from '../../data/generator/dates';
import { CHART_COLORS } from '../../components/chartTheme';

export function K03Prekovremeni() {
  const world = useScopedWorld();
  const store = useStore();
  const [creating, setCreating] = useState(false);

  const chartData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of world.performance) {
      if (!p.yearMonth.startsWith('2026')) continue;
      const label = `${p.yearMonth.slice(5, 7)}/${p.yearMonth.slice(2, 4)}`;
      totals.set(label, (totals.get(label) ?? 0) + p.sati.prekovremeni);
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, sati]) => ({ label, sati }));
  }, [world.performance]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">Prekovremeni rad</div>
          <h1 className="mt-0.5 text-lg font-heading font-medium text-ink-800">Objave i raspodjela</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5  bg-navy-900 px-3 py-1.5 text-sm font-medium text-paper-50 transition hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          Nova objava
        </button>
      </header>

      <section className="mb-6  bg-paper-0 p-4 border border-paper-200">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-heading font-medium text-ink-800">Raspodjela prekovremenih (2026.)</h2>
          <span className="flex items-center gap-1 text-xs text-ink-500">
            <TrendingUp className="h-3.5 w-3.5" />
            po mjesecima
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="sati" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <h2 className="mb-3 text-sm font-heading font-medium text-ink-800">Aktivne objave</h2>
      <ul className="space-y-3">
        {store.overtimePostings.length === 0 ? (
          <li className=" border border-dashed border-paper-200 bg-paper-0 px-6 py-8 text-center text-sm text-ink-500">
            Nema aktivnih objava.
          </li>
        ) : null}
        {store.overtimePostings.map((p) => (
          <PostingRow key={p.id} posting={p} />
        ))}
      </ul>

      {creating && <NewPostingDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function PostingRow({ posting }: { posting: OvertimePosting }) {
  const world = useScopedWorld();
  const store = useStore();
  const role = world.operationalRoles.find((r) => r.id === posting.requiredRoleId);

  const candidates = useMemo(() => {
    // Rangirano: najmanje sati prekovremenih prvi (za pravednost)
    const withHours = world.officers
      .filter((o) => o.operationalRoleIds.includes(posting.requiredRoleId))
      .map((o) => {
        const ytdOvertime = world.performance
          .filter((p) => p.officerId === o.id && p.yearMonth.startsWith('2026'))
          .reduce((s, p) => s + p.sati.prekovremeni, 0);
        return { officer: o, ytdOvertime };
      });
    return withHours.sort((a, b) => a.ytdOvertime - b.ytdOvertime).slice(0, 8);
  }, [posting.requiredRoleId, world.officers, world.performance]);

  const accepted = posting.offerLog.filter((o) => o.accepted).length;

  return (
    <li className="overflow-hidden  bg-paper-0 border border-paper-200">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-heading font-medium text-ink-800">{role?.name ?? posting.requiredRoleId}</div>
            <div className="mt-0.5 text-xs text-ink-500">
              {formatBs(posting.when.slice(0, 10))} · {posting.when.slice(11, 16)} · {posting.duration}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-ink-400">Prihvatili</div>
            <div className="text-lg font-heading font-medium text-ink-800">
              {accepted}
              <span className="text-sm font-normal text-ink-500">/{posting.neededCount}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-paper-200 bg-paper-50 p-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-500">
          Rangirano po najmanje prekovremenih (2026.)
        </div>
        <ul className="space-y-1">
          {candidates.map(({ officer, ytdOvertime }) => {
            const offered = posting.offerLog.find((o) => o.officerId === officer.id);
            return (
              <li key={officer.id} className="flex items-center justify-between  bg-paper-0 px-3 py-2">
                <div>
                  <div className="text-sm text-ink-800">{officer.name}</div>
                  <div className="text-[11px] text-ink-500">{ytdOvertime} h prekovremenih ove godine</div>
                </div>
                {offered?.accepted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-signal-ok/15 px-2 py-0.5 text-[10px] font-medium uppercase text-signal-ok">
                    <CheckCircle2 className="h-3 w-3" />
                    prihvatio
                  </span>
                ) : offered ? (
                  <span className="text-[10px] text-ink-500">ponuđeno · čeka odgovor</span>
                ) : (
                  <button
                    onClick={() => store.offerOvertime(posting.id, officer.id, officer.name)}
                    className="inline-flex items-center gap-1  border border-paper-200 bg-paper-0 px-2 py-1 text-[11px] font-medium text-ink-700 transition hover:border-navy-700"
                  >
                    <Send className="h-3 w-3" />
                    Ponudi
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}

function NewPostingDialog({ onClose }: { onClose: () => void }) {
  const world = useScopedWorld();
  const store = useStore();
  const roles = world.operationalRoles.filter((r) => r.orgNodeId === 'pu-centar');

  const [roleId, setRoleId] = useState(roles[0]?.id ?? '');
  const [date, setDate] = useState(addDays(DEMO_TODAY, 5));
  const [time, setTime] = useState('19:00');
  const [duration, setDuration] = useState('12 h');
  const [count, setCount] = useState(2);

  const submit = () => {
    store.createOvertimePosting({
      psId: 'ps-centar',
      requiredRoleId: roleId,
      when: `${date}T${time}`,
      duration,
      neededCount: count,
    });
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md  bg-paper-0 p-5 ">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-heading font-medium text-ink-800">Nova objava prekovremenih</h3>
          <button onClick={onClose} className=" p-1 text-ink-400 hover:bg-paper-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-ink-600">Operativna uloga</div>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <div className="mb-1 text-xs font-medium text-ink-600">Datum</div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={DEMO_TODAY}
                className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm" />
            </label>
            <label>
              <div className="mb-1 text-xs font-medium text-ink-600">Vrijeme</div>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <div className="mb-1 text-xs font-medium text-ink-600">Trajanje</div>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm">
                <option>4 h</option>
                <option>6 h</option>
                <option>8 h</option>
                <option>12 h</option>
              </select>
            </label>
            <label>
              <div className="mb-1 text-xs font-medium text-ink-600">Broj ljudi</div>
              <input type="number" min="1" max="10" value={count} onChange={(e) => setCount(Number(e.target.value))}
                className="w-full  border border-paper-200 bg-paper-50 px-3 py-2 text-sm" />
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className=" px-3 py-2 text-sm text-ink-600 hover:bg-paper-100">
            Odustani
          </button>
          <button onClick={submit} className=" bg-navy-900 px-4 py-2 text-sm font-medium text-paper-50">
            Objavi
          </button>
        </div>
      </div>
    </div>
  );
}
