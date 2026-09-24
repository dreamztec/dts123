import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Gauge } from 'lucide-react'

export const Route = createFileRoute('/driver/availability')({ component: DriverAvailability })

type AvailabilityPayload = { driver:{ id:string; availabilityStatus:string } | null; history:Array<{ id:string; status:string; startedAt:string; endedAt:string|null }>; message?:string }
type DriverMe = { driver:{ id:string; availabilityStatus:string } | null }

const statusLabels: Record<string,string> = { available:'Available', offline:'Offline', paused:'Paused', unavailable:'Unavailable', assigned:'Assigned', arriving:'Arriving', arrived:'Arrived', on_trip:'On trip' }

function DriverAvailability() {
  const { data, loading, error, refetch } = useApi<AvailabilityPayload>('/api/driver/availability')
  const { data: me } = useApi<DriverMe>('/api/driver/me')
  const [busy, setBusy] = useState(false)
  const current = data?.driver?.availabilityStatus ?? me?.driver?.availabilityStatus ?? null
  const online = current === 'available'

  async function setStatus(next:'available'|'offline') {
    setBusy(true)
    try {
      const response = await fetch('/api/driver/availability', { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'same-origin', body: JSON.stringify({ status: next }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Could not update availability')
      refetch?.()
    } finally { setBusy(false) }
  }

  const history = data?.history ?? []
  return <AppShell kind="driver" title="Availability" subtitle="Go online for assignments, or offline to rest">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading availability…</p> : !data?.driver
      ? <section className="panel"><EmptyState icon={Gauge} title="No chauffeur profile yet." body={data?.message ?? 'Availability opens once FASTRIDES operations onboard you.'}/></section>
      : <div className="content-grid">
          <section className="panel"><div className="panel-head"><h3>Current status</h3></div>
            <div className="sos-panel">
              <p style={{ margin:0, font:'700 20px "Manrope"' }}>{statusLabels[current ?? 'offline'] ?? current}</p>
              <p style={{ margin:0, fontSize:10.5, color:'#777' }}>{online ? 'Dispatch can offer you eligible trips.' : 'You will not receive new assignments while offline.'}</p>
              <button className="button button-primary" disabled={busy} onClick={() => setStatus(online ? 'offline' : 'available')}>{busy ? 'Updating…' : online ? 'Go offline' : 'Go online'}</button>
            </div>
          </section>
          <section className="panel"><div className="panel-head"><h3>Availability history</h3></div>
            {history.length === 0
              ? <EmptyState icon={Gauge} title="No sessions recorded yet." body="Every online session is recorded here with its start and end time."/>
              : history.map((entry) => <div className="trip-row" key={entry.id}><span className="trip-icon"><Gauge size={15}/></span><div><strong>{statusLabels[entry.status] ?? entry.status}</strong><small>{new Date(entry.startedAt).toLocaleString('en-NG')} → {entry.endedAt ? new Date(entry.endedAt).toLocaleTimeString('en-NG') : 'ongoing'}</small></div><span>{statusLabels[entry.status] ?? entry.status}</span></div>)}
          </section>
        </div>}
  </AppShell>
}