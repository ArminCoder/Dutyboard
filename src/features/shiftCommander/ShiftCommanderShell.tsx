import { Users, Radio, BookOpen, Map as MapIcon, Send } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';

// Šef smjene vodi smjenu na terenu: vidi svoje ljude, upravlja patrolama,
// vodi knjigu događaja i na kraju šalje bilten. Raspored, odobrenja i
// prekovremeni su u nadležnosti komandira stanice.
const NAV: ShellNavItem[] = [
  { to: '/sef-smjene', end: true, label: 'Moja smjena', icon: Users, badge: 'K06' },
  { to: '/sef-smjene/aktivna', label: 'Aktivna smjena', icon: Radio, badge: 'K02' },
  { to: '/sef-smjene/knjiga', label: 'Knjiga događaja', icon: BookOpen, badge: 'K04' },
  { to: '/sef-smjene/mapa', label: 'Mapa patrola', icon: MapIcon, badge: 'K05' },
  { to: '/sef-smjene/bilten', label: 'Bilten smjene', icon: Send, badge: 'K07' },
];

export function ShiftCommanderShell() {
  return <SidebarShell roleTitle="Šef smjene" nav={NAV} />;
}
