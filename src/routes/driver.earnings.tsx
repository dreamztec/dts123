import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { WalletCards } from 'lucide-react'

export const Route = createFileRoute('/driver/earnings')({ component: DriverEarnings })

type EarningsPayload = {
  driver: { completedTrips:number; rating:string; safetyScore:string; acceptanceRate:string; completionRate:string } | null
  earnings: Array<{ id:string; periodStart:string; periodEnd:string; tripEarnings:string; activeHourEarnings:string; productivityBonus:string; performanceBonus:string; deductions:string; grossEarnings:string; netEarnings:string; qualifyingActiveMinutes:number; status:string }>
  performance: Array<{ id:string; periodStart:string; periodEnd:string; punctuality:string; safety:string; weightedScore:string; status:string }>
  note: string | null
  message?: string
}

const naira = (value: unknown) => Number.isFinite(Number(value)) ? `₦${Number(value).toLocaleString('en-NG', { minimumFractionDigits:2, maximumFractionDigits:2 })}` : '—'

function DriverEarnings() {
  const { data, loading, error } = useApi<EarningsPayload>('/api/driver/earnings')
  const driver = data?.driver ?? null
  const earnings = data?.earnings ?? []
  const performance = data?.performance ?? []
  return <AppShell kind="driver" title="Earnings & profile" subtitle="Recorded periods and your operating profile">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading earnings…</p> : !driver
      ? <section className="panel"><EmptyState icon={WalletCards} title="No chauffeur profile yet." body={data?.message ?? 'Earnings appear once FASTRIDES operations onboard you.'}/></section>
      : <>
        <div className="kpi-grid">
          {([['Completed trips',String(driver.completedTrips)],['Rating',Number(driver.rating) > 0 ? Number(driver.rating).toFixed(2) : '—'],['Safety score',Number(driver.safetyScore) > 0 ? Number(driver.safetyScore).toFixed(1) : '—'],['Acceptance',Number(driver.acceptanceRate) > 0 ? `${Number(driver.acceptanceRate).toFixed(0)}%` : '—']] as Array<[string,string]>).map(([label,value]) => <article className="kpi-card" key={label}><span>{label}</span><strong>{value}</strong><small>From your chauffeur profile</small></article>)}
        </div>
        <section className="panel" style={{ marginBottom:20 }}><div className="panel-head"><h3>Earnings periods</h3></div>
          {earnings.length === 0
            ? <EmptyState icon={WalletCards} title="No earnings periods recorded yet." body={data?.note ?? 'Payroll periods appear here once recorded. No figures are estimated.'}/>
            : earnings.map((period) => <div className="trip-row" key={period.id}><span className="trip-icon"><WalletCards size={15}/></span><div><strong>{naira(period.netEarnings)} net</strong><small>{new Date(period.periodStart).toLocaleDateString('en-NG')} – {new Date(period.periodEnd).toLocaleDateString('en-NG')} · trips {naira(period.tripEarnings)} · bonuses {naira(Number(period.productivityBonus) + Number(period.performanceBonus))} · deductions {naira(period.deductions)}</small></div><span>{period.status}</span></div>)}
        </section>
        <section className="panel"><div className="panel-head"><h3>Performance reviews</h3></div>
          {performance.length === 0
            ? <EmptyState icon={WalletCards} title="No reviews recorded yet." body="Periodic performance reviews appear here once operations record them."/>
            : performance.map((record) => <div className="trip-row" key={record.id}><span className="trip-icon"><WalletCards size={15}/></span><div><strong>Score {Number(record.weightedScore).toFixed(1)}</strong><small>{new Date(record.periodStart).toLocaleDateString('en-NG')} – {new Date(record.periodEnd).toLocaleDateString('en-NG')} · punctuality {Number(record.punctuality).toFixed(0)} · safety {Number(record.safety).toFixed(0)}</small></div><span>{record.status}</span></div>)}
        </section>
      </>}
  </AppShell>
}