import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Users } from 'lucide-react'

export const Route = createFileRoute('/corporate/riders')({ component: CorporateRiders })

type AccountPayload = { user: { fullName:string; email:string; role:string; status:string } }
type CorporateMembersPayload = { members: Array<{ id:string; authorisationLevel:string; rideLimit:string|null; active:boolean; fullName:string|null; email:string|null; department:string|null }> }

function CorporateRiders() {
  const { data: account } = useApi<AccountPayload>('/api/account')
  const role = account?.user?.role
  const isCorporate = role === 'corporate_admin' || role === 'corporate_rider'
  const { data, loading, error } = useApi<CorporateMembersPayload>(isCorporate ? '/api/corporate/members' : null)
  const members = data?.members ?? []
  return <AppShell kind="corporate" title="Riders & departments" subtitle="Employees, roles, limits and authorisations">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading riders…</p>
      : !isCorporate
        ? <section className="panel"><EmptyState icon={Users} title="Corporate workspace is for corporate accounts." body="Your account is not linked to a corporate mobility account. Log in with your company account to manage riders." /></section>
        : members.length === 0
          ? <section className="panel"><EmptyState icon={Users} title="No riders added yet." body="Employees appear here as they are linked to your corporate account with their department and ride limits."/></section>
          : <section className="panel table-panel"><div className="panel-head"><h3>Authorised riders</h3></div>
            <table className="data-table"><thead><tr><th>Rider</th><th>Authorisation</th><th>Department</th><th>Ride limit</th><th>Status</th></tr></thead><tbody>
              {members.map((member) => <tr key={member.id}><td><strong>{member.fullName ?? 'Unnamed'}</strong><br/><small>{member.email ?? ''}</small></td><td>{member.authorisationLevel}</td><td>{member.department ?? '—'}</td><td>{member.rideLimit ?? '—'}</td><td><span className={`status-badge ${member.active ? '' : 'gray'}`}>{member.active ? 'Active' : 'Inactive'}</span></td></tr>)}
            </tbody></table>
          </section>}
  </AppShell>
}