import { LayoutDashboard, TrendingUp, HeartHandshake, Truck, Sliders, BookOpen, CalendarRange, Inbox, Timer } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from './SidebarShell';

interface Props {
  basePath: string;
  roleTitle: string;
  /** Katalog operativnih uloga je na nivou PU — komandir stanice ga nema. */
  showN05?: boolean;
  /** Komandir stanice vodi raspored, odobrenja i prekovremeni; načelnik ne. */
  showCommandTools?: boolean;
}

export function ChiefShell({ basePath, roleTitle, showN05 = true, showCommandTools = false }: Props) {
  const nav: ShellNavItem[] = [
    { to: basePath, end: true, label: 'Komandna tabla', icon: LayoutDashboard, badge: 'N01' },
    ...(showCommandTools
      ? [
          { to: `${basePath}/raspored`, label: 'Mjesečni raspored', icon: CalendarRange, badge: 'K01' },
          { to: `${basePath}/odobrenja`, label: 'Odobrenja', icon: Inbox, badge: 'K03' },
          { to: `${basePath}/prekovremeni`, label: 'Prekovremeni', icon: Timer, badge: 'K03' },
        ]
      : []),
    { to: `${basePath}/knjiga`, label: 'Knjiga događaja', icon: BookOpen, badge: 'KDD' },
    { to: `${basePath}/analitika`, label: 'Analitika učinka', icon: TrendingUp, badge: 'N02' },
    { to: `${basePath}/kadar`, label: 'Briga o kadru', icon: HeartHandshake, badge: 'N03' },
    { to: `${basePath}/oprema`, label: 'Oprema i vozni park', icon: Truck, badge: 'N04' },
    ...(showN05 ? [{ to: `${basePath}/uloge`, label: 'Operativne uloge', icon: Sliders, badge: 'N05' }] : []),
  ];

  return <SidebarShell roleTitle={roleTitle} nav={nav} />;
}
