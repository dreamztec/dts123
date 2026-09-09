import { useRouterState } from '@tanstack/react-router'
import { Bell, Building2, CalendarDays, CarFront, CircleHelp, Gauge, Gift, LayoutDashboard, Map, Menu, ShieldAlert, Users, WalletCards } from 'lucide-react'
import { BrandMark } from './BrandMark'

type ShellKind = 'customer' | 'driver' | 'fleet' | 'corporate' | 'admin'

const navigation: Record<ShellKind, { label: string; href: string; icon: typeof Gauge }[]> = {
  customer: [
    { label:'Home', href:'/app', icon:LayoutDashboard }, { label:'Book', href:'/app/book', icon:CarFront }, { label:'Trips', href:'/app/trips', icon:CalendarDays }, { label:'Wallet', href:'/app/wallet', icon:WalletCards }, { label:'Rewards', href:'/app/rewards', icon:Gift }, { label:'Support', href:'/app/support', icon:CircleHelp },
  ],
  driver: [
    { label:'Home', href:'/driver', icon:LayoutDashboard }, { label:'Trips', href:'/driver/trips', icon:CalendarDays }, { label:'Current trip', href:'/driver/current-trip', icon:Map }, { label:'Vehicle', href:'/driver/vehicle', icon:CarFront }, { label:'Safety', href:'/driver/safety', icon:ShieldAlert },
  ],
  fleet: [
    { label:'Overview', href:'/fleet', icon:LayoutDashboard }, { label:'Vehicles', href:'/fleet/vehicles', icon:CarFront }, { label:'Drivers', href:'/fleet/drivers', icon:Users }, { label:'Maintenance', href:'/fleet/maintenance', icon:Gauge }, { label:'Reports', href:'/fleet/reports', icon:CalendarDays },
  ],
  corporate: [
    { label:'Overview', href:'/corporate', icon:LayoutDashboard }, { label:'Riders', href:'/corporate/riders', icon:Users }, { label:'Bookings', href:'/corporate/bookings', icon:CalendarDays }, { label:'Policies', href:'/corporate/policies', icon:ShieldAlert }, { label:'Invoices', href:'/corporate/invoices', icon:WalletCards },
  ],
  admin: [
    { label:'Dashboard', href:'/admin', icon:LayoutDashboard }, { label:'Live operations', href:'/admin/live-operations', icon:Map }, { label:'Customers', href:'/admin/customers', icon:Users }, { label:'Fleet', href:'/admin/vehicles', icon:CarFront }, { label:'Corporates', href:'/admin/corporates', icon:Building2 }, { label:'Safety', href:'/admin/incidents', icon:ShieldAlert },
  ],
}

export function AppShell({ kind, title, subtitle, children }: { kind: ShellKind; title: string; subtitle: string; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return <div className="app-layout"><aside className="app-sidebar"><BrandMark />
    <nav>{navigation[kind].map(({ label, href, icon: Icon }) => <a key={href} href={href} className={pathname === href ? 'active' : ''}><Icon size={18}/><span>{label}</span></a>)}</nav>
    <div className="sidebar-foot"><strong>Integration-aware</strong>Live maps, payments and telemetry only appear when connected.</div>
  </aside><section className="workspace"><header className="workspace-header"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="workspace-actions"><button className="icon-button" aria-label="Open menu"><Menu size={17}/></button><button className="icon-button" aria-label="Notifications"><Bell size={17}/></button><div className="profile-chip"><span className="avatar">DT</span><span>Demo workspace</span></div></div></header><div className="workspace-main"><div className="demo-banner"><CircleHelp size={13}/> Demo mode — illustrative records are clearly separated from production integrations.</div>{children}</div></section></div>
}
