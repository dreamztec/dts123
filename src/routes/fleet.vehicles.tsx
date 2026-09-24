import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { CarFront } from 'lucide-react'

export const Route = createFileRoute('/fleet/vehicles')({ component: FleetVehicles })

type VehiclesPayload = {
  vehicles: Array<{ id:string; vehicleCode:string; make:string; model:string; year:number; plateNumber:string; fuelType:string; status:string; nextServiceDate:string|null }>
  classes: Array<{ id:string; code:string; name:string; active:boolean; passengerCapacity:number }>
}

const fuelLabels: Record<string,string> = { PETROL:'Petrol', DIESEL:'Diesel', HYBRID:'Hybrid', ELECTRIC:'Electric' }
const vehicleStatuses: Record<string,string> = { AVAILABLE:'Available', ON_TRIP:'On trip', MAINTENANCE:'In maintenance', UNAVAILABLE:'Unavailable' }

function FleetVehicles() {
  const { data, loading, error } = useApi<VehiclesPayload>('/api/fleet/vehicles')
  const vehicles = data?.vehicles ?? []
  const classes = data?.classes ?? []
  return <AppShell kind="fleet" title="Vehicles" subtitle="Classes, assignments, compliance and status">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading vehicles…</p> : <>
      <section className="panel" style={{ marginBottom:20 }}><div className="panel-head"><h3>Vehicle classes</h3></div>
        {classes.length === 0
          ? <EmptyState icon={CarFront} title="No vehicle classes configured." body="Classes are database configuration managed by operations."/>
          : <div className="trip-list" style={{ padding:22 }}>{classes.map((entry) => <div className="trip-row" key={entry.id}><span className="trip-icon"><CarFront size={15}/></span><div><strong>{entry.name}</strong><small>{entry.code} · up to {entry.passengerCapacity} passengers</small></div><span className="status-badge">{entry.active ? 'Active' : 'Inactive'}</span></div>)}</div>}
      </section>
      <section className="panel table-panel"><div className="panel-head"><h3>Managed vehicles</h3></div>
        <table className="data-table"><thead><tr><th>Vehicle</th><th>Plate</th><th>Class/fuel</th><th>Next service</th><th>Status</th></tr></thead><tbody>
          {vehicles.length === 0
            ? <tr><td colSpan={5}><EmptyState icon={CarFront} title="No vehicles have been added." body="Vehicle records, compliance dates and service schedules appear once vehicles are registered."/></td></tr>
            : vehicles.map((vehicle) => <tr key={vehicle.id}><td><strong>{vehicle.make} {vehicle.model}</strong><br/><small>{vehicle.vehicleCode} · {vehicle.year}</small></td><td>{vehicle.plateNumber}</td><td>{fuelLabels[vehicle.fuelType] ?? vehicle.fuelType}</td><td>{vehicle.nextServiceDate ?? '—'}</td><td><span className="status-badge">{vehicleStatuses[vehicle.status] ?? vehicle.status}</span></td></tr>)}
        </tbody></table>
      </section>
    </>}
  </AppShell>
}