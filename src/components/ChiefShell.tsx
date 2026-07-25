import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, HeartHandshake, Truck, Sliders, LogOut } from 'lucide-react';
import { useRoleActions, useSession } from '../app/RoleContext';

interface Props {
  basePath: string;
  roleTitle: string;
  showN05?: boolean;
}

export function ChiefShell({ basePath, roleTitle, showN05 = true }: Props) {
  const session = useSession();
  const { logout } = useRoleActions();

  const nav = [
    { to: basePath, end: true, label: 'Komandna tabla', icon: LayoutDashboard, badge: 'N01' },
    { to: `${basePath}/analitika`, end: false, label: 'Analitika učinka', icon: TrendingUp, badge: 'N02' },
    { to: `${basePath}/kadar`, end: false, label: 'Briga o kadru', icon: HeartHandshake, badge: 'N03' },
    { to: `${basePath}/oprema`, end: false, label: 'Oprema i vozni park', icon: Truck, badge: 'N04' },
    ...(showN05 ? [{ to: `${basePath}/uloge`, end: false, label: 'Operativne uloge', icon: Sliders, badge: 'N05' }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-paper-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-paper-200 bg-paper-0 lg:flex">
        <div className="border-b border-paper-200 px-5 py-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-ink-400">Dutyboard</div>
          <div className="mt-0.5 text-sm font-heading font-medium text-ink-800">{roleTitle}</div>
          <div className="mt-0.5 text-xs text-ink-500">{session.scopeLabel}</div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {nav.map(({ to, end, label, icon: Icon, badge }) => (
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
            <div className="text-xs uppercase tracking-wider text-ink-400">{roleTitle}</div>
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
