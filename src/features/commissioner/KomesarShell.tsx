import { LayoutGrid, Clock, BookOpen, Sunrise, Timer, Gauge, Users } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';

const NAV: ShellNavItem[] = [
  { to: '/komesar', end: true, label: 'Operativni pregled', icon: LayoutGrid, badge: 'C01' },
  { to: '/komesar/brifing', label: 'Jutarnji brifing', icon: Sunrise, badge: 'C02' },
  { to: '/komesar/prekovremeni', label: 'Kontrola prekovremenih', icon: Timer, badge: 'C03' },
  { to: '/komesar/spremnost', label: 'Indeks spremnosti', icon: Gauge, badge: 'C04' },
  { to: '/komesar/kadrovi', label: 'Kadrovska projekcija', icon: Users, badge: 'C05' },
  { to: '/komesar/radno-vrijeme', label: 'Radno vrijeme', icon: Clock, badge: 'C06' },
  { to: '/komesar/knjiga', label: 'Knjiga događaja', icon: BookOpen, badge: 'KDD' },
];

export function KomesarShell() {
  return <SidebarShell roleTitle="Policijski komesar" nav={NAV} />;
}
