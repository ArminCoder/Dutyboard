import { CalendarDays, ClipboardList, BarChart3, Wallet, Backpack } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';
import { useSoftić } from './useOfficer';

const TABS: ShellNavItem[] = [
  { to: '/policajac', end: true, label: 'Smjena', icon: CalendarDays },
  { to: '/policajac/zahtjevi', label: 'Zahtjevi', icon: ClipboardList },
  { to: '/policajac/statistika', label: 'Statistika', icon: BarChart3 },
  { to: '/policajac/plata', label: 'Plata', icon: Wallet },
  { to: '/policajac/zaduzenja', label: 'Zaduženja', icon: Backpack },
];

export function OfficerShell() {
  const officer = useSoftić();
  return (
    <SidebarShell
      roleTitle={officer.name}
      subtitle="policajac · PS Centar · Smjena B"
      nav={TABS}
      mobileNav="bottom"
      contentClassName="mx-auto w-full max-w-2xl"
    />
  );
}
