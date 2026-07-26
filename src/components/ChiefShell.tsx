import { LayoutDashboard, TrendingUp, HeartHandshake, Truck, Sliders } from 'lucide-react';
import { SidebarShell, type ShellNavItem } from './SidebarShell';

interface Props {
  basePath: string;
  roleTitle: string;
  showN05?: boolean;
}

export function ChiefShell({ basePath, roleTitle, showN05 = true }: Props) {
  const nav: ShellNavItem[] = [
    { to: basePath, end: true, label: 'Komandna tabla', icon: LayoutDashboard, badge: 'N01' },
    { to: `${basePath}/analitika`, label: 'Analitika učinka', icon: TrendingUp, badge: 'N02' },
    { to: `${basePath}/kadar`, label: 'Briga o kadru', icon: HeartHandshake, badge: 'N03' },
    { to: `${basePath}/oprema`, label: 'Oprema i vozni park', icon: Truck, badge: 'N04' },
    ...(showN05 ? [{ to: `${basePath}/uloge`, label: 'Operativne uloge', icon: Sliders, badge: 'N05' }] : []),
  ];

  return <SidebarShell roleTitle={roleTitle} nav={nav} />;
}
