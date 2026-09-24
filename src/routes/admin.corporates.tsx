import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Building2 } from 'lucide-react'

export const Route = createFileRoute('/admin/corporates')({ component: AdminCorporates })

type CorporatesPayload = {
  accounts: Array<{ id:string; name:string; billingEmail:string; billingType:string; status:string; creditLimit:string|null; monthlySpendLimit:string|null; members:number }>
}

function AdminCorporates() {
  const { data, loading, error } = useApi<CorporatesPayload>('/api/admin/corporates')
  const accounts = data?.accounts ?? []
  return <AppShell kind="admin" title="Corporate accounts" subtitle="Contracts, credit, pricing and service rules">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading corporate accounts…</p> : <>
      <section className="panel table-panel"><div className="panel-head"><h3>Corporate accounts</h3><span>{accounts.length} accounts</span></div>
        <table className="data-table"><thead><tr><th>Account</th><th>Billing</th><th>Credit limit</th><th>Members</th><th>Status</th></tr></thead><tbody>
          {accounts.length === 0
            ? <tr><td colSpan={5}><EmptyState icon={Building2} title="No corporate accounts yet." body="Corporate accounts appear here once companies are onboarded."/></td></tr>
            : accounts.map((account) => <tr key={account.id}><td><strong>{account.name}</strong><br/><small>{account.billingEmail}</small></td><td>{account.billingType}</td><td>{account.creditLimit ? `₦${Number(account.creditLimit).toLocaleString('en-NG')}` : '—'}</td><td>{account.members}</td><td><span className={`status-badge ${account.status === 'ACTIVE' ? '' : 'amber'}`}>{account.status}</span></td></tr>)}
        </tbody></table>
      </section>
    </>}
  </AppShell>
}