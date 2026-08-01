import { Settings, ShieldAlert } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';

const NAV: ShellNavItem[] = [
  { to: '/admin', end: true, label: 'Organizacija', icon: Settings, badge: 'A01' },
  { to: '/mockup/admin', label: 'Korisnici i audit', icon: ShieldAlert, badge: 'X03' },
];

export function AdminShell() {
  return <SidebarShell roleTitle="Administracija" nav={NAV} />;
}
