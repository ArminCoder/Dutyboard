import { LayoutGrid, Clock } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';

const NAV: ShellNavItem[] = [
  { to: '/komesar', end: true, label: 'Operativni pregled', icon: LayoutGrid, badge: 'C01' },
  { to: '/komesar/radno-vrijeme', label: 'Radno vrijeme', icon: Clock, badge: 'C02' },
];

export function KomesarShell() {
  return <SidebarShell roleTitle="Policijski komesar" nav={NAV} />;
}
