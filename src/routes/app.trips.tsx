import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'
import { useIdentity } from '@/lib/identity-context'
import { fetchMyBookings, formatNaira, type BookingSummary } from '@/lib/estimate-client'

function formatWhen(iso: string | null, fallback: string) {
  if (!iso) return fallback
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

function addressOf(value: unknown): string {
  if (!value || typeof value !== 'object') return '—'
  const record = value as Record<string, unknown>
  return typeof record.address === 'string' && record.address ? record.address : 'Selected location'
}

function fareOf(booking: BookingSummary): string {
  const pricing = booking.estimate?.pricing
  return pricing?.connected && typeof pricing.estimate === 'number' ? formatNaira(pricing.estimate) : '—'
}

function BookingCard({ booking }: { booking: BookingSummary }) {
  return <article className="trip-card">
    <div className="trip-card-head">
      <strong>{booking.reference}</strong>
      <span className={`trip-status trip-status-${booking.status.toLowerCase()}`}>{booking.status.replaceAll('_',' ')}</span>
    </div>
    <div className="trip-route">
      <div><small>Pickup</small><span>{addressOf(booking.pickup)}</span></div>
      <div><small>Destination</small><span>{addressOf(booking.destination)}</span></div>
    </div>
    <div className="trip-meta">
      <span>{formatWhen(booking.scheduledAt ?? booking.createdAt, '—')}</span>
      <span>{booking.vehicleClassName ?? booking.vehicleClassCode ?? '—'} · {booking.passengerCount} passenger(s)</span>
      <span className="trip-fare">{fareOf(booking)}</span>
    </div>
  </article>
}

function MyTripsWorkspace() {
  const navigate = useNavigate()
  const { user, ready } = useIdentity()
  const [bookings, setBookings] = useState<BookingSummary[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready) return
    if (!user) { navigate({ to:'/login' }); return }
    let cancelled = false
    fetchMyBookings().then((result) => {
      if (cancelled) return
      if ('error' in result) setError(result.error)
      else setBookings(result.bookings)
    })
    return () => { cancelled = true }
  }, [ready, user, navigate])

  if (!user) return null
  return <AppShell kind="customer" title="My trips" subtitle="Confirmed journeys, measured by road route and priced from live configuration.">
    <section className="panel">
      <div className="panel-head"><h3>Recent bookings</h3><Link className="button button-small button-primary" to="/app/book">Book a ride</Link></div>
      <div style={{ padding:28 }}>
        {error && <p className="notice" role="alert">{error}</p>}
        {bookings === null && !error && <p style={{ color:'#777', fontSize:13 }}>Loading your bookings…</p>}
        {bookings?.length === 0 && <p style={{ color:'#777', fontSize:13 }}>No trips yet. Plan your first journey and the fare will be calculated from the real road route.</p>}
        {bookings && bookings.length > 0 && <div className="trip-list">{bookings.map((booking) => <BookingCard key={booking.reference} booking={booking} />)}</div>}
      </div>
    </section>
  </AppShell>
}

export const Route = createFileRoute('/app/trips')({ component: MyTripsWorkspace })
