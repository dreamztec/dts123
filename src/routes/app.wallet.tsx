import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { WalletCards } from 'lucide-react'

type WalletPayload = {
  wallet:{ cashBalance:number; promotionalBalance:number; membershipCreditBalance:number; rewardCreditBalance:number; currency:string }
  ledger:Array<{ id:string; balanceType:string; entryType:string; amount:string; reason:string; recordedAt:string }>
  note:string
}

export const Route = createFileRoute('/app/wallet')({ component: WalletPage })

const naira = (value:number) => `₦${value.toLocaleString('en-NG',{ minimumFractionDigits:2, maximumFractionDigits:2 })}`

function WalletPage() {
  const { data, loading, error } = useApi<WalletPayload>('/api/wallet')
  const wallet = data?.wallet ?? { cashBalance:0, promotionalBalance:0, membershipCreditBalance:0, rewardCreditBalance:0, currency:'NGN' }
  return <AppShell kind="customer" title="Wallet" subtitle="Cash, promotional, membership and reward balances stay separate">
    {error && <p className="notice">{error}</p>}
    <div className="kpi-grid">
      {([['Cash',wallet.cashBalance],['Promotional',wallet.promotionalBalance],['Membership credit',wallet.membershipCreditBalance],['Reward credit',wallet.rewardCreditBalance]] as const).map(([label,value]) => <article className="kpi-card" key={label}><span>{label}<WalletCards size={16}/></span><strong>{naira(value)}</strong><small>Live ledger balance</small></article>)}
    </div>
    <section className="panel"><div className="panel-head"><h3>Transaction history</h3></div>
      {loading ? <p className="notice" style={{padding:20}}>Loading ledger…</p>
        : !data || data.ledger.length === 0
          ? <EmptyState icon={WalletCards} title="No wallet activity yet." body="Credits, debits, refunds and adjustments appear here as immutable ledger entries once activity is recorded."/>
          : data.ledger.map((entry) => <div className="trip-row" key={entry.id}><span className="trip-icon"><WalletCards size={15}/></span><div><strong>{entry.reason}</strong><small>{entry.balanceType} · {new Date(entry.recordedAt).toLocaleString('en-NG')}</small></div><span>{entry.entryType} {naira(Number(entry.amount))}</span></div>)}
      {data?.note && <p className="notice" style={{padding:'0 22px 18px'}}>{data.note}</p>}
    </section>
  </AppShell>
}