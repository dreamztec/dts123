import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { MarketingHeader } from '@/components/MarketingHeader'
import { EmptyState } from '@/components/EmptyState'
import { Check, ArrowRight, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/membership')({ component: MembershipPage })

type ConfigPayload = {
  membershipPlans: Array<{ id:string; code:string; name:string; description:string; monthlyConfigured:boolean; monthlyPrice:number|null; annualConfigured:boolean; annualPrice:number|null; annualSavings:number|null; trialDays:number }>
  membershipBenefits: Array<{ planId:string; key:string; label:string; value:unknown }>
}

const planShort: Record<string,string> = { FASTRIDES_ACCESS:'ACCESS', FASTRIDES_EXECUTIVE:'EXECUTIVE', FASTRIDES_SIGNATURE:'SIGNATURE', FASTRIDES_ROYALE:'ROYALE' }

function naira(value:number|null) {
  return value == null ? null : `₦${value.toLocaleString('en-NG', { minimumFractionDigits:0, maximumFractionDigits:0 })}`
}

function MembershipPage() {
  const { data, loading, error } = useApi<ConfigPayload>('/api/config')
  const plans = data?.membershipPlans ?? []
  const benefits = data?.membershipBenefits ?? []
  return <main className="public-page"><MarketingHeader/>
    <section className="public-hero"><div className="container">
      <p className="eyebrow"><span/>FASTRIDES membership</p>
      <h1>Priority, predictability and more personal mobility.</h1>
      <p>Membership is built around convenience and access. Plans, benefits and prices below come straight from FASTRIDES operations configuration.</p>
      {error && <p className="notice" role="alert">Membership details are being finalised. Please check back shortly.</p>}
    </div></section>
    <section className="public-content"><div className="container">
      {loading ? <p className="notice">Loading membership plans…</p>
        : plans.length === 0
          ? <EmptyState icon={Sparkles} title="Membership details are being finalized." body="Plan structure and pricing are being configured. Nothing is displayed until operations confirms it."/>
          : <div className="membership-grid public-membership-grid">
              {plans.map((plan, index) => <article className={`membership-card ${index === plans.length - 1 ? 'featured' : ''}`} key={plan.id}>
                <div className="membership-top"><span>{planShort[plan.code] ?? plan.code}</span>{index === plans.length - 1 && <b>Most considered</b>}</div>
                <h3>{plan.name}</h3><p>{plan.description}</p>
                <ul>{benefits.filter((benefit) => benefit.planId === plan.id).map((benefit) => <li key={benefit.key}><Check size={15}/>{benefit.label}</li>)}</ul>
                <div className="membership-price">
                  {plan.monthlyConfigured
                    ? <>
                      <strong>{naira(plan.monthlyPrice)}<small>/month</small></strong>
                      {plan.annualConfigured && plan.annualSavings != null && plan.annualSavings > 0 ? <small className="annual-note">{naira(plan.annualPrice)} billed annually — save {naira(plan.annualSavings)}</small> : plan.annualPrice != null ? <small className="annual-note">{naira(plan.annualPrice)} billed annually</small> : null}
                    </>
                    : <p className="config-note">Membership details are being finalized.</p>}
                </div>
                <a href={`/register?membership=${plan.code}`} className="text-link">Join {plan.name} <ArrowRight size={15}/></a>
              </article>)}
            </div>}
      <p className="estimate-note" style={{ marginTop:24 }}>FASTRIDES membership requests are recorded and activated once payment is confirmed. FASTRIDES is a mobility service by Dreamz Transportz Servicez (DTS).</p>
    </div></section>
  </main>
}