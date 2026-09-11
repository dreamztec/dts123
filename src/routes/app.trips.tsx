import { createFileRoute, Link } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { CarFront } from 'lucide-react'

type BookingRow = { id:string; reference:string; status:string; tripType:string; scheduledAt:string|null; pickup:{label:string}; destination:{label:string}; estimate:{ price:number|null; connected:boolean }; cityName:string|null; vehicleClassName:string|null; createdAt:string }
type Payload = { bookings:BookingRow[]; total:number }

export const Route = createFileRoute('/app/trips')({ component: TripsPage })

const statusLabels: Record<string,string> = { DRAFT:'Draft', PENDING_PAYMENT:'Pending payment', CONFIRMED:'Confirmed', SEARCHING_DRIVER:'Finding chauffeur', DRIVER_ASSIGNED:'Chauffeur assigned', DRIVER_EN_ROUTE:'Chauffeur en route', DRIVER_ARRIVED:'Arrived', PASSENGER_ONBOARD:'Passenger onboard', IN_PROGRESS:'In progress', COMPLETED:'Completed', CANCELLED:'Cancelled', NO_SHOW:'No show', INCIDENT:'Incident', REFUNDED:'Refunded' }

function TripsPage() {
  const { data, loading, error } = useApi<Payload>('/api/bookings')
  const bookings = data?.bookings ?? []
  return <AppShell kind="customer" title="My trips" subtitle="Upcoming, active and completed journeys">
    {error && <p className="notice">{error}</p>}
    {loading ? <p className="notice">Loading trips…</p> : bookings.length === 0
      ? <section className="panel"><EmptyState icon={CarFront} title="No trips yet." body="Your upcoming and completed journeys appear here. Book your first ride to get started." action={<Link className="button button-primary" to="/app/book">Book a ride</Link>}/></section>
      : <section className="panel"><div className="panel-head"><h3>All bookings</h3><span>{data?.total ?? bookings.length} total</span></div>{bookings.map((booking) => <div className="trip-row" key={booking.id}><span className="trip-icon"><CarFront size={16}/></span><div><strong>{booking.pickup?.label ?? 'Pickup'} → {booking.destination?.label ?? 'Destination'}</strong><small>{booking.reference} · {booking.cityName ?? '—'} · {booking.vehicleClassName ?? 'Class pending'}</small></div><span>{statusLabels[booking.status] ?? booking.status}</span></div>)}</section>}
  </AppShell>
}