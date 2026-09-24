import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarClock, CarFront, CircleCheck, Gauge, MapPin, ShieldCheck, ShieldAlert, Siren, Users, WalletCards, Building2 } from 'lucide-react'
import { AppShell } from './AppShell'
import { EmptyState } from './EmptyState'
import { useApi } from '@/lib/api-client'

const noData = '—'

function addressOf(value: unknown): string {
  if (!value || typeof value !== 'object') return '—'
  const record = value as Record<string, unknown>
  if (typeof record.label === 'string' && record.label) return record.label
  return typeof record.address === 'string' && record.address ? record.address : 'Selected location'
}

/* ============================= DRIVER ============================= */

type DriverMe = {
  driver: { id:string; availabilityStatus:string; completedTrips:number; rating:string; safetyScore:string; driverLevelCode:string } | null
  level: { name:string } | null
  vehicle: { make:string; model:string; plateNumber:string } | null
  assignments: Array<{ id:string; status:string; bookingReference:string|null; pickup:unknown; destination:unknown; offeredAt:string }>
  currentTrip: { id:string; status:string; bookingReference:string|null } | null
  completedTrips: Array<{ id:string; status:string; completedAt:string|null; bookingReference:string|null; destination:unknown }>
  user: { fullName:string } | null
  message?: string
}

const assignmentLabels: Record<string,string> = { OFFERED:'Offered to you', ACCEPTED:'Accepted', DECLINED:'Declined', EXPIRED:'Expired', CANCELLED:'Cancelled' }
const tripStatusLabels: Record<string,string> = { DRIVER_ASSIGNED:'Chauffeur assigned', DRIVER_EN_ROUTE:'En route', DRIVER_ARRIVED:'Arrived', PASSENGER_ONBOARD:'Passenger onboard', IN_PROGRESS:'In progress' }

export function DriverDashboard() {
  const { data, loading, error } = useApi<DriverMe>('/api/driver/me')
  const driver = data?.driver ?? null
  const level = data?.level ?? null
  const vehicle = data?.vehicle ?? null
  const openAssignments = (data?.assignments ?? []).filter((row) => ['OFFERED','ACCEPTED'].includes(row.status))
  const [busy, setBusy] = useState(false)

  async function setAvailability(next:'available'|'offline') {
    setBusy(true)
    try {
      await fetch('/api/driver/availability', { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'same-origin', body: JSON.stringify({ status: next }) })
      window.location.reload()
    } finally { setBusy(false) }
  }

  const online = driver?.availabilityStatus === 'available'
  return <AppShell kind="driver" title="Chauffeur workspace" subtitle="FASTRIDES · Your dream destination...on time.">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading your workspace…</p> : !driver
      ? <section className="panel"><EmptyState icon={CarFront} title="No chauffeur profile yet." body={data?.message ?? 'Registration and verification appear here once FASTRIDES operations onboard you.'} /></section>
      : <>
        <div className="dashboard-hero">
          <section className="welcome-card"><p>{data?.user?.fullName}</p><h2>{online ? 'You are available.' : 'You are offline.'}</h2><p>{online ? 'FASTRIDES dispatch can assign eligible trips.' : 'Go online only when ready and assigned to an approved vehicle.'}</p>
            <button className="button button-primary" disabled={busy} onClick={() => setAvailability(online ? 'offline' : 'available')}>{busy ? 'Updating…' : online ? 'Go offline' : 'Go online'}</button>
          </section>
          <section className="membership-summary"><p className="overline">Assigned vehicle</p>
            <h3>{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Not assigned yet'}</h3>
            <p>{vehicle ? `Plate ${vehicle.plateNumber}` : 'Your assigned vehicle appears here once fleet operations assign you one.'}</p>
            <div className="credit-row"><span>Completed trips<strong>{driver.completedTrips}</strong></span><span>Rating<strong>{Number(driver.rating) > 0 ? Number(driver.rating).toFixed(2) : noData}</strong></span><span>Level<strong>{level?.name ?? driver.driverLevelCode}</strong></span></div>
          </section>
        </div>
        <div className="quick-grid">
          <Link to="/driver/availability" className="quick-card"><Gauge size={20}/><strong>Availability</strong><small>{online ? 'Currently online' : 'Currently offline'}</small></Link>
          <Link to="/driver/trips" className="quick-card"><CalendarClock size={20}/><strong>Trips</strong><small>Assignments and history</small></Link>
          <Link to="/driver/current-trip" className="quick-card"><MapPin size={20}/><strong>Current trip</strong><small>{data?.currentTrip ? tripStatusLabels[data.currentTrip.status] ?? 'In progress' : 'No active assignment'}</small></Link>
          <Link to="/driver/safety" className="quick-card"><Siren size={20}/><strong>Safety & SOS</strong><small>Escalation tools</small></Link>
        </div>
        <div className="content-grid" style={{ marginTop:20 }}>
          <section className="panel"><div className="panel-head"><h3>Assignments</h3><Link to="/driver/trips">View all</Link></div>
            {openAssignments.length === 0
              ? <EmptyState icon={CarFront} title="No active assignment." body="Accepted assignments and their trip workflow appear here when dispatch offers you a trip." />
              : openAssignments.map((row) => <div className="trip-row" key={row.id}><span className="trip-icon"><CalendarClock size={15}/></span><div><strong>{row.bookingReference ?? 'Booking'}</strong><small>{addressOf(row.pickup)} → {addressOf(row.destination)}</small></div><span>{assignmentLabels[row.status] ?? row.status}</span></div>)}
          </section>
          <section className="panel"><div className="panel-head"><h3>Current trip</h3><Link to="/driver/current-trip">Open</Link></div>
            {data?.currentTrip
              ? <div className="trip-row"><span className="trip-icon"><MapPin size={15}/></span><div><strong>{data.currentTrip.bookingReference ?? 'Trip'}</strong><small>{tripStatusLabels[data.currentTrip.status] ?? data.currentTrip.status}</small></div><span>{data.currentTrip.status}</span></div>
              : <EmptyState icon={MapPin} title="No trip in progress." body="Location updates start only from an authorised active trip state." />}
          </section>
        </div>
      </>}
  </AppShell>
}

/* ============================= SHARED OVERVIEW METRICS ============================= */

type AdminOverview = {
  metrics: { customers:number; drivers:number; vehicles:number; bookings:number; activeBookings:number; corporates:number; openIncidents:number; unresolvedFeedback:number; notificationsLast24h:number }
}

/* ============================= FLEET ============================= */

export function FleetDashboard() {
  const { data, loading, error } = useApi<AdminOverview>('/api/admin/overview')
  const metrics = data?.metrics
  return <AppShell kind="fleet" title="Fleet management" subtitle="Vehicles, chauffeurs, costs and compliance">
    {error && <p className="notice" role="alert">{error}</p>}
    <div className="kpi-grid">
      {([['Vehicles',CarFront,metrics ? String(metrics.vehicles) : null],['Available',Gauge,metrics ? String(Math.max(metrics.vehicles - metrics.activeBookings, 0)) : null],['Active bookings',CalendarClock,metrics ? String(metrics.activeBookings) : null],['Chauffeurs',Users,metrics ? String(metrics.drivers) : null]] as Array<[string, typeof CarFront, string|null]>).map(([label,Icon,value]) => <article className="kpi-card" key={label}><span>{label}<Icon size={17}/></span><strong>{value ?? noData}</strong><small>{value == null ? 'Counts load from the database' : 'Live count from fleet records'}</small></article>)}
    </div>
    {loading && <p className="notice">Loading fleet records…</p>}
    <div className="content-grid">
      <section className="panel"><div className="panel-head"><h3>Fleet map</h3></div>
        <div className="ops-map"><div className="map-empty"><MapPin size={24}/><strong>Live map not yet available</strong><small>Authorised vehicle locations appear once telemetry is connected. No position data is invented.</small></div></div>
      </section>
      <section className="panel"><div className="panel-head"><h3>Register & compliance</h3></div>
        <EmptyState icon={CarFront} title="Operational records live in the database." body="Vehicle, chauffeur and maintenance records are managed through the operations database and appear here as they are recorded." />
      </section>
    </div>
    <div className="quick-grid" style={{ marginTop:20 }}>
      <Link to="/fleet/vehicles" className="quick-card"><CarFront size={20}/><strong>Vehicles</strong><small>Classes, assignments, compliance</small></Link>
      <Link to="/fleet/drivers" className="quick-card"><Users size={20}/><strong>Chauffeurs</strong><small>Verification and availability</small></Link>
      <Link to="/fleet/maintenance" className="quick-card"><Gauge size={20}/><strong>Maintenance</strong><small>Service and document records</small></Link>
      <Link to="/fleet/reports" className="quick-card"><CalendarClock size={20}/><strong>Reports</strong><small>Operational reporting</small></Link>
    </div>
  </AppShell>
}

/* ============================= CORPORATE ============================= */

export function CorporateDashboard() {
  const { data, loading, error } = useApi<AdminOverview>('/api/admin/overview')
  const metrics = data?.metrics
  return <AppShell kind="corporate" title="Corporate mobility" subtitle="Policies, riders, approvals and billing">
    {error && <p className="notice" role="alert">{error}</p>}
    <div className="kpi-grid">
      {([['Corporate accounts',Users,metrics ? String(metrics.corporates) : null],['Bookings',CalendarClock,metrics ? String(metrics.bookings) : null],['Active trips',CarFront,metrics ? String(metrics.activeBookings) : null],['Open incidents',ShieldAlert,metrics ? String(metrics.openIncidents) : null]] as Array<[string, typeof CarFront, string|null]>).map(([label,Icon,value]) => <article className="kpi-card" key={label}><span>{label}<Icon size={17}/></span><strong>{value ?? noData}</strong><small>{value == null ? 'Counts load from the database' : 'Live count from account records'}</small></article>)}
    </div>
    {loading && <p className="notice">Loading account records…</p>}
    <section className="panel table-panel"><div className="panel-head"><h3>Booking approvals</h3><Link to="/corporate/policies">Manage policies</Link></div>
      <table className="data-table"><thead><tr><th>Rider</th><th>Journey</th><th>Class</th><th>Policy</th><th>Status</th></tr></thead><tbody><tr><td colSpan={5}><EmptyState icon={Users} title="No approvals pending." body="Requests appear here when riders book under an approval policy."/></td></tr></tbody></table>
    </section>
    <div className="quick-grid" style={{ marginTop:20 }}>
      <Link to="/corporate/riders" className="quick-card"><Users size={20}/><strong>Riders</strong><small>Employees, departments, limits</small></Link>
      <Link to="/corporate/bookings" className="quick-card"><CalendarClock size={20}/><strong>Bookings</strong><small>Business journeys and approvals</small></Link>
      <Link to="/corporate/policies" className="quick-card"><ShieldCheck size={20}/><strong>Policies</strong><small>Spend and class rules</small></Link>
      <Link to="/corporate/invoices" className="quick-card"><WalletCards size={20}/><strong>Invoices</strong><small>Statements and billing</small></Link>
    </div>
  </AppShell>
}

/* ============================= ADMIN ============================= */

export function AdminDashboard() {
  const { data, loading, error } = useApi<AdminOverview>('/api/admin/overview')
  const metrics = data?.metrics
  return <AppShell kind="admin" title="FASTRIDES operations" subtitle="Live figures straight from the operations database">
    {error && <p className="notice" role="alert">{error}</p>}
    <div className="kpi-grid">
      {([['Customers',Users,metrics?.customers],['Active trips',CarFront,metrics?.activeBookings],['Open incidents',ShieldAlert,metrics?.openIncidents],['Vehicles',CarFront,metrics?.vehicles]] as Array<[string, typeof CarFront, number|undefined]>).map(([label,Icon,value]) => <article className="kpi-card" key={label}><span>{label}<Icon size={17}/></span><strong>{value == null ? noData : String(value)}</strong><small>Live count from the database</small></article>)}
    </div>
    {loading && <p className="notice">Loading operations metrics…</p>}
    <div className="content-grid">
      <section className="panel"><div className="panel-head"><h3>Live operations</h3><Link to="/admin/live-operations">Open full view</Link></div>
        <div className="ops-map"><div className="map-empty"><MapPin size={24}/><strong>Fleet location unavailable</strong><small>No fabricated GPS is shown. Authorised location streaming appears once telemetry is connected.</small></div></div>
      </section>
      <section className="panel"><div className="panel-head"><h3>Operations queue</h3></div>
        {([['Bookings recorded',CalendarClock,metrics ? String(metrics.bookings) : null],['Active journeys',CarFront,metrics ? String(metrics.activeBookings) : null],['Open incidents',Siren,metrics ? String(metrics.openIncidents) : null],['Unresolved feedback',CircleCheck,metrics ? String(metrics.unresolvedFeedback) : null]] as Array<[string, typeof CarFront, string|null]>).map(([label,Icon,value]) => <div className="trip-row" key={label}><span className="trip-icon"><Icon size={15}/></span><div><strong>{label}</strong><small>From live records</small></div><span>{value ?? noData}</span></div>)}
      </section>
    </div>
    <div className="quick-grid" style={{ marginTop:20 }}>
      <Link to="/admin/customers" className="quick-card"><Users size={20}/><strong>Customers</strong><small>Profiles and support</small></Link>
      <Link to="/admin/vehicles" className="quick-card"><CarFront size={20}/><strong>Fleet</strong><small>Vehicles and compliance</small></Link>
      <Link to="/admin/corporates" className="quick-card"><Building2 size={20}/><strong>Corporates</strong><small>Contracts and credit</small></Link>
      <Link to="/admin/incidents" className="quick-card"><ShieldAlert size={20}/><strong>Safety</strong><small>Incidents and SOS review</small></Link>
    </div>
  </AppShell>
}