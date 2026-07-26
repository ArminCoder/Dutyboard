import { CalendarRange, Radio, Inbox, TrendingUp } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';

const NAV: ShellNavItem[] = [
  { to: '/sef-smjene', end: true, label: 'Raspored', icon: CalendarRange, badge: 'K01' },
  { to: '/sef-smjene/aktivna', label: 'Aktivna smjena', icon: Radio, badge: 'K02' },
  { to: '/sef-smjene/odobrenja', label: 'Odobrenja', icon: Inbox, badge: 'K03' },
  { to: '/sef-smjene/prekovremeni', label: 'Prekovremeni', icon: TrendingUp, badge: 'K03' },
];

export function ShiftCommanderShell() {
  return <SidebarShell roleTitle="Šef smjene" nav={NAV} />;
}
