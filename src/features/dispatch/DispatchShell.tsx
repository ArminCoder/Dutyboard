import { Map as MapIcon, Inbox, Sunrise } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';

// OKC — Operativno-komunikacijski centar MUP DK (broj 122). Kantonalni scope:
// prima pozive, prosljeđuje ih nadležnoj stanici, prikuplja biltene smjena
// i ujutro pravi brifing za komesara.
const NAV: ShellNavItem[] = [
  { to: '/dezurni', end: true, label: 'Mapa kantona', icon: MapIcon, badge: 'D01' },
  { to: '/dezurni/bilteni', label: 'Bilteni smjena', icon: Inbox, badge: 'D02' },
  { to: '/dezurni/brifing', label: 'Jutarnji brifing', icon: Sunrise, badge: 'D03' },
];

export function DispatchShell() {
  return <SidebarShell roleTitle="OKC MUP DK" nav={NAV} dark />;
}
