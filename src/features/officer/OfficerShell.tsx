import { CalendarDays, ClipboardList, BarChart3, Wallet, Backpack, FileText, GraduationCap } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';
import { useSoftić } from './useOfficer';
import { PLACE } from '../../app/places';

const TABS: ShellNavItem[] = [
  { to: '/policajac', end: true, label: 'Smjena', icon: CalendarDays },
  { to: '/policajac/zahtjevi', label: 'Zahtjevi', icon: ClipboardList },
  { to: '/policajac/statistika', label: 'Statistika', icon: BarChart3 },
  { to: '/policajac/plata', label: 'Plata', icon: Wallet },
  { to: '/policajac/izvjestaji', label: 'Izvještaji', icon: FileText },
  { to: '/policajac/akademija', label: 'Akademija', icon: GraduationCap },
  { to: '/policajac/zaduzenja', label: 'Zaduženja', icon: Backpack },
];

export function OfficerShell() {
  const officer = useSoftić();
  return (
    <SidebarShell
      roleTitle={officer.name}
      subtitle={`policajac · ${PLACE.psCentar} · Smjena B`}
      nav={TABS}
      mobileNav="bottom"
      contentClassName="mx-auto w-full max-w-2xl"
    />
  );
}
