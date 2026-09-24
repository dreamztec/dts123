import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Gift, Users } from 'lucide-react'

type RewardsPayload = { account:{ pointsBalance:number } | null; transactions:Array<{ id:string; transactionType:string; points:number; ruleKey:string; createdAt:string }>; note?:string }
type ReferralPayload = { code:string; status:string; note:string; program:{ qualifyingEvent:string; expiryDays:number } | null }

export const Route = createFileRoute('/app/rewards')({ component: RewardsPage })

function RewardsPage() {
  const { data, loading, error } = useApi<RewardsPayload>('/api/rewards')
  const { data: referral, loading: referralLoading } = useApi<ReferralPayload>('/api/referrals/me')
  const points = data?.account?.pointsBalance ?? 0
  return <AppShell kind="customer" title="FASTREWARDS" subtitle="Earn, track and redeem configured benefits">
    {error && <p className="notice" role="alert">{error}</p>}
    <section className="panel" style={{ marginBottom:20 }}><div className="panel-head"><h3>Points balance</h3></div><div style={{ padding:22 }}><strong style={{ font:'700 30px "Manrope"' }}>{points.toLocaleString('en-NG')}</strong><small style={{ display:'block', color:'#8b8983', marginTop:6, fontSize:10 }}>FASTREWARDS points recognise loyalty. Points are not cash and hold no cash value.</small></div></section>
    <section className="panel" style={{ marginBottom:20 }}><div className="panel-head"><h3>Referrals</h3></div>
      {referralLoading ? <p className="notice" style={{ padding:20 }}>Loading your referral code…</p>
        : !referral?.code
          ? <EmptyState icon={Users} title="Referral code unavailable." body="Your personal code appears here once your account is eligible."/>
          : <div style={{ padding:'20px 22px' }}>
              <div className="referral-code-row"><span className="referral-code">{referral.code}</span><button className="button button-small button-outline-dark" type="button" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/register?ref=${referral.code}`).catch(() => undefined) }}>Copy link</button></div>
              <p className="notice" style={{ marginTop:12 }}>{referral.note}{referral.program ? ` Qualifying event: ${referral.program.qualifyingEvent === 'FIRST_COMPLETED_TRIP' ? 'your invitee completes a first trip' : 'the configured qualifying action'}. Referrals stay valid for ${referral.program.expiryDays} days.` : ''}</p>
              <p style={{ fontSize:10, color:'#8b8983' }}>Status: {referral.status}</p>
            </div>}
    </section>
    <section className="panel"><div className="panel-head"><h3>Points history</h3></div>
      {loading ? <p className="notice" style={{ padding:20 }}>Loading rewards…</p>
        : !data || data.transactions.length === 0
          ? <EmptyState icon={Gift} title="No rewards activity yet." body="Earning and redemption activity appears here. Earning rules are configured by FASTRIDES operations and activate once enabled."/>
          : data.transactions.map((transaction) => <div className="trip-row" key={transaction.id}><span className="trip-icon"><Gift size={15}/></span><div><strong>{transaction.ruleKey}</strong><small>{new Date(transaction.createdAt).toLocaleString('en-NG')}</small></div><span>{transaction.transactionType} · {transaction.points} pts</span></div>)}
    </section>
  </AppShell>
}