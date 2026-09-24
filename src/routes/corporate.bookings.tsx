import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { CalendarDays } from 'lucide-react'

export const Route = createFileRoute('/corporate/bookings')({ component: CorporateBookings })

type AccountPayload = { user: { role:string } }
type BookingsPayload = { bookings: Array<{ id:string; reference:string; status:string; tripType:string; pickup:unknown; destination:unknown; scheduledAt:string|null; passengerCount:number; createdAt:string; bookerName?:string|null }> }

const statusLabels: Record<string,string> = { DRAFT:'Draft', PENDING_PAYMENT:'Pending payment', CONFIRMED:'Confirmed', SEARCHING_DRIVER:'Finding chauffeur', DRIVER_ASSIGNED:'Chauffeur assigned', DRIVER_EN_ROUTE:'En route', DRIVER_ARRIVED:'Arrived', PASSENGER_ONBOARD:'Passenger onboard', IN_PROGRESS:'In progress', COMPLETED:'Completed', CANCELLED:'Cancelled' }

function addressOf(value: unknown): string {
  if (!value || typeof value !== 'object') return '—'
  const record = value as Record<string, unknown>
  if (typeof record.label === 'string' && record.label) return record.label
  return typeof record.address === 'string' && record.address ? record.address : 'Selected location'
}

function CorporateBookings() {
  const { data: account } = useApi<AccountPayload>('/api/account')
  const isCorporate = account?.user?.role === 'corporate_admin' || account?.user?.role === 'corporate_rider'
  const { data, loading, error } = useApi<BookingsPayload>(isCorporate ? '/api/corporate/bookings' : null)
  const bookings = data?.bookings ?? []
  return <AppShell kind="corporate" title="Corporate bookings" subtitle="Approvals, recurring transport and executive journeys">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading bookings…</p>
      : !isCorporate
        ? <section className="panel"><EmptyState icon={CalendarDays} title="Corporate workspace is for corporate accounts." body="Log in with your company account to review business bookings."/></section>
        : bookings.length === 0
          ? <section className="panel"><EmptyState icon={CalendarDays} title="No corporate bookings yet." body="Business journeys made by your riders appear here with their approval status."/></section>
          : <section className="panel table-panel"><div className="panel-head"><h3>Recent bookings</h3></div>
            <table className="data-table"><thead><tr><th>Reference</th><th>Rider</th><th>Journey</th><th>When</th><th>Status</th></tr></thead><tbody>
              {bookings.map((booking) => <tr key={booking.id}><td><strong>{booking.reference}</strong></td><td>{booking.bookerName ?? '—'}</td><td>{addressOf(booking.pickup)} → {addressOf(booking.destination)}</td><td>{booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString('en-NG') : new Date(booking.createdAt).toLocaleString('en-NG')}</td><td><span className="status-badge">{statusLabels[booking.status] ?? booking.status}</span></td></tr>)}
            </tbody></table>
          </section>}
  </AppShell>
}