import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { useIdentity } from '@/lib/identity-context'
import { UserRound } from 'lucide-react'

export const Route = createFileRoute('/app/account')({ component: AccountPage })

type AccountPayload = {
  user: { id:string; fullName:string; email:string; phone:string|null; role:string; status:string; createdAt:string }
  profile: { dateOfBirth:string|null; emergencyContactName:string|null; emergencyContactPhone:string|null; preferredPickup:{ label:string; address:string } | null } | null
  savedLocations: Array<{ id:string; label:string; address:string }>
}

function AccountPage() {
  const navigate = useNavigate()
  const { user, ready } = useIdentity()
  const { data, loading, error, refetch } = useApi<AccountPayload>(ready ? (user ? '/api/account' : null) : null)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (ready && !user) navigate({ to: '/login' }) }, [ready, user, navigate])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setStatus('')
    const form = new FormData(event.currentTarget)
    const payload: Record<string, unknown> = {}
    const fullName = String(form.get('fullName') ?? '').trim()
    const phone = String(form.get('phone') ?? '').trim()
    const emergencyName = String(form.get('emergencyContactName') ?? '').trim()
    const emergencyPhone = String(form.get('emergencyContactPhone') ?? '').trim()
    if (fullName) payload.fullName = fullName
    if (phone) payload.phone = phone
    if (emergencyName || emergencyPhone) { payload.emergencyContactName = emergencyName || null; payload.emergencyContactPhone = emergencyPhone || null }
    try {
      const response = await fetch('/api/account', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, credentials:'same-origin', body: JSON.stringify(payload) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Could not save your details')
      setStatus('Your details are saved.')
      refetch?.()
    } catch (saveError) {
      setStatus(saveError instanceof Error ? saveError.message : 'Could not save your details')
    } finally { setSaving(false) }
  }

  if (loading || !ready) return <AppShell kind="customer" title="Account" subtitle="Your FASTRIDES profile and preferences"><p className="notice">Loading your account…</p></AppShell>
  if (error) return <AppShell kind="customer" title="Account" subtitle="Your FASTRIDES profile and preferences"><p className="notice" role="alert">{error}</p></AppShell>

  const account = data?.user
  return <AppShell kind="customer" title="Account" subtitle="Your FASTRIDES profile and preferences">
    {!account ? <section className="panel"><EmptyState icon={UserRound} title="Account record not provisioned yet." body="Your FASTRIDES account is created the first time you make a booking. Log in and book a ride to complete setup."/></section>
      : <div className="account-layout">
        <section className="panel"><div className="panel-head"><h3>Personal details</h3></div>
          <form className="account-form" onSubmit={save}>
            <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" defaultValue={account.fullName} /></div>
            <div className="field"><label htmlFor="email">Email</label><input id="email" defaultValue={account.email} disabled /></div>
            <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" defaultValue={account.phone ?? ''} placeholder="e.g. 0803 000 0000" /></div>
            <div className="field"><label htmlFor="emergencyContactName">Emergency contact name</label><input id="emergencyContactName" name="emergencyContactName" defaultValue={data?.profile?.emergencyContactName ?? ''} /></div>
            <div className="field"><label htmlFor="emergencyContactPhone">Emergency contact phone</label><input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={data?.profile?.emergencyContactPhone ?? ''} /></div>
            {status && <p className="notice" role="status">{status}</p>}
            <button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </form>
        </section>
        <section className="panel"><div className="panel-head"><h3>Account status</h3></div>
          <div className="trip-row"><span className="trip-icon"><UserRound size={15}/></span><div><strong>Account</strong><small>Member since {new Date(account.createdAt).toLocaleDateString('en-NG', { dateStyle:'medium' })}</small></div><span>{account.status === 'ACTIVE' ? 'Active' : account.status}</span></div>
          <div className="trip-row"><span className="trip-icon"><UserRound size={15}/></span><div><strong>Role</strong><small>How you use FASTRIDES</small></div><span>{account.role}</span></div>
        </section>
        <section className="panel"><div className="panel-head"><h3>Saved places</h3></div>
          {(data?.savedLocations ?? []).length === 0
            ? <EmptyState icon={UserRound} title="No saved places yet." body="Frequent pickup points you save appear here for faster booking."/>
            : data!.savedLocations.map((location) => <div className="trip-row" key={location.id}><span className="trip-icon"><UserRound size={14}/></span><div><strong>{location.label}</strong><small>{location.address}</small></div><span>Saved</span></div>)}
        </section>
      </div>}
  </AppShell>
}