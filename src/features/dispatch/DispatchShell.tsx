import { Map as MapIcon } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';

const NAV: ShellNavItem[] = [{ to: '/dezurni', end: true, label: 'Živa mapa', icon: MapIcon, badge: 'D01' }];

export function DispatchShell() {
  return <SidebarShell roleTitle="Dežurni operativac" nav={NAV} dark />;
}
