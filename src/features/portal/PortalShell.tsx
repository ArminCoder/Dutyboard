import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Landmark, LogOut } from 'lucide-react';
import { useOptionalCitizen, useCitizenActions } from '../../app/CitizenContext';
import { useOrg } from '../../app/OrgContext';

/** Zajednički okvir portala za građane — javni dio, svijetla tema, van interne kapije. */
export function PortalShell() {
  const citizen = useOptionalCitizen();
  const { logout } = useCitizenActions();
  const { org } = useOrg();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate('/portal/prijava');
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <header className="border-b border-paper-200 bg-navy-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/portal" className="flex min-w-0 items-center gap-2.5 text-paper-50">
            <Landmark className="h-5 w-5 flex-none text-brass-400" />
            <div className="min-w-0 leading-tight">
              <div className="truncate font-heading text-sm font-medium">
                <span className="sm:hidden">{org.orgShort}</span>
                <span className="hidden sm:inline">{org.orgName}</span>
              </div>
              <div className="text-[11px] text-paper-300">Portal za građane</div>
            </div>
          </Link>
          {citizen ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-xs font-medium text-paper-50">{citizen.name}</div>
                <div className="text-[10px] text-paper-300">JMB {maskJmb(citizen.jmb)}</div>
              </div>
              <button
                onClick={doLogout}
                className="inline-flex items-center gap-1.5 border border-paper-50/25 px-2.5 py-1.5 text-xs text-paper-50 transition hover:bg-paper-50/10"
              >
                <LogOut className="h-3.5 w-3.5" /> Odjava
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-8 pt-2 text-center text-[11px] text-ink-400">
        Demonstracija — svi podaci su izmišljeni. U produkciji: eID/eGov prijava i naplata online.
      </footer>
    </div>
  );
}

function maskJmb(jmb: string): string {
  return jmb.length >= 7 ? `${jmb.slice(0, 4)}•••••${jmb.slice(-2)}` : jmb;
}
