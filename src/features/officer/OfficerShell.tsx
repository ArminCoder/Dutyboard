import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, ClipboardList, BarChart3, Wallet, Backpack, LogOut } from 'lucide-react';
import { useRoleActions } from '../../app/RoleContext';
import { useSoftić } from './useOfficer';

const TABS = [
  { to: '/policajac', end: true, label: 'Smjena', icon: CalendarDays },
  { to: '/policajac/zahtjevi', label: 'Zahtjevi', icon: ClipboardList },
  { to: '/policajac/statistika', label: 'Statistika', icon: BarChart3 },
  { to: '/policajac/plata', label: 'Plata', icon: Wallet },
  { to: '/policajac/zaduzenja', label: 'Zaduženja', icon: Backpack },
];

export function OfficerShell() {
  const officer = useSoftić();
  const { logout } = useRoleActions();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-paper-50">
      <header className="sticky top-0 z-10 border-b border-paper-200 bg-paper-0 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-base font-heading font-medium text-ink-800">{officer.name}</div>
            <div className="text-xs text-ink-500">policajac · PS Centar · Smjena B</div>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className=" p-2 text-ink-500 transition hover:bg-paper-100 hover:text-navy-900"
            aria-label="Odjava"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 items-stretch border-t border-paper-200 bg-paper-0/95 ">
        {TABS.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition ${
                isActive ? 'text-ink-800' : 'text-ink-400 hover:text-navy-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-5 w-5 ${isActive ? 'text-ink-800' : ''}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
