import { createFileRoute, Link } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { CarFront } from 'lucide-react'
import { formatNaira } from '@/lib/estimate-client'

type BookingRow = { id:string; reference:string; status:string; tripType:string; scheduledAt:string|null; pickup:{ label?:string }; destination:{ label?:string }; passengerCount:number; estimate:{ price:number|null; connected:boolean }; cityName:string|null; vehicleClassName:string|null; createdAt:string }
type Payload = { bookings:BookingRow[]; total:number }

export const Route = createFileRoute('/app/trips')({ component: MyTripsWorkspace })

const statusLabels: Record<string,string> = { DRAFT:'Draft', PENDING_PAYMENT:'Pending payment', CONFIRMED:'Confirmed', SEARCHING_DRIVER:'Finding chauffeur', DRIVER_ASSIGNED:'Chauffeur assigned', DRIVER_EN_ROUTE:'Chauffeur en route', DRIVER_ARRIVED:'Arrived', PASSENGER_ONBOARD:'Passenger onboard', IN_PROGRESS:'In progress', COMPLETED:'Completed', CANCELLED:'Cancelled', NO_SHOW:'No show', INCIDENT:'Incident', REFUNDED:'Refunded' }

function formatWhen(iso: string | null, fallback: string) {
  if (!iso) return fallback
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

function addressOf(value: unknown): string {
  if (!value || typeof value !== 'object') return '—'
  const record = value as Record<string, unknown>
  if (typeof record.label === 'string' && record.label) return record.label
  return typeof record.address === 'string' && record.address ? record.address : 'Selected location'
}

function fareOf(booking: BookingRow): string {
  const pricing = booking.estimate
  return pricing?.connected && typeof pricing.price === 'number' ? formatNaira(pricing.price) : '—'
}

function BookingCard({ booking }: { booking: BookingRow }) {
  return <article className="trip-card">
    <div className="trip-card-head">
      <strong>{booking.reference}</strong>
      <span className={`trip-status trip-status-${booking.status.toLowerCase()}`}>{statusLabels[booking.status] ?? booking.status.replaceAll('_',' ')}</span>
    </div>
    <div className="trip-route">
      <div><small>Pickup</small><span>{addressOf(booking.pickup)}</span></div>
      <div><small>Destination</small><span>{addressOf(booking.destination)}</span></div>
    </div>
    <div className="trip-meta">
      <span>{formatWhen(booking.scheduledAt ?? booking.createdAt, '—')}</span>
      <span>{booking.vehicleClassName ?? 'Class pending'} · {booking.passengerCount} passenger(s)</span>
      <span className="trip-fare">{fareOf(booking)}</span>
    </div>
  </article>
}

function MyTripsWorkspace() {
  const { data, loading, error } = useApi<Payload>('/api/bookings')
  const bookings = data?.bookings ?? []
  return <AppShell kind="customer" title="My trips" subtitle="Confirmed journeys, measured by road route and priced from live configuration.">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading trips…</p> : bookings.length === 0
      ? <section className="panel"><EmptyState icon={CarFront} title="No trips yet." body="Plan your first journey and the fare will be calculated from the real road route." action={<Link className="button button-primary" to="/app/book">Book a ride</Link>}/></section>
      : <section className="panel"><div className="panel-head"><h3>Recent bookings</h3><span>{data?.total ?? bookings.length} total</span></div><div className="trip-list" style={{ padding:28 }}>{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}</div></section>}
  </AppShell>
}
