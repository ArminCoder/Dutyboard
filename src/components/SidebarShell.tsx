import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut, MoreHorizontal, X } from 'lucide-react';
import { useRoleActions, useSession } from '../app/RoleContext';
import { useOrg } from '../app/OrgContext';
import { OrgCrest, crestInitials } from './OrgCrest';

// Jedinstveni shell sa bočnom trakom (sidebar) za sve uloge — da aplikacija izgleda
// kao pravi proizvod na desktopu/projektoru. Svijetla i tamna varijanta (tamna = dežurni/mapa).
// Na mobitelu: gornje zaglavlje + traka linkova, ili donji tabovi (policajac).

export interface ShellNavItem {
  to: string;
  end?: boolean;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface Props {
  roleTitle: string;
  /** Podnaslov ispod naziva uloge (default: scopeLabel sesije). */
  subtitle?: string;
  nav: ShellNavItem[];
  dark?: boolean;
  /** Mobilna navigacija: 'strip' (traka gore) ili 'bottom' (donji tabovi, za policajca). */
  mobileNav?: 'strip' | 'bottom';
  /** Klasa oko sadržaja (npr. ograničenje širine za mobilno-prve ekrane). */
  contentClassName?: string;
  children?: ReactNode;
}

const LIGHT = {
  root: 'bg-paper-50',
  aside: 'border-paper-200 bg-paper-0',
  border: 'border-paper-200',
  headerBg: 'bg-paper-0',
  kicker: 'text-ink-400',
  title: 'text-ink-800',
  sub: 'text-ink-500',
  link: 'text-ink-700 hover:bg-paper-100',
  linkActive: 'bg-navy-900 text-paper-50',
  badge: 'bg-paper-100 text-ink-500',
  logout: 'text-ink-500 hover:bg-paper-100 hover:text-navy-900',
};
const DARK = {
  root: 'bg-dark-bg',
  aside: 'border-dark-border bg-dark-surface',
  border: 'border-dark-border',
  headerBg: 'bg-dark-surface',
  kicker: 'text-dark-muted',
  title: 'text-dark-text',
  sub: 'text-dark-muted',
  link: 'text-dark-muted hover:bg-dark-elevated',
  linkActive: 'bg-brass-500 text-dark-bg',
  badge: 'bg-dark-elevated text-dark-muted',
  logout: 'text-dark-muted hover:bg-dark-elevated hover:text-brass-300',
};

export function SidebarShell({
  roleTitle,
  subtitle,
  nav,
  dark = false,
  mobileNav = 'strip',
  contentClassName = '',
  children,
}: Props) {
  const session = useSession();
  const { logout } = useRoleActions();
  const navigate = useNavigate();
  const { org } = useOrg();
  const sub = subtitle ?? session.scopeLabel;
  const t = dark ? DARK : LIGHT;

  // Router navigacija, ne window.location — tvrdi reload bi obrisao sve izmjene
  // napravljene u sesiji (zahtjevi, upisi u knjigu), pa bi demo tok kroz više
  // uloga ("podnesi zahtjev → prebaci se u šefa smjene → odobri") pukao.
  const doLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`flex min-h-screen ${t.root}`}>
      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r ${t.aside} lg:flex print:hidden`}>
        <div className={`border-b ${t.border} px-5 py-4`}>
          <div className={`flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider ${t.kicker}`}>
            <OrgCrest variant={org.logo} initials={crestInitials(org.orgShort)} className="h-5 w-5 flex-none" />
            {org.productName} · {org.orgShort}
          </div>
          <div className={`mt-0.5 text-sm font-heading font-medium ${t.title}`}>{roleTitle}</div>
          <div className={`mt-0.5 text-xs ${t.sub}`}>{sub}</div>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {nav.map(({ to, end, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm transition ${isActive ? t.linkActive : t.link}`
              }
            >
              <Icon className="h-4 w-4 flex-none" />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${t.badge}`}>{badge}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className={`border-t ${t.border} p-3`}>
          <button onClick={doLogout} className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${t.logout}`}>
            <LogOut className="h-4 w-4" />
            Odjava
          </button>
        </div>
      </aside>

      {/* Content column — min-w-0 dopušta flex-itemu da se skupi ispod širine sadržaja
          (bez toga se kolona rasteže na širinu najšireg djeteta i lomi mobilni prikaz). */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64 print:ml-0">
        {/* Mobile header */}
        <header className={`sticky top-0 z-10 flex items-center justify-between border-b ${t.border} ${t.headerBg} px-4 py-3 lg:hidden print:hidden`}>
          <div className="min-w-0">
            <div className={`text-[11px] uppercase tracking-wider ${t.kicker}`}>{roleTitle}</div>
            <div className={`truncate text-sm font-heading font-medium ${t.title}`}>{sub}</div>
          </div>
          <button onClick={doLogout} className={`p-2 ${t.logout}`} aria-label="Odjava">
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Mobile strip nav */}
        {mobileNav === 'strip' ? (
          <nav className={`flex gap-1 overflow-x-auto border-b ${t.border} ${t.headerBg} px-3 py-2 lg:hidden print:hidden`}>
            {nav.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-none items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs transition ${isActive ? t.linkActive : t.link}`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        ) : null}

        <main className={`flex-1 overflow-x-hidden ${mobileNav === 'bottom' ? 'pb-20 lg:pb-0' : ''}`}>
          {contentClassName ? <div className={contentClassName}>{children ?? <Outlet />}</div> : children ?? <Outlet />}
        </main>

        {/* Mobile bottom tabs (policajac) */}
        {mobileNav === 'bottom' ? <BottomTabs nav={nav} border={t.border} bg={t.headerBg} /> : null}
      </div>
    </div>
  );
}

// Telefon podnosi najviše 5 tabova — ostatak ide pod „Više" (donji list, kao u mobilnim aplikacijama).
const MAX_TABS = 5;

function BottomTabs({ nav, border, bg }: { nav: ShellNavItem[]; border: string; bg: string }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const overflow = nav.length > MAX_TABS;
  const primary = overflow ? nav.slice(0, MAX_TABS - 1) : nav;
  const more = overflow ? nav.slice(MAX_TABS - 1) : [];
  const moreActive = more.some((n) => pathname === n.to || pathname.startsWith(`${n.to}/`));

  // Zatvori list kad se promijeni ekran.
  useEffect(() => setOpen(false), [pathname]);

  const tabClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition ${active ? 'text-ink-800' : 'text-ink-400 hover:text-navy-900'}`;

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-30 flex items-end bg-black/40 lg:hidden print:hidden" onClick={() => setOpen(false)}>
          <div className="w-full bg-paper-0 pb-6 pt-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-2">
              <span className="section-label text-ink-500">Više</span>
              <button onClick={() => setOpen(false)} className="p-1 text-ink-400 hover:text-navy-900" aria-label="Zatvori">
                <X className="h-4 w-4" />
              </button>
            </div>
            {more.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3.5 text-sm transition ${isActive ? 'bg-paper-100 text-ink-800' : 'text-ink-700 hover:bg-paper-50'}`
                }
              >
                <Icon className="h-5 w-5 text-ink-500" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}

      <nav className={`fixed bottom-0 left-0 z-20 flex w-full items-stretch border-t ${border} ${bg} lg:hidden print:hidden`}>
        {primary.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => tabClass(isActive)}>
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
        {overflow ? (
          <button onClick={() => setOpen((o) => !o)} className={tabClass(moreActive || open)}>
            <MoreHorizontal className="h-5 w-5" />
            <span>Više</span>
          </button>
        ) : null}
      </nav>
    </>
  );
}
