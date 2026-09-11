import { z } from 'zod'

export const MEMBERSHIP_PLANS = [
  { code:'FASTRIDES_ACCESS', name:'FASTRIDES Access', short:'ACCESS', summary:'Reliable everyday mobility with member priority.', highlights:['Priority booking','Member support','Eligible shared mobility'], discountPercent:0 },
  { code:'FASTRIDES_EXECUTIVE', short:'EXECUTIVE', name:'FASTRIDES Executive', summary:'Better access for frequent professionals and travellers.', highlights:['Higher allocation priority','Configurable ride credits','Airport benefits'], discountPercent:5 },
  { code:'FASTRIDES_SIGNATURE', short:'SIGNATURE', name:'FASTRIDES Signature', summary:'Premium support and stronger travel preferences.', highlights:['Concierge-style support','Chauffeur preference','Selected upgrade benefits'], discountPercent:10 },
  { code:'FASTRIDES_ROYALE', short:'ROYALE', name:'FASTRIDES Royale', summary:'Personalised managed mobility for VIP requirements.', highlights:['Relationship management','Luxury vehicle priority','Bespoke mobility arrangements'], discountPercent:15 },
] as const

export type MembershipPlanCode = typeof MEMBERSHIP_PLANS[number]['code']

export const membershipDiscountFor = (code:string):number => MEMBERSHIP_PLANS.find((plan) => plan.code === code)?.discountPercent ?? 0

export function annualPriceFromMonthly(monthlyPrice:number|null|undefined, configuredAnnual?:number|null) {
  if (configuredAnnual != null && configuredAnnual > 0) return configuredAnnual
  if (monthlyPrice == null) return null
  return Math.round(monthlyPrice * 12 * 100) / 100
}

export function savingsFromAnnual(monthlyPrice:number|null|undefined, annualPrice:number|null|undefined) {
  if (!monthlyPrice || !annualPrice) return null
  return Math.round((monthlyPrice * 12 - annualPrice) * 100) / 100
}

export function isActiveSubscription(subscription:{ status:string; expiresAt:Date|null; gracePeriodDays?:number }, now=new Date()) {
  if (subscription.status === 'CANCELLED') return false
  if (subscription.status !== 'ACTIVE' && subscription.status !== 'GRACE') return false
  if (subscription.status === 'GRACE') return true
  if (!subscription.expiresAt) return false
  const graceMs = (subscription.gracePeriodDays ?? 0) * 24 * 60 * 60_000
  return subscription.expiresAt.getTime() + graceMs >= now.getTime()
}

export function nextRenewalDate(startsAt:Date, cycle:'MONTHLY'|'ANNUAL') {
  const renewal = new Date(startsAt)
  if (cycle === 'MONTHLY') renewal.setMonth(renewal.getMonth() + 1)
  else renewal.setFullYear(renewal.getFullYear() + 1)
  return renewal
}

export const membershipRequestSchema = z.object({
  planCode:z.enum(['FASTRIDES_ACCESS','FASTRIDES_EXECUTIVE','FASTRIDES_SIGNATURE','FASTRIDES_ROYALE']),
  billingCycle:z.enum(['MONTHLY','ANNUAL']).default('MONTHLY'),
})
export type MembershipRequest = z.infer<typeof membershipRequestSchema>