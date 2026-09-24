import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Users } from 'lucide-react'

export const Route = createFileRoute('/fleet/drivers')({ component: FleetDrivers })

type DriversPayload = {
  drivers: Array<{ id:string; licenceNumber:string|null; yearsExperience:number; rating:string; completedTrips:number; trainingStatus:string; chauffeurStatus:string; driverLevelCode:string; availabilityStatus:string; fullName:string|null; email:string|null }>
}

const chauffeurStatuses: Record<string,string> = { ACTIVE:'Active', INACTIVE:'Inactive', SUSPENDED:'Suspended', PENDING:'Pending' }
const availabilityLabels: Record<string,string> = { available:'Available', offline:'Offline', assigned:'Assigned', arriving:'Arriving', arrived:'Arrived', on_trip:'On trip', paused:'Paused', unavailable:'Unavailable' }

function FleetDrivers() {
  const { data, loading, error } = useApi<DriversPayload>('/api/fleet/drivers')
  const drivers = data?.drivers ?? []
  return <AppShell kind="fleet" title="Chauffeurs" subtitle="Verification, training, availability and performance">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading chauffeurs…</p> : <>
      <section className="panel table-panel"><div className="panel-head"><h3>Chauffeur register</h3></div>
        <table className="data-table"><thead><tr><th>Chauffeur</th><th>Licence</th><th>Trips</th><th>Rating</th><th>Training</th><th>Availability</th><th>Status</th></tr></thead><tbody>
          {drivers.length === 0
            ? <tr><td colSpan={7}><EmptyState icon={Users} title="No chauffeurs onboarded yet." body="Chauffeur profiles appear here as registration and verification are completed."/></td></tr>
            : drivers.map((driver) => <tr key={driver.id}><td><strong>{driver.fullName ?? 'Unnamed profile'}</strong><br/><small>{driver.email ?? ''}</small></td><td>{driver.licenceNumber ?? '—'}</td><td>{driver.completedTrips}</td><td>{Number(driver.rating) > 0 ? Number(driver.rating).toFixed(2) : '—'}</td><td><span className={`status-badge ${driver.trainingStatus === 'COMPLETED' ? '' : 'amber'}`}>{driver.trainingStatus}</span></td><td>{availabilityLabels[driver.availabilityStatus] ?? driver.availabilityStatus}</td><td><span className={`status-badge ${driver.chauffeurStatus === 'ACTIVE' ? '' : 'gray'}`}>{chauffeurStatuses[driver.chauffeurStatus] ?? driver.chauffeurStatus}</span></td></tr>)}
        </tbody></table>
      </section>
    </>}
  </AppShell>
}