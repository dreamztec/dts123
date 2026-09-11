import { z } from 'zod'

export const rewardRedemptionStatuses = ['PENDING','APPROVED','FULFILLED','REJECTED'] as const
export type RewardRedemptionStatus = typeof rewardRedemptionStatuses[number]

export function applyTierMultiplier(points:number, multipliers:Record<string,number>, tierCode:string|null) {
  const multiplier = (tierCode && multipliers[tierCode]) || 1
  return Math.round(points * multiplier)
}

export const earnRuleSchema = z.object({ ruleKey:z.string().min(2).max(60), points:z.number().int().min(0), conditions:z.record(z.string(),z.unknown()).default({}), tierMultipliers:z.record(z.string(),z.number()).default({}), expiryDays:z.number().int().positive().nullable().default(null) })
export type EarnRule = z.infer<typeof earnRuleSchema> & { active?:boolean }

export function evaluateEarnRule(rule:EarnRule, context:{ active?:boolean; alreadyAwarded?:boolean }, tripValue?:number) {
  if (rule.active === false || context.active === false) return { eligible:false, points:0, reason:'Rule is inactive — points are configurable by administrators and are not awarded until configured' }
  if (rule.points <= 0) return { eligible:false, points:0, reason:'Earning value has not been configured for this rule' }
  if (rule.conditions.oncePerTrip && context.alreadyAwarded) return { eligible:false, points:0, reason:'Feedback points were already awarded for this trip' }
  const minimumSpend = typeof rule.conditions.minimumSpend === 'number' ? rule.conditions.minimumSpend : null
  if (minimumSpend != null && (tripValue ?? 0) < minimumSpend) return { eligible:false, points:0, reason:'Trip value does not meet the configured minimum' }
  return { eligible:true, points:rule.points }
}

export function redeemPoints(balance:number, cost:number) {
  if (cost <= 0) throw new Error('Redemption cost must be positive')
  if (balance < cost) return { allowed:false, reason:'Insufficient FASTREWARDS points', remaining:balance }
  return { allowed:true, remaining:balance - cost }
}

export function expiryDate(earnedAt:Date, expiryDays:number|null) {
  if (!expiryDays || expiryDays <= 0) return null
  return new Date(earnedAt.getTime() + expiryDays * 86_400_000)
}

export const redemptionRequestSchema = z.object({ rewardCode:z.string().min(2).max(40) })

export function npsBucket(score:number) {
  if (!Number.isInteger(score) || score < 0 || score > 10) throw new Error('NPS score must be an integer 0–10')
  if (score >= 9) return 'PROMOTER'
  if (score >= 7) return 'PASSIVE'
  return 'DETRACTOR'
}

export function npsSummary(responses:Array<{ npsScore:number|null }>) {
  const valid = responses.filter((response) => response.npsScore != null)
  if (valid.length === 0) return { responses:0, nps:null as number|null, promoters:0, passives:0, detractors:0 }
  const promoters = valid.filter((response) => response.npsScore! >= 9).length
  const passives = valid.filter((response) => response.npsScore! >= 7 && response.npsScore! <= 8).length
  const detractors = valid.length - promoters - passives
  const nps = Math.round(((promoters - detractors) / valid.length) * 100)
  return { responses:valid.length, nps, promoters, passives, detractors }
}

export const tripRatingSchema = z.object({
  rating:z.number().int().min(1).max(5),
  categories:z.record(z.string(),z.number().int().min(1).max(5)).catch({}),
  comment:z.string().max(1000).optional(),
  npsScore:z.number().int().min(0).max(10).optional(),
})
export type TripRatingInput = z.infer<typeof tripRatingSchema>