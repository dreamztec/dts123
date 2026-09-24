import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/corporate/policies')({ component: CorporatePolicies })

type AccountPayload = { user: { role:string } }
type PoliciesPayload = { policies: Array<{ id:string; name:string; allowedVehicleClasses:string[]; allowedServices:string[]; perTripSpendLimit:string|null; monthlyTripLimit:number|null; monthlySpendLimit:string|null; approvalLevel:string; maxAdvanceDays:number|null; active:boolean }> }

function CorporatePolicies() {
  const { data: account } = useApi<AccountPayload>('/api/account')
  const isCorporate = account?.user?.role === 'corporate_admin' || account?.user?.role === 'corporate_rider'
  const { data, loading, error } = useApi<PoliciesPayload>(isCorporate ? '/api/corporate/policies' : null)
  const policies = data?.policies ?? []
  return <AppShell kind="corporate" title="Travel policies" subtitle="Budgets, classes, approvals and route rules">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading policies…</p>
      : !isCorporate
        ? <section className="panel"><EmptyState icon={ShieldCheck} title="Corporate workspace is for corporate accounts." body="Log in with your company account to manage travel policies."/></section>
        : policies.length === 0
          ? <section className="panel"><EmptyState icon={ShieldCheck} title="No policies configured yet." body="Spend limits, approved vehicle classes and approval levels appear here once your company policies are configured with FASTRIDES."/></section>
          : <section className="panel table-panel"><div className="panel-head"><h3>Active policies</h3></div>
            <table className="data-table"><thead><tr><th>Policy</th><th>Per-trip limit</th><th>Monthly limit</th><th>Approval level</th><th>Status</th></tr></thead><tbody>
              {policies.map((policy) => <tr key={policy.id}><td><strong>{policy.name}</strong><br/><small>{policy.allowedVehicleClasses.length ? `Classes: ${policy.allowedVehicleClasses.join(', ')}` : 'All classes'}</small></td><td>{policy.perTripSpendLimit ? `₦${Number(policy.perTripSpendLimit).toLocaleString('en-NG')}` : '—'}</td><td>{policy.monthlySpendLimit ? `₦${Number(policy.monthlySpendLimit).toLocaleString('en-NG')}` : policy.monthlyTripLimit ? `${policy.monthlyTripLimit} trips` : '—'}</td><td>{policy.approvalLevel}</td><td><span className={`status-badge ${policy.active ? '' : 'gray'}`}>{policy.active ? 'Active' : 'Inactive'}</span></td></tr>)}
            </tbody></table>
          </section>}
  </AppShell>
}