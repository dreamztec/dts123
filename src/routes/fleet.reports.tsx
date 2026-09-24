import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { CalendarClock } from 'lucide-react'

export const Route = createFileRoute('/fleet/reports')({ component: FleetReports })

type AdminOverview = { metrics: { customers:number; drivers:number; vehicles:number; bookings:number; activeBookings:number; corporates:number; openIncidents:number; unresolvedFeedback:number; notificationsLast24h:number } }

function FleetReports() {
  const { data, loading, error } = useApi<AdminOverview>('/api/admin/overview')
  const metrics = data?.metrics
  return <AppShell kind="fleet" title="Fleet reports" subtitle="Operational figures straight from the database">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading reports…</p> : <>
      <div className="kpi-grid">
        {([['Vehicles',metrics ? String(metrics.vehicles) : null],['Chauffeurs',metrics ? String(metrics.drivers) : null],['Bookings',metrics ? String(metrics.bookings) : null],['Active trips',metrics ? String(metrics.activeBookings) : null]] as Array<[string,string|null]>).map(([label,value]) => <article className="kpi-card" key={label}><span>{label}</span><strong>{value ?? '—'}</strong><small>Live count from the database</small></article>)}
      </div>
      <section className="panel"><div className="panel-head"><h3>Utilisation & cost reporting</h3></div>
        <EmptyState icon={CalendarClock} title="Detailed reporting is being prepared." body="Utilisation, fuel/energy cost and contribution reports generate from recorded trips, fuel and maintenance data once operating history accumulates. Counts above are live database figures — nothing is estimated."/>
      </section>
    </>}
  </AppShell>
}