import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Users } from 'lucide-react'

export const Route = createFileRoute('/admin/customers')({ component: AdminCustomers })

type CustomersPayload = {
  customers: Array<{ id:string; fullName:string; email:string; phone:string|null; status:string; createdAt:string; completedBookings:number }>
}

function AdminCustomers() {
  const { data, loading, error } = useApi<CustomersPayload>('/api/admin/customers')
  const customers = data?.customers ?? []
  return <AppShell kind="admin" title="Customer CRM" subtitle="Profiles, status and activity">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading customers…</p> : <>
      <section className="panel table-panel"><div className="panel-head"><h3>Customer register</h3><span>{customers.length} records</span></div>
        <table className="data-table"><thead><tr><th>Customer</th><th>Phone</th><th>Completed bookings</th><th>Member since</th><th>Status</th></tr></thead><tbody>
          {customers.length === 0
            ? <tr><td colSpan={5}><EmptyState icon={Users} title="No customer records yet." body="Customer profiles are provisioned when customers make their first booking."/></td></tr>
            : customers.map((customer) => <tr key={customer.id}><td><strong>{customer.fullName}</strong><br/><small>{customer.email}</small></td><td>{customer.phone ?? '—'}</td><td>{customer.completedBookings}</td><td>{new Date(customer.createdAt).toLocaleDateString('en-NG')}</td><td><span className={`status-badge ${customer.status === 'ACTIVE' ? '' : 'gray'}`}>{customer.status}</span></td></tr>)}
        </tbody></table>
      </section>
    </>}
  </AppShell>
}