import { LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';

const NAV: ShellNavItem[] = [
  { to: '/ministar', end: true, label: 'Strateška tabla', icon: LayoutDashboard, badge: 'M01' },
  { to: '/ministar/simulacija', label: 'Simulacija', icon: SlidersHorizontal, badge: 'M02' },
];

export function MinisterShell() {
  return <SidebarShell roleTitle="Ministar" nav={NAV} />;
}
