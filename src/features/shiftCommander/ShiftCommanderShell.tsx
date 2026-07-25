import { NavLink, Outlet } from 'react-router-dom';
import { CalendarRange, Radio, Inbox, TrendingUp, LogOut } from 'lucide-react';
import { useRoleActions, useSession } from '../../app/RoleContext';

const NAV = [
  { to: '/sef-smjene', end: true, label: 'Raspored', icon: CalendarRange, badge: 'K01' },
  { to: '/sef-smjene/aktivna', end: false, label: 'Aktivna smjena', icon: Radio, badge: 'K02' },
  { to: '/sef-smjene/odobrenja', end: false, label: 'Odobrenja', icon: Inbox, badge: 'K03' },
  { to: '/sef-smjene/prekovremeni', end: false, label: 'Prekovremeni', icon: TrendingUp, badge: 'K03' },
];

export function ShiftCommanderShell() {
  const session = useSession();
  const { logout } = useRoleActions();

  return (
    <div className="flex min-h-screen bg-paper-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-paper-200 bg-paper-0 lg:flex">
        <div className="border-b border-paper-200 px-5 py-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-ink-400">Dutyboard</div>
          <div className="mt-0.5 text-sm font-heading font-medium text-ink-800">Šef smjene</div>
          <div className="mt-0.5 text-xs text-ink-500">{session.scopeLabel}</div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {NAV.map(({ to, end, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3  px-3 py-2 text-sm transition ${
                  isActive ? 'bg-navy-900 text-paper-50' : 'text-ink-700 hover:bg-paper-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              <span className="rounded bg-paper-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                {badge}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-paper-200 p-3">
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="flex w-full items-center gap-2  px-3 py-2 text-sm text-ink-500 transition hover:bg-paper-100 hover:text-navy-900"
          >
            <LogOut className="h-4 w-4" />
            Odjava
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
        <header className="flex items-center justify-between border-b border-paper-200 bg-paper-0 px-6 py-3 lg:hidden">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-400">Šef smjene</div>
            <div className="text-sm font-heading font-medium text-ink-800">{session.scopeLabel}</div>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className=" p-2 text-ink-500 hover:bg-paper-100"
            aria-label="Odjava"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
