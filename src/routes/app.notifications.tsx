import { createFileRoute, Link } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Bell } from 'lucide-react'

type NotificationsPayload = {
  notifications: Array<{ id:string; subject:string|null; content:unknown; status:string; createdAt:string }>
  deliveryIntents: Array<{ id:string; channel:string; templateKey:string; subject:string|null; status:string; createdAt:string }>
  note: string
}

export const Route = createFileRoute('/app/notifications')({ component: NotificationsPage })

function contentText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const record = content as Record<string, unknown>
  const reference = typeof record.reference === 'string' ? record.reference : null
  const note = typeof record.note === 'string' ? record.note : null
  const delivery = typeof record.delivery === 'string' ? record.delivery : null
  return [reference, note ?? delivery].filter(Boolean).join(' · ')
}

function NotificationsPage() {
  const { data, loading, error } = useApi<NotificationsPayload>('/api/notifications')
  const notifications = data?.notifications ?? []
  return <AppShell kind="customer" title="Notifications" subtitle="Trip updates and account messages">
    {error && <p className="notice" role="alert">{error}</p>}
    <section className="panel">
      <div className="panel-head"><h3>In-app notifications</h3></div>
      {loading ? <p className="notice" style={{ padding:20 }}>Loading notifications…</p>
        : notifications.length === 0
          ? <EmptyState icon={Bell} title="No notifications yet." body="Booking confirmations, trip updates and account messages appear here." action={<Link className="button button-primary" to="/app/book">Book a ride</Link>}/>
          : notifications.map((item) => <div className="trip-row" key={item.id}><span className="trip-icon"><Bell size={15}/></span><div><strong>{item.subject ?? 'FASTRIDES update'}</strong><small>{contentText(item.content) || new Date(item.createdAt).toLocaleString('en-NG')}</small></div><span>{new Date(item.createdAt).toLocaleDateString('en-NG')}</span></div>)}
    </section>
    <section className="panel" style={{ marginTop:20 }}>
      <div className="panel-head"><h3>Delivery channels</h3></div>
      {(data?.deliveryIntents ?? []).length === 0
        ? <EmptyState icon={Bell} title="No external messages sent yet." body={data?.note ?? 'SMS, email and WhatsApp delivery starts once those providers are connected. In-app messages are always delivered.'}/>
        : data!.deliveryIntents.map((intent) => <div className="trip-row" key={intent.id}><span className="trip-icon"><Bell size={15}/></span><div><strong>{intent.subject ?? intent.templateKey}</strong><small>{intent.channel} · {new Date(intent.createdAt).toLocaleString('en-NG')}</small></div><span>{intent.status}</span></div>)}
      {data?.note && <p className="notice" style={{ padding:'0 22px 18px' }}>{data.note}</p>}
    </section>
  </AppShell>
}