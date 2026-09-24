import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Gauge } from 'lucide-react'

export const Route = createFileRoute('/fleet/maintenance')({ component: FleetMaintenance })

type MaintenancePayload = {
  records: Array<{ id:string; vehicleCode:string; recordType:string; serviceDate:string; mileageKm:number|null; cost:string|null; provider:string|null; nextServiceDate:string|null; notes:string|null }>
}

const typeLabels: Record<string,string> = { SERVICE:'Service', REPAIR:'Repair', INSPECTION:'Inspection', TYRE:'Tyre', OTHER:'Other' }

function FleetMaintenance() {
  const { data, loading, error } = useApi<MaintenancePayload>('/api/fleet/maintenance')
  const records = data?.records ?? []
  const naira = (value:string|null) => value == null ? '—' : `₦${Number(value).toLocaleString('en-NG')}`
  return <AppShell kind="fleet" title="Maintenance" subtitle="Service, repair, documents and expiry alerts">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading maintenance records…</p> : <>
      <section className="panel table-panel"><div className="panel-head"><h3>Maintenance records</h3></div>
        <table className="data-table"><thead><tr><th>Vehicle</th><th>Type</th><th>Date</th><th>Mileage</th><th>Cost</th><th>Next service</th></tr></thead><tbody>
          {records.length === 0
            ? <tr><td colSpan={6}><EmptyState icon={Gauge} title="No maintenance records yet." body="Service and repair history appears here as maintenance is recorded for registered vehicles."/></td></tr>
            : records.map((record) => <tr key={record.id}><td>{record.vehicleCode}</td><td>{typeLabels[record.recordType] ?? record.recordType}</td><td>{record.serviceDate}</td><td>{record.mileageKm != null ? `${record.mileageKm.toLocaleString('en-NG')} km` : '—'}</td><td>{naira(record.cost)}</td><td>{record.nextServiceDate ?? '—'}</td></tr>)}
        </tbody></table>
      </section>
    </>}
  </AppShell>
}