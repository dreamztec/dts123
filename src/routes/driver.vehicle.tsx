import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { CarFront } from 'lucide-react'

export const Route = createFileRoute('/driver/vehicle')({ component: DriverVehicle })

type DriverMe = {
  driver: { id:string; currentVehicleId:string|null } | null
  vehicle: { make:string; model:string; year:number; plateNumber:string; fuelType:string; status:string; nextServiceDate:string|null; insuranceExpiresAt:string|null; registrationExpiresAt:string|null } | null
  message?: string
}

const fuelLabels: Record<string,string> = { PETROL:'Petrol', DIESEL:'Diesel', HYBRID:'Hybrid', ELECTRIC:'Electric' }
const vehicleStatuses: Record<string,string> = { AVAILABLE:'Available', ON_TRIP:'On trip', MAINTENANCE:'In maintenance', UNAVAILABLE:'Unavailable' }

function dateLabel(value:string|null) {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-NG', { dateStyle:'medium' })
}

function DriverVehicle() {
  const { data, loading, error } = useApi<DriverMe>('/api/driver/me')
  const vehicle = data?.vehicle ?? null
  return <AppShell kind="driver" title="Assigned vehicle" subtitle="Documents, status and operational checks">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading your vehicle…</p> : !data?.driver
      ? <section className="panel"><EmptyState icon={CarFront} title="No chauffeur profile yet." body={data?.message ?? 'Vehicle assignment appears once FASTRIDES operations onboard you.'}/></section>
      : !vehicle
        ? <section className="panel"><EmptyState icon={CarFront} title="No vehicle assigned yet." body="Your assigned vehicle appears here once fleet operations assign you one."/></section>
        : <div className="content-grid">
          <section className="panel"><div className="panel-head"><h3>{vehicle.make} {vehicle.model}</h3><span className="status-badge">{vehicleStatuses[vehicle.status] ?? vehicle.status}</span></div>
            <div className="sos-panel">
              <div className="trip-route"><div><small>Plate</small><span>{vehicle.plateNumber}</span></div><div><small>Year</small><span>{vehicle.year}</span></div></div>
              <div className="trip-route"><div><small>Fuel</small><span>{fuelLabels[vehicle.fuelType] ?? vehicle.fuelType}</span></div><div><small>Status</small><span>{vehicleStatuses[vehicle.status] ?? vehicle.status}</span></div></div>
            </div>
          </section>
          <section className="panel"><div className="panel-head"><h3>Compliance dates</h3></div>
            <div className="trip-row"><span className="trip-icon"><CarFront size={15}/></span><div><strong>Next service</strong><small>Scheduled maintenance date</small></div><span>{dateLabel(vehicle.nextServiceDate)}</span></div>
            <div className="trip-row"><span className="trip-icon"><CarFront size={15}/></span><div><strong>Insurance expiry</strong><small>Vehicle insurance document</small></div><span>{dateLabel(vehicle.insuranceExpiresAt)}</span></div>
            <div className="trip-row"><span className="trip-icon"><CarFront size={15}/></span><div><strong>Registration expiry</strong><small>Vehicle registration document</small></div><span>{dateLabel(vehicle.registrationExpiresAt)}</span></div>
          </section>
        </div>}
  </AppShell>
}