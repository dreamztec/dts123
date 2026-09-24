import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { ShieldAlert, Siren } from 'lucide-react'

export const Route = createFileRoute('/admin/incidents')({ component: AdminIncidents })

type IncidentsPayload = {
  incidents: Array<{ id:string; incidentType:string; priority:string; details:string; status:string; location:unknown; createdAt:string }>
  sos: Array<{ id:string; status:string; details:string|null; locationAvailable:boolean; createdAt:string; contactName:string|null; contactPhone:string|null }>
}

const priorities: Record<string,string> = { LOW:'gray', MEDIUM:'amber', HIGH:'amber', CRITICAL:'amber' }

function AdminIncidents() {
  const { data, loading, error } = useApi<IncidentsPayload>('/api/admin/incidents')
  const incidents = data?.incidents ?? []
  const sos = data?.sos ?? []
  return <AppShell kind="admin" title="Safety & incidents" subtitle="SOS alerts, incidents, review and audit history">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading safety records…</p> : <>
      <section className="panel table-panel" style={{ marginBottom:20 }}><div className="panel-head"><h3>SOS alerts</h3><span>{sos.length} alerts</span></div>
        <table className="data-table"><thead><tr><th>Raised</th><th>Details</th><th>Location</th><th>Contact</th><th>Status</th></tr></thead><tbody>
          {sos.length === 0
            ? <tr><td colSpan={5}><EmptyState icon={Siren} title="No SOS alerts." body="Alerts raised by customers and chauffeurs appear here for immediate review."/></td></tr>
            : sos.map((alert) => <tr key={alert.id}><td>{new Date(alert.createdAt).toLocaleString('en-NG')}</td><td>{alert.details ?? '—'}</td><td>{alert.locationAvailable ? 'Shared' : 'Unavailable'}</td><td>{alert.contactName ? `${alert.contactName} · ${alert.contactPhone}` : '—'}</td><td><span className="status-badge amber">{alert.status}</span></td></tr>)}
        </tbody></table>
      </section>
      <section className="panel table-panel"><div className="panel-head"><h3>Incidents</h3><span>{incidents.length} records</span></div>
        <table className="data-table"><thead><tr><th>Reported</th><th>Type</th><th>Priority</th><th>Details</th><th>Status</th></tr></thead><tbody>
          {incidents.length === 0
            ? <tr><td colSpan={5}><EmptyState icon={ShieldAlert} title="No incidents recorded." body="Incident reports appear here as they are filed by customers, chauffeurs or operations."/></td></tr>
            : incidents.map((incident) => <tr key={incident.id}><td>{new Date(incident.createdAt).toLocaleString('en-NG')}</td><td>{incident.incidentType}</td><td><span className={`status-badge ${priorities[incident.priority] ?? ''}`}>{incident.priority}</span></td><td>{incident.details}</td><td><span className={`status-badge ${incident.status === 'OPEN' ? 'amber' : ''}`}>{incident.status}</span></td></tr>)}
        </tbody></table>
      </section>
    </>}
  </AppShell>
}