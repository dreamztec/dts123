import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { CalendarDays } from 'lucide-react'

export const Route = createFileRoute('/driver/trips')({ component: DriverTrips })

type DriverMe = {
  driver: { id:string } | null
  assignments: Array<{ id:string; status:string; bookingReference:string|null; pickup:unknown; destination:unknown; scheduledAt:string|null; offeredAt:string }>
  completedTrips: Array<{ id:string; status:string; completedAt:string|null; bookingReference:string|null; destination:unknown }>
  message?: string
}

const assignmentLabels: Record<string,string> = { OFFERED:'Offered to you', ACCEPTED:'Accepted', DECLINED:'Declined', EXPIRED:'Expired', CANCELLED:'Cancelled' }
const tripLabels: Record<string,string> = { COMPLETED:'Completed', CANCELLED:'Cancelled', NO_SHOW:'No show' }

function addressOf(value: unknown): string {
  if (!value || typeof value !== 'object') return '—'
  const record = value as Record<string, unknown>
  if (typeof record.label === 'string' && record.label) return record.label
  return typeof record.address === 'string' && record.address ? record.address : 'Selected location'
}

function DriverTrips() {
  const { data, loading, error } = useApi<DriverMe>('/api/driver/me')
  const assignments = data?.assignments ?? []
  const completed = data?.completedTrips ?? []
  return <AppShell kind="driver" title="Trips" subtitle="Assignments offered to you and trips you have driven">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading trips…</p> : !data?.driver
      ? <section className="panel"><EmptyState icon={CalendarDays} title="No chauffeur profile yet." body={data?.message ?? 'Trips appear here once FASTRIDES operations onboard you.'}/></section>
      : <>
        <section className="panel" style={{ marginBottom:20 }}><div className="panel-head"><h3>Assignments</h3></div>
          {assignments.length === 0
            ? <EmptyState icon={CalendarDays} title="No assignments yet." body="Trip offers from dispatch appear here with pickup, destination and time."/>
            : assignments.map((row) => <div className="trip-row" key={row.id}><span className="trip-icon"><CalendarDays size={15}/></span><div><strong>{row.bookingReference ?? 'Booking'}</strong><small>{addressOf(row.pickup)} → {addressOf(row.destination)} · {row.scheduledAt ? new Date(row.scheduledAt).toLocaleString('en-NG') : new Date(row.offeredAt).toLocaleString('en-NG')}</small></div><span>{assignmentLabels[row.status] ?? row.status}</span></div>)}
        </section>
        <section className="panel"><div className="panel-head"><h3>Completed trips</h3></div>
          {completed.length === 0
            ? <EmptyState icon={CalendarDays} title="No completed trips yet." body="Finished journeys appear here with their outcome."/>
            : completed.map((trip) => <div className="trip-row" key={trip.id}><span className="trip-icon"><CalendarDays size={15}/></span><div><strong>{trip.bookingReference ?? 'Trip'}</strong><small>To {addressOf(trip.destination)} · {trip.completedAt ? new Date(trip.completedAt).toLocaleString('en-NG') : '—'}</small></div><span>{tripLabels[trip.status] ?? trip.status}</span></div>)}
        </section>
      </>}
  </AppShell>
}