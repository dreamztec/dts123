import { createFileRoute, Link } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { CalendarClock, CarFront, MapPin, Siren, CircleCheck } from 'lucide-react'

export const Route = createFileRoute('/admin/live-operations')({ component: LiveOperations })

type AdminOverview = { metrics: { customers:number; drivers:number; vehicles:number; bookings:number; activeBookings:number; corporates:number; openIncidents:number; unresolvedFeedback:number; notificationsLast24h:number } }

function LiveOperations() {
  const { data, loading, error } = useApi<AdminOverview>('/api/admin/overview')
  const metrics = data?.metrics
  return <AppShell kind="admin" title="Live operations" subtitle="Coordination view from live database figures">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading && <p className="notice">Loading operations…</p>}
    <div className="ops-map" style={{ marginBottom:20 }}>
      <div className="map-empty"><MapPin size={24}/><strong>Live fleet map unavailable</strong><small>Authorised vehicle telemetry appears once connected. FASTRIDES never displays invented positions.</small></div>
    </div>
    <div className="kpi-grid">
      {([['Active journeys',CarFront,metrics?.activeBookings],['Bookings recorded',CalendarClock,metrics?.bookings],['Open incidents',Siren,metrics?.openIncidents],['Unresolved feedback',CircleCheck,metrics?.unresolvedFeedback]] as Array<[string, typeof CarFront, number|undefined]>).map(([label,Icon,value]) => <article className="kpi-card" key={label}><span>{label}<Icon size={17}/></span><strong>{value == null ? '—' : String(value)}</strong><small>Live count from the database</small></article>)}
    </div>
    <div className="content-grid" style={{ marginTop:20 }}>
      <section className="panel"><div className="panel-head"><h3>Journey pipeline</h3><Link to="/admin/customers">Customer CRM</Link></div>
        <EmptyState icon={CarFront} title="Trip states load from live bookings." body="Confirmed, searching, assigned, en-route and in-progress journeys appear here as bookings progress through the trip state machine."/>
      </section>
      <section className="panel"><div className="panel-head"><h3>Safety watch</h3><Link to="/admin/incidents">Open incidents</Link></div>
        {metrics && metrics.openIncidents > 0
          ? <div className="trip-row"><span className="trip-icon"><Siren size={15}/></span><div><strong>Open incidents</strong><small>Requires operational review</small></div><span>{metrics.openIncidents}</span></div>
          : <EmptyState icon={Siren} title="No open incidents." body="SOS alerts and incident reports appear here the moment they are raised."/>}
      </section>
    </div>
  </AppShell>
}