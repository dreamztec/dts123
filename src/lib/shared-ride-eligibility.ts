import type { SharedCandidate, MatchingRules } from './shared-ride-matching'

export const MAX_SHARED_PASSENGERS = 4

export type SharedEligibilityContext = {
  membershipPlanCode:string|null
  subscriptionActive:boolean
  vehicleClassSharedEligible:boolean
  serviceAllowsShared:boolean
  citySharedEnabled:boolean
}

export function isSharedEligible(context:SharedEligibilityContext) {
  if (!context.membershipPlanCode) return { eligible:false, reason:'FASTRIDES membership is required for shared rides' }
  if (!context.subscriptionActive) return { eligible:false, reason:'An active FASTRIDES membership subscription is required' }
  if (!context.citySharedEnabled) return { eligible:false, reason:'Shared rides are not enabled in this city yet' }
  if (!context.serviceAllowsShared) return { eligible:false, reason:'This service does not support shared rides' }
  if (!context.vehicleClassSharedEligible) return { eligible:false, reason:'This vehicle class is not eligible for shared rides' }
  return { eligible:true }
}

export function seatCapacityOk(participants:{ seats:number }[], rules:MatchingRules) {
  const total = participants.reduce((sum,participant) => sum + participant.seats,0)
  return { ok:total <= rules.maxPassengers, total, remaining:Math.max(0,rules.maxPassengers-total) }
}

export function sharedRideStatusFlow(current:string,next:string) {
  const flow: Record<string, readonly string[]> = {
    AVAILABLE:['MATCHING','CANCELLED'], MATCHING:['MATCHED','CANCELLED'], MATCHED:['PICKUP_PENDING','CANCELLED'],
    PICKUP_PENDING:['PICKING_UP','CANCELLED'], PICKING_UP:['IN_TRANSIT','CANCELLED'], IN_TRANSIT:['DROPPING_OFF'],
    DROPPING_OFF:['COMPLETED'], COMPLETED:[], CANCELLED:[],
  }
  if (!flow[current]?.includes(next)) throw new Error(`Invalid shared-ride transition: ${current} → ${next}`)
  return true
}

export type { SharedCandidate }