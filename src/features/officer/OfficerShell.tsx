import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Backpack, CalendarDays, ClipboardList, FileText, GraduationCap, Smartphone, Wallet } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';
import { PhoneFrame } from '../../components/PhoneFrame';
import { useSoftić } from './useOfficer';
import { PLACE } from '../../app/places';
import { useRoleActions } from '../../app/RoleContext';
import { useOrg } from '../../app/OrgContext';
import { demoNow } from '../../data/generator/dates';

const TABS: ShellNavItem[] = [
  { to: '/policajac', end: true, label: 'Smjena', icon: CalendarDays },
  { to: '/policajac/zahtjevi', label: 'Zahtjevi', icon: ClipboardList },
  { to: '/policajac/plata', label: 'Plata', icon: Wallet },
  { to: '/policajac/izvjestaji', label: 'Izvještaji', icon: FileText },
  // Na telefonu: pod „Više"
  { to: '/policajac/statistika', label: 'Statistika', icon: BarChart3 },
  { to: '/policajac/akademija', label: 'Akademija', icon: GraduationCap },
  { to: '/policajac/zaduzenja', label: 'Zaduženja', icon: Backpack },
];

// Ispod ove širine prozor je već telefon/tablet — aplikacija ide preko cijelog ekrana.
const DESKTOP_QUERY = '(min-width: 900px)';

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DESKTOP_QUERY);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
  );
}

export function OfficerShell() {
  const officer = useSoftić();
  const desktop = useIsDesktop();

  const app = (
    <SidebarShell
      roleTitle={officer.name}
      subtitle={`policajac · ${PLACE.psCentar} · Smjena B`}
      nav={TABS}
      mobileNav="bottom"
      contentClassName="mx-auto w-full max-w-2xl"
    />
  );

  // Policajac koristi telefon — na desktopu (projektor, laptop) aplikaciju
  // prikazujemo u okviru telefona, da se odmah vidi da je to mobilna aplikacija.
  if (!desktop) return app;
  return <PhoneStage officerName={officer.name}>{app}</PhoneStage>;
}

function PhoneStage({ officerName, children }: { officerName: string; children: React.ReactNode }) {
  const { logout } = useRoleActions();
  const navigate = useNavigate();
  const { org } = useOrg();

  const back = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="paper-noise flex min-h-screen items-center justify-center gap-16 bg-navy-900 px-8 py-6">
      <div className="max-w-sm text-paper-100">
        <button
          onClick={back}
          className="mb-10 inline-flex items-center gap-2 border border-paper-50/25 px-3 py-1.5 text-sm text-paper-50 transition hover:bg-paper-50/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Nazad na izbor uloge
        </button>

        <div className="section-label flex items-center gap-2 text-brass-300">
          <Smartphone className="h-4 w-4" />
          Mobilna aplikacija · {org.orgShort}
        </div>
        <h1 className="mt-3 font-heading text-3xl font-medium leading-tight text-paper-50">
          Policajac na terenu
        </h1>
        <div className="mt-4 h-[2px] w-16 bg-brass-500" />
        <p className="mt-5 text-sm leading-relaxed text-paper-300">
          Ovako aplikaciju vidi policajac na svom telefonu — prijavljeni ste kao {officerName},{' '}
          {PLACE.psCentar}. Koristite je mišem kao telefon: dodirnite tabove na dnu ekrana (ostalo je pod „Više").
        </p>

        <div className="mt-8 section-label text-brass-300">Probajte</div>
        <ul className="mt-3 space-y-3 text-sm text-paper-200">
          <Try title="Smjena">raspored za mjesec i ko je s vama u patroli</Try>
          <Try title="Zahtjevi">podnesite zahtjev za godišnji — zatim ga kao komandir odobrite</Try>
          <Try title="Plata">obračun s prekovremenim i noćnim satima</Try>
          <Try title="Izvještaji">službena zabilješka napisana s telefona</Try>
        </ul>

        <p className="mt-10 border-t border-paper-50/10 pt-5 text-xs leading-relaxed text-paper-400">
          Na mobitelu otvorite istu adresu — aplikacija se otvara preko cijelog ekrana.
        </p>
      </div>

      <PhoneFrame clock={demoNow().slice(11, 16)}>{children}</PhoneFrame>
    </div>
  );
}

function Try({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[7px] h-1.5 w-1.5 flex-none bg-brass-500" />
      <span>
        <span className="font-medium text-paper-50">{title}</span> — {children}
      </span>
    </li>
  );
}
