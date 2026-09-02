import { Inbox } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from '../../components/SidebarShell';

const TABS: ShellNavItem[] = [
  { to: '/administracija', end: true, label: 'Zahtjevi građana', icon: Inbox },
];

export function AdministracijaShell() {
  return <SidebarShell roleTitle="Administrativna služba" subtitle="Šalter · obrada zahtjeva" nav={TABS} />;
}
