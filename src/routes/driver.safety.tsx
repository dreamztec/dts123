import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Siren, ShieldAlert } from 'lucide-react'

export const Route = createFileRoute('/driver/safety')({ component: DriverSafety })

type SosPayload = {
  alerts: Array<{ id:string; status:string; details:string|null; locationAvailable:boolean; createdAt:string }>
  emergencyContacts: Array<{ id:string; name:string; phone:string }>
}

function DriverSafety() {
  const { data, loading, error, refetch } = useApi<SosPayload>('/api/sos')
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  async function raiseSos() {
    setSending(true); setStatus('')
    try {
      const coordinates = await new Promise<{ latitude:number; longitude:number } | null>((resolve) => {
        if (!navigator.geolocation) { resolve(null); return }
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8_000 },
        )
      })
      const response = await fetch('/api/sos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ details: details.trim() || undefined, coordinates }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Could not raise the alert')
      setStatus(typeof body.message === 'string' ? body.message : 'SOS recorded.')
      setDetails('')
      refetch?.()
    } catch (sosError) {
      setStatus(sosError instanceof Error ? sosError.message : 'Could not raise the alert')
    } finally { setSending(false) }
  }

  const alerts = data?.alerts ?? []
  return <AppShell kind="driver" title="Safety & SOS" subtitle="Incident and emergency escalation workflows">
    {error && <p className="notice" role="alert">{error}</p>}
    <div className="content-grid">
      <section className="panel"><div className="panel-head"><h3>Raise an SOS</h3></div>
        <div className="sos-panel">
          <p className="sos-warning"><Siren size={16}/> If you or a passenger are in immediate danger, contact the emergency services first. This alert reaches the FASTRIDES operations team.</p>
          <div className="field"><label htmlFor="driver-sos-details">What is happening? (optional)</label><textarea id="driver-sos-details" rows={3} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Trip reference or a short description helps the team respond faster." /></div>
          {status && <p className="notice" role="status">{status}</p>}
          <button className="button button-sos" onClick={raiseSos} disabled={sending}>{sending ? 'Raising alert…' : 'Raise SOS alert'}</button>
        </div>
      </section>
      <section className="panel"><div className="panel-head"><h3>Your alerts</h3></div>
        {loading ? <p className="notice" style={{ padding:20 }}>Loading alerts…</p>
          : alerts.length === 0
            ? <EmptyState icon={ShieldAlert} title="No SOS alerts raised." body="Every alert you raise is recorded here with its status."/>
            : alerts.map((alert) => <div className="trip-row" key={alert.id}><span className="trip-icon"><Siren size={15}/></span><div><strong>{alert.details || 'SOS alert'}</strong><small>{alert.locationAvailable ? 'Location shared' : 'Location unavailable'} · {new Date(alert.createdAt).toLocaleString('en-NG')}</small></div><span>{alert.status}</span></div>)}
      </section>
    </div>
  </AppShell>
}