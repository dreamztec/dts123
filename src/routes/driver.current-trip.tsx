import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { MapPin } from 'lucide-react'

export const Route = createFileRoute('/driver/current-trip')({ component: DriverCurrentTrip })

type DriverMe = {
  driver: { id:string; availabilityStatus:string } | null
  currentTrip: { id:string; status:string; startedAt:string|null; bookingReference:string|null } | null
  assignments: Array<{ id:string; status:string; bookingReference:string|null; pickup:unknown; destination:unknown; scheduledAt:string|null }>
  message?: string
}

const tripLabels: Record<string,string> = { DRIVER_ASSIGNED:'Chauffeur assigned', DRIVER_EN_ROUTE:'En route to pickup', DRIVER_ARRIVED:'Arrived at pickup', PASSENGER_ONBOARD:'Passenger onboard', IN_PROGRESS:'In progress' }

function addressOf(value: unknown): string {
  if (!value || typeof value !== 'object') return '—'
  const record = value as Record<string, unknown>
  if (typeof record.label === 'string' && record.label) return record.label
  return typeof record.address === 'string' && record.address ? record.address : 'Selected location'
}

function DriverCurrentTrip() {
  const { data, loading, error } = useApi<DriverMe>('/api/driver/me')
  const accepted = (data?.assignments ?? []).find((row) => row.status === 'ACCEPTED')
  return <AppShell kind="driver" title="Current trip" subtitle="Location updates only during authorised operational states">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading your current trip…</p>
      : !data?.driver ? <section className="panel"><EmptyState icon={MapPin} title="No chauffeur profile yet." body={data?.message ?? 'Current trip appears once FASTRIDES operations onboard you.'}/></section>
      : data.currentTrip
        ? <section className="panel"><div className="panel-head"><h3>{data.currentTrip.bookingReference ?? 'Current trip'}</h3><span className="status-badge">{tripLabels[data.currentTrip.status] ?? data.currentTrip.status}</span></div>
            <div className="sos-panel">
              <p style={{ margin:0, fontSize:10.5, color:'#777' }}>Started {data.currentTrip.startedAt ? new Date(data.currentTrip.startedAt).toLocaleString('en-NG') : '—'}</p>
              <div className="integration-state"><MapPin size={13}/>Location updates are permitted in this trip state. Open the trip in navigation with your preferred maps app.</div>
            </div>
          </section>
        : accepted
          ? <section className="panel"><div className="panel-head"><h3>{accepted.bookingReference ?? 'Accepted trip'}</h3><span className="status-badge amber">Awaiting trip start</span></div>
              <div className="sos-panel">
                <div className="trip-route"><div><small>Pickup</small><span>{addressOf(accepted.pickup)}</span></div><div><small>Destination</small><span>{addressOf(accepted.destination)}</span></div></div>
                <p style={{ margin:0, fontSize:10.5, color:'#777' }}>Scheduled {accepted.scheduledAt ? new Date(accepted.scheduledAt).toLocaleString('en-NG') : '—'}</p>
                <EmptyState icon={MapPin} title="Trip has not started." body="Location updates and the trip workflow activate when operations mark the trip in progress."/>
              </div>
            </section>
          : <section className="panel"><EmptyState icon={MapPin} title="No active assignment." body="Accepted assignments and their trip workflow appear here when dispatch offers you a trip."/></section>}
  </AppShell>
}