import { NavLink, Outlet } from 'react-router-dom';
import { LayoutGrid, Clock, LogOut } from 'lucide-react';
import { useRoleActions, useSession } from '../../app/RoleContext';

// Komesarski "suite" — komandna tabla cijele Uprave policije. Desktop/projektor.
const NAV = [
  { to: '/komesar', end: true, label: 'Operativni pregled', icon: LayoutGrid },
  { to: '/komesar/radno-vrijeme', end: false, label: 'Radno vrijeme', icon: Clock },
];

export function KomesarShell() {
  const session = useSession();
  const { logout } = useRoleActions();

  return (
    <div className="min-h-screen bg-paper-50">
      <header className="border-b border-paper-200 bg-paper-0">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-6">
            <div>
              <div className="section-label text-brass-600">Uprava policije MUP DK</div>
              <div className="font-heading text-sm text-ink-800">{session.scopeLabel}</div>
            </div>
            <nav className="flex items-center gap-1">
              {NAV.map(({ to, end, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 text-sm transition ${
                      isActive ? 'bg-navy-900 text-paper-50' : 'text-ink-600 hover:bg-paper-100'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-500 transition hover:bg-paper-100 hover:text-navy-900"
          >
            <LogOut className="h-4 w-4" />
            Odjava
          </button>
        </div>
      </header>

      <main className="overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
