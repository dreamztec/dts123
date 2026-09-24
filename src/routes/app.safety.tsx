import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { ShieldAlert, Siren } from 'lucide-react'

export const Route = createFileRoute('/app/safety')({ component: CustomerSafety })

type SosPayload = {
  alerts: Array<{ id:string; status:string; details:string|null; locationAvailable:boolean; createdAt:string }>
  emergencyContacts: Array<{ id:string; name:string; phone:string; relationship:string|null; primary:boolean }>
}

function CustomerSafety() {
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

  const contacts = data?.emergencyContacts ?? []
  const alerts = data?.alerts ?? []
  return <AppShell kind="customer" title="Safety" subtitle="SOS escalation and your emergency contacts">
    {error && <p className="notice" role="alert">{error}</p>}
    <div className="content-grid">
      <section className="panel"><div className="panel-head"><h3>Raise an SOS</h3></div>
        <div className="sos-panel">
          <p className="sos-warning"><Siren size={16}/> If you are in immediate danger, contact the emergency services first. This alert reaches the FASTRIDES support team and your emergency contact.</p>
          <div className="field"><label htmlFor="sos-details">What is happening? (optional)</label><textarea id="sos-details" rows={3} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Trip reference or a short description helps the team respond faster." /></div>
          {status && <p className="notice" role="status">{status}</p>}
          <button className="button button-sos" onClick={raiseSos} disabled={sending}>{sending ? 'Raising alert…' : 'Raise SOS alert'}</button>
        </div>
      </section>
      <section className="panel"><div className="panel-head"><h3>Emergency contacts</h3></div>
        {contacts.length === 0
          ? <EmptyState icon={ShieldAlert} title="No emergency contact saved." body="Add one on your Account page so we know who to reach in an emergency."/>
          : contacts.map((contact) => <div className="trip-row" key={contact.id}><span className="trip-icon"><ShieldAlert size={15}/></span><div><strong>{contact.name}{contact.primary ? ' · Primary' : ''}</strong><small>{contact.phone}{contact.relationship ? ` · ${contact.relationship}` : ''}</small></div><span>On file</span></div>)}
      </section>
    </div>
    <section className="panel" style={{ marginTop:20 }}><div className="panel-head"><h3>Your SOS history</h3></div>
      {loading ? <p className="notice" style={{ padding:20 }}>Loading alerts…</p>
        : alerts.length === 0
          ? <EmptyState icon={Siren} title="No SOS alerts raised." body="Every alert you raise is recorded here with its status for transparency."/>
          : alerts.map((alert) => <div className="trip-row" key={alert.id}><span className="trip-icon"><Siren size={15}/></span><div><strong>{alert.details || 'SOS alert'}</strong><small>{alert.locationAvailable ? 'Location shared' : 'Location unavailable'} · {new Date(alert.createdAt).toLocaleString('en-NG')}</small></div><span>{alert.status}</span></div>)}
      <p className="notice" style={{ padding:'0 22px 18px' }}>Location is shared only with this SOS. FASTRIDES never tracks you in the background.</p>
    </section>
  </AppShell>
}