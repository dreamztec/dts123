import { z } from 'zod'

export const pricingInputSchema = z.object({ cityId:z.string().uuid(), vehicleClassId:z.string().uuid(), serviceType:z.string(), distanceKm:z.number().nonnegative(), durationMinutes:z.number().int().nonnegative(), waitingMinutes:z.number().int().nonnegative().default(0), passengerCount:z.number().int().positive().default(1), scheduledAt:z.coerce.date(), membershipCode:z.string().optional(), corporateAccountId:z.string().uuid().optional() })
export type PricingInput = z.infer<typeof pricingInputSchema>
export type PricingRule = { id:string; priority:number; fixedFare?:number; baseFare?:number; perKm?:number; perMinute?:number; waitingPerMinute?:number; minimumFare?:number; maximumFare?:number; percentageAdjustment?:number; conditions?:{ serviceType?:string; minimumPassengers?:number; startHour?:number; endHour?:number } }

/** A single customer-visible line of the fare calculation. */
export type FareLine = { label:string; amount:number; detail?:string }

const round = (value:number) => Math.round(value*100)/100

export function calculateFare(rawInput: PricingInput, rules: PricingRule[]) {
  const input = pricingInputSchema.parse(rawInput)
  const applicable = [...rules].sort((a,b) => a.priority-b.priority).filter((rule) => {
    const hour = input.scheduledAt.getHours(); const conditions = rule.conditions
    return (!conditions?.serviceType || conditions.serviceType === input.serviceType) && (!conditions?.minimumPassengers || input.passengerCount >= conditions.minimumPassengers) && (conditions?.startHour === undefined || hour >= conditions.startHour) && (conditions?.endHour === undefined || hour < conditions.endHour)
  })
  const primary = applicable[0]
  if (!primary) return { connected:false, currency:'NGN', message:'Pricing configuration not available', estimate:null, breakdown:[] as FareLine[] }

  const breakdown:FareLine[] = []
  let amount:number
  if (primary.fixedFare !== undefined) {
    amount = primary.fixedFare
    breakdown.push({ label:'Fixed fare', amount:round(amount) })
  } else {
    const base = primary.baseFare ?? 0
    const distanceCharge = input.distanceKm*(primary.perKm ?? 0)
    const timeCharge = input.durationMinutes*(primary.perMinute ?? 0)
    const waitingCharge = input.waitingMinutes*(primary.waitingPerMinute ?? 0)
    amount = base + distanceCharge + timeCharge + waitingCharge
    if (base) breakdown.push({ label:'Base fare', amount:round(base) })
    if (distanceCharge) breakdown.push({ label:'Distance charge', amount:round(distanceCharge), detail:`${input.distanceKm} km by road` })
    if (timeCharge) breakdown.push({ label:'Time charge', amount:round(timeCharge), detail:`${input.durationMinutes} min driving time` })
    if (waitingCharge) breakdown.push({ label:'Waiting time', amount:round(waitingCharge), detail:`${input.waitingMinutes} min` })
  }

  for (const rule of applicable.slice(primary.fixedFare === undefined ? 1 : applicable.length)) {
    const percent = rule.percentageAdjustment ?? 0
    if (!percent) continue
    const delta = amount*percent/100
    amount += delta
    breakdown.push({ label:percent > 0 ? 'Applicable fee' : 'Applicable reduction', amount:round(delta), detail:`${percent > 0 ? '+' : ''}${percent}%` })
  }

  const beforeFloor = amount
  amount = Math.max(primary.minimumFare ?? 0,amount)
  if (amount !== beforeFloor) breakdown.push({ label:'Minimum fare adjustment', amount:round(amount-beforeFloor), detail:`Minimum ₦${primary.minimumFare}` })
  if (primary.maximumFare !== undefined) {
    const beforeCap = amount
    amount = Math.min(primary.maximumFare,amount)
    if (amount !== beforeCap) breakdown.push({ label:'Maximum fare adjustment', amount:round(amount-beforeCap), detail:`Capped at ₦${primary.maximumFare}` })
  }

  return { connected:true, currency:'NGN', estimate:round(amount), fixed:primary.fixedFare !== undefined, appliedRuleIds:applicable.map((rule) => rule.id), breakdown, disclaimer:primary.fixedFare !== undefined ? 'Fixed fare from active pricing rule.' : 'Estimate subject to route, waiting time and applicable operational adjustments.' }
}
