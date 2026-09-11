import { z } from 'zod'
import { DRIVER_LEVEL_CODES, DRIVER_STATUSES, DRIVER_ACTIVE_STATUSES, type DriverLevelCode, type DriverStatus } from './domain'

export type LevelRequirements = { completedTrips:number; rating:number; safetyScore:number; yearsExperience?:number }

export const DEFAULT_LEVEL_REQUIREMENTS: Record<DriverLevelCode, LevelRequirements> = {
  STARTER: { completedTrips:0, rating:0, safetyScore:0 },
  PROFESSIONAL: { completedTrips:50, rating:4.2, safetyScore:75 },
  EXECUTIVE: { completedTrips:250, rating:4.5, safetyScore:85 },
  ELITE: { completedTrips:750, rating:4.7, safetyScore:90 },
}

export type DriverMetrics = { completedTrips:number; rating:number; safetyScore:number; yearsExperience?:number }

export function levelProgress(metrics:DriverMetrics, requirements:Record<DriverLevelCode, LevelRequirements> = DEFAULT_LEVEL_REQUIREMENTS) {
  const currentLevel = [...DRIVER_LEVEL_ORDER].reverse().find((level) => meetsLevel(metrics,requirements[level])) ?? 'STARTER'
  const currentIndex = DRIVER_LEVEL_ORDER.indexOf(currentLevel)
  const nextLevel = currentIndex < DRIVER_LEVEL_ORDER.length - 1 ? DRIVER_LEVEL_ORDER[currentIndex+1] : null
  let nextProgress: { percent:number; missing:Partial<Record<keyof LevelRequirements,{ current:number; required:number }>> } | null = null
  if (nextLevel) {
    const req = requirements[nextLevel]
    const tripsRatio = req.completedTrips > 0 ? Math.min(metrics.completedTrips/req.completedTrips,1) : 1
    const ratingRatio = req.rating > 0 ? Math.min(metrics.rating/req.rating,1) : 1
    const safetyRatio = req.safetyScore > 0 ? Math.min(metrics.safetyScore/req.safetyScore,1) : 1
    const percent = Math.round(((tripsRatio+ratingRatio+safetyRatio)/3)*100)
    const missing: Partial<Record<keyof LevelRequirements,{ current:number; required:number }>> = {}
    if (metrics.completedTrips < req.completedTrips) missing.completedTrips = { current:metrics.completedTrips, required:req.completedTrips }
    if (metrics.rating < req.rating) missing.rating = { current:metrics.rating, required:req.rating }
    if (metrics.safetyScore < req.safetyScore) missing.safetyScore = { current:metrics.safetyScore, required:req.safetyScore }
    nextProgress = { percent, missing }
  }
  return { currentLevel, nextLevel, nextProgress, benefits:null as null | string[] }
}

const DRIVER_LEVEL_ORDER: DriverLevelCode[] = [...DRIVER_LEVEL_CODES]

export function meetsLevel(metrics:DriverMetrics, requirement:LevelRequirements) {
  return metrics.completedTrips >= requirement.completedTrips && metrics.rating >= requirement.rating && metrics.safetyScore >= requirement.safetyScore
}
export const assertLegalTransition = (from:DriverLevelCode,to:DriverLevelCode) => DRIVER_LEVEL_ORDER.indexOf(to) >= DRIVER_LEVEL_ORDER.indexOf(from)

export function isQualifyingActiveStatus(status:DriverStatus) { return DRIVER_ACTIVE_STATUSES.includes(status) }

export const driverStatusSchema = z.enum(DRIVER_STATUSES)
export const availabilityStatusSchema = z.enum(['offline','available','paused','unavailable'])

export const ASSIGNMENT_STATUSES = ['OFFERED','ACCEPTED','DECLINED','EXPIRED','CANCELLED'] as const
export type AssignmentStatus = typeof ASSIGNMENT_STATUSES[number]

export const DECLINE_REASONS = [
  { code:'VEHICLE_ISSUE', label:'Vehicle issue', legitimate:true },
  { code:'REST_PERIOD', label:'Legitimate rest period', legitimate:true },
  { code:'EMERGENCY', label:'Personal emergency', legitimate:true },
  { code:'OUTSIDE_HOURS', label:'Outside contracted hours', legitimate:true },
  { code:'LICENCE_OR_DOCUMENT', label:'Licence or document matter', legitimate:true },
  { code:'OTHER', label:'Other (reviewed by operations)', legitimate:false },
] as const

export function isLegitimateDecline(code:string, configured:Array<{ code:string; legitimate:boolean }> = DECLINE_REASONS.map((reason) => ({ code:reason.code, legitimate:reason.legitimate }))) {
  const reason = configured.find((item) => item.code === code)
  return Boolean(reason?.legitimate)
}

export function legitimateDeclineRate(offered:number, accepted:number, declinedLegitimate:number) {
  if (offered <= 0) return 0
  return Math.round(((accepted + declinedLegitimate) / offered) * 100 * 100) / 100
}

export const EARNINGS_COMPONENT_KEYS = ['tripEarnings','activeHourEarnings','productivityBonus','performanceBonus','qualityBonus','specialAssignmentBonus'] as const
export type EarningsComponentKey = typeof EARNINGS_COMPONENT_KEYS[number]

export function computeEarningsRecord(components:Record<EarningsComponentKey,number>, deductions:number) {
  const gross = EARNINGS_COMPONENT_KEYS.reduce((sum,key) => sum + (components[key] ?? 0),0)
  const net = Math.max(0, gross - Math.max(0,deductions))
  return { gross:Math.round(gross*100)/100, net:Math.round(net*100)/100 }
}

export const earningsRecordSchema = z.object({
  periodStart:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tripEarnings:z.number().min(0).default(0),
  activeHourEarnings:z.number().min(0).default(0),
  productivityBonus:z.number().min(0).default(0),
  performanceBonus:z.number().min(0).default(0),
  qualityBonus:z.number().min(0).default(0),
  specialAssignmentBonus:z.number().min(0).default(0),
  deductions:z.number().min(0).default(0),
  qualifyingActiveMinutes:z.number().int().min(0).default(0),
})

export function activeHourGuaranteeEarnings(qualifyingActiveMinutes:number, hourlyRate:number, guaranteeHours:number) {
  if (hourlyRate <= 0 || guaranteeHours <= 0) return 0
  const qualifyingHours = Math.min(qualifyingActiveMinutes/60, guaranteeHours)
  return Math.round(qualifyingHours * hourlyRate * 100) / 100
}

export function productivityBonus(completedTrips:number, perTripBonus:number, tripThreshold:number) {
  if (completedTrips <= tripThreshold || perTripBonus <= 0) return 0
  return Math.round((completedTrips - tripThreshold) * perTripBonus * 100) / 100
}

export const PERFORMANCE_COMPONENTS = ['punctuality','acceptanceCompletion','ratingScore','safety','utilisation','vehicleCare','complaints'] as const
export type PerformanceComponentKey = typeof PERFORMANCE_COMPONENTS[number]

export function weightedPerformanceScore(components:Record<PerformanceComponentKey,number>, weights:Record<PerformanceComponentKey,number>) {
  let total=0, weightSum=0
  for (const key of PERFORMANCE_COMPONENTS) {
    const weight = Math.max(0, weights[key] ?? 0)
    if (weight === 0) continue
    total += Math.max(0,Math.min(100,components[key] ?? 0)) * weight
    weightSum += weight
  }
  if (weightSum === 0) return 0
  return Math.round(total / weightSum * 100) / 100
}

export function driverRegistrationSchema() {
  return z.object({
    fullName:z.string().min(3).max(120),
    phone:z.string().min(7).max(20),
    email:z.string().email(),
    licenceNumber:z.string().min(4).max(40),
    licenceExpiry:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    yearsExperience:z.number().int().min(0).max(60),
    vehicle:z.object({ make:z.string().min(2).max(40), model:z.string().min(1).max(60), year:z.number().int().min(1980).max(2100), plateNumber:z.string().min(3).max(20), fuelType:z.enum(['PETROL','DIESEL','HYBRID','ELECTRIC']) }),
    questionnaireSelectedOption:z.string().min(2),
    questionnaireOtherText:z.string().max(500).optional(),
  })
}