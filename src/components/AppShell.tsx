import { useState, useEffect } from 'react'
import { useRouterState, useNavigate, Link } from '@tanstack/react-router'
import { Bell, Building2, CalendarDays, CarFront, CircleHelp, Gauge, Gift, LayoutDashboard, LogOut, Map, Menu, ShieldAlert, UserRound, Users, WalletCards, X } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { useIdentity } from '@/lib/identity-context'

type ShellKind = 'customer' | 'driver' | 'fleet' | 'corporate' | 'admin'
const navigation: Record<ShellKind, { label: string; href: string; icon: typeof Gauge }[]> = {
  customer: [
    { label: 'Home', href: '/app', icon: LayoutDashboard }, { label: 'Book', href: '/app/book', icon: CarFront }, { label: 'Trips', href: '/app/trips', icon: CalendarDays }, { label: 'Wallet', href: '/app/wallet', icon: WalletCards }, { label: 'Rewards', href: '/app/rewards', icon: Gift }, { label: 'Membership', href: '/membership', icon: Gift }, { label: 'Support', href: '/app/support', icon: CircleHelp }, { label: 'Account', href: '/app/account', icon: UserRound }, { label: 'Safety', href: '/safety', icon: ShieldAlert },
  ],
  driver: [
    { label: 'Dashboard', href: '/driver', icon: LayoutDashboard }, { label: 'Availability', href: '/driver/availability', icon: Gauge }, { label: 'Trips', href: '/driver/trips', icon: CalendarDays }, { label: 'Current trip', href: '/driver/current-trip', icon: Map }, { label: 'Vehicle', href: '/driver/vehicle', icon: CarFront }, { label: 'Earnings', href: '/driver/earnings', icon: WalletCards }, { label: 'Safety', href: '/driver/safety', icon: ShieldAlert },
  ],
  fleet: [
    { label: 'Overview', href: '/fleet', icon: LayoutDashboard }, { label: 'Vehicles', href: '/fleet/vehicles', icon: CarFront }, { label: 'Drivers', href: '/fleet/drivers', icon: Users }, { label: 'Maintenance', href: '/fleet/maintenance', icon: Gauge }, { label: 'Reports', href: '/fleet/reports', icon: CalendarDays },
  ],
  corporate: [
    { label: 'Overview', href: '/corporate', icon: LayoutDashboard }, { label: 'Riders', href: '/corporate/riders', icon: Users }, { label: 'Bookings', href: '/corporate/bookings', icon: CalendarDays }, { label: 'Policies', href: '/corporate/policies', icon: ShieldAlert }, { label: 'Invoices', href: '/corporate/invoices', icon: WalletCards },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard }, { label: 'Live operations', href: '/admin/live-operations', icon: Map }, { label: 'Customers', href: '/admin/customers', icon: Users }, { label: 'Fleet', href: '/admin/vehicles', icon: CarFront }, { label: 'Corporates', href: '/admin/corporates', icon: Building2 }, { label: 'Safety', href: '/admin/incidents', icon: ShieldAlert },
  ],
}

function isActive(pathname: string, href: string) {
  if (href === '/membership' || href === '/safety') return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShell({ kind, title, subtitle, children }: { kind: ShellKind; title: string; subtitle: string; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const { user, logout } = useIdentity()
  const [menuOpen, setMenuOpen] = useState(false)
  const email = user?.email ?? ''

  useEffect(() => { setMenuOpen(false) }, [pathname])

  async function signOut() {
    try { await logout() } catch { /* session already ended */ }
    await navigate({ to: '/login' })
  }

  return <div className={`app-layout ${menuOpen ? 'nav-open' : ''}`}>
    <div className="nav-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
    <aside className="app-sidebar">
      <BrandMark />
      <nav aria-label={`${kind} navigation`}>
        {navigation[kind].map(({ label, href, icon: Icon }) => (
          <Link key={href} to={href} className={isActive(pathname, href) ? 'active' : ''}>
            <Icon size={18}/><span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <strong>FASTRIDES</strong>
        A mobility service by Dreamz Transportz Servicez (DTS).
      </div>
    </aside>
    <section className="workspace">
      <header className="workspace-header">
        <div className="workspace-title">
          <button className="icon-button menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={17}/> : <Menu size={17}/>}
          </button>
          <div><h1>{title}</h1><p>{subtitle}</p></div>
        </div>
        <div className="workspace-actions">
          <button className="icon-button" aria-label="Notifications" onClick={() => navigate({ to: '/app/notifications' })}><Bell size={17}/></button>
          {email
            ? <button className="profile-chip" onClick={signOut} title="Log out"><span className="avatar">{email.slice(0, 2).toUpperCase()}</span><span className="profile-email">{email}</span><LogOut size={13}/></button>
            : <Link className="profile-chip" to="/login"><span className="avatar">FA</span><span>Log in</span></Link>}
        </div>
      </header>
      <div className="workspace-main">{children}</div>
    </section>
  </div>
}