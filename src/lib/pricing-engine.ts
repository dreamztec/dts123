import { z } from 'zod'

export const pricingInputSchema = z.object({ cityId:z.string().uuid(), vehicleClassId:z.string().uuid(), serviceType:z.string(), distanceKm:z.number().nonnegative(), durationMinutes:z.number().int().nonnegative(), waitingMinutes:z.number().int().nonnegative().default(0), passengerCount:z.number().int().positive().default(1), scheduledAt:z.coerce.date(), membershipCode:z.string().optional(), corporateAccountId:z.string().uuid().optional() })
export type PricingInput = z.infer<typeof pricingInputSchema>
export type PricingRule = { id:string; priority:number; fixedFare?:number; baseFare?:number; perKm?:number; perMinute?:number; waitingPerMinute?:number; minimumFare?:number; maximumFare?:number; percentageAdjustment?:number; conditions?:{ serviceType?:string; minimumPassengers?:number; startHour?:number; endHour?:number } }

export function calculateFare(rawInput: PricingInput, rules: PricingRule[]) {
  const input = pricingInputSchema.parse(rawInput)
  const applicable = [...rules].sort((a,b) => a.priority-b.priority).filter((rule) => {
    const hour = input.scheduledAt.getHours(); const conditions = rule.conditions
    return (!conditions?.serviceType || conditions.serviceType === input.serviceType) && (!conditions?.minimumPassengers || input.passengerCount >= conditions.minimumPassengers) && (conditions?.startHour === undefined || hour >= conditions.startHour) && (conditions?.endHour === undefined || hour < conditions.endHour)
  })
  const primary = applicable[0]
  if (!primary) return { connected:false, currency:'NGN', message:'Pricing configuration not available', estimate:null }
  let amount = primary.fixedFare ?? ((primary.baseFare ?? 0) + input.distanceKm*(primary.perKm ?? 0) + input.durationMinutes*(primary.perMinute ?? 0) + input.waitingMinutes*(primary.waitingPerMinute ?? 0))
  for (const rule of applicable.slice(primary.fixedFare === undefined ? 1 : applicable.length)) amount *= 1 + (rule.percentageAdjustment ?? 0)/100
  amount = Math.max(primary.minimumFare ?? 0,amount); if (primary.maximumFare !== undefined) amount = Math.min(primary.maximumFare,amount)
  return { connected:true, currency:'NGN', estimate:Math.round(amount*100)/100, fixed:primary.fixedFare !== undefined, appliedRuleIds:applicable.map((rule) => rule.id), disclaimer:primary.fixedFare !== undefined ? 'Fixed fare from active pricing rule.' : 'Estimate subject to route, waiting time and applicable operational adjustments.' }
}
