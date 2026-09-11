import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Gift } from 'lucide-react'

type RewardsPayload = { account:{ pointsBalance:number } | null; transactions:Array<{ id:string; transactionType:string; points:number; ruleKey:string; createdAt:string }> }

export const Route = createFileRoute('/app/rewards')({ component: RewardsPage })

function RewardsPage() {
  const { data, loading, error } = useApi<RewardsPayload>('/api/rewards')
  const points = data?.account?.pointsBalance ?? 0
  return <AppShell kind="customer" title="FASTREWARDS" subtitle="Earn, track and redeem configured benefits">
    {error && <p className="notice">{error}</p>}
    <section className="panel" style={{marginBottom:20}}><div className="panel-head"><h3>Points balance</h3></div><div style={{padding:'22px'}}><strong style={{font:'700 30px "Manrope"'}}>{points.toLocaleString('en-NG')}</strong><small style={{display:'block',color:'#8b8983',marginTop:6,fontSize:10}}>FASTREWARDS points recognise loyalty. Points are not cash and hold no cash value.</small></div></section>
    <section className="panel"><div className="panel-head"><h3>Points history</h3></div>
      {loading ? <p className="notice" style={{padding:20}}>Loading rewards…</p>
        : !data || data.transactions.length === 0
          ? <EmptyState icon={Gift} title="No rewards activity yet." body="Earning and redemption activity appears here. Earning rules are configured by FASTRIDES operations and activate once enabled."/>
          : data.transactions.map((transaction) => <div className="trip-row" key={transaction.id}><span className="trip-icon"><Gift size={15}/></span><div><strong>{transaction.ruleKey}</strong><small>{new Date(transaction.createdAt).toLocaleString('en-NG')}</small></div><span>{transaction.transactionType} · {transaction.points} pts</span></div>)}
    </section>
  </AppShell>
}