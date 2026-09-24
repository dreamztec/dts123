import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { CarFront } from 'lucide-react'

export const Route = createFileRoute('/admin/vehicles')({ component: AdminVehicles })

type VehiclesPayload = {
  vehicles: Array<{ id:string; vehicleCode:string; make:string; model:string; year:number; plateNumber:string; status:string; cityId:string|null }>
}

const vehicleStatuses: Record<string,string> = { AVAILABLE:'Available', ON_TRIP:'On trip', MAINTENANCE:'In maintenance', UNAVAILABLE:'Unavailable' }

function AdminVehicles() {
  const { data, loading, error } = useApi<VehiclesPayload>('/api/fleet/vehicles')
  const vehicles = data?.vehicles ?? []
  return <AppShell kind="admin" title="Vehicles" subtitle="Fleet status, assignment and compliance">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading vehicles…</p> : <>
      <section className="panel table-panel"><div className="panel-head"><h3>Fleet register</h3><span>{vehicles.length} vehicles</span></div>
        <table className="data-table"><thead><tr><th>Vehicle</th><th>Plate</th><th>Year</th><th>Status</th></tr></thead><tbody>
          {vehicles.length === 0
            ? <tr><td colSpan={4}><EmptyState icon={CarFront} title="No vehicles registered yet." body="Vehicles appear here as fleet operations registers them."/></td></tr>
            : vehicles.map((vehicle) => <tr key={vehicle.id}><td><strong>{vehicle.make} {vehicle.model}</strong><br/><small>{vehicle.vehicleCode}</small></td><td>{vehicle.plateNumber}</td><td>{vehicle.year}</td><td><span className={`status-badge ${vehicle.status === 'AVAILABLE' ? '' : 'amber'}`}>{vehicleStatuses[vehicle.status] ?? vehicle.status}</span></td></tr>)}
        </tbody></table>
      </section>
    </>}
  </AppShell>
}