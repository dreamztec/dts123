import { z } from 'zod'
import { bookingStatuses, validTripTransitions } from './domain'

export const placeSchema = z.object({ label:z.string().min(2).max(200), address:z.string().min(2).max(300), latitude:z.number().min(-90).max(90).optional(), longitude:z.number().min(-180).max(180).optional(), zoneId:z.string().uuid().optional(), notes:z.string().max(300).optional() })
export type Place = z.infer<typeof placeSchema>

export const bookingStatusSchema = z.enum(bookingStatuses)
export type BookingStatus = z.infer<typeof bookingStatusSchema>

export const relationshipSchema = z.enum(['SELF','FRIEND','FAMILY','EMPLOYEE','GUEST','CLIENT'])
export type BookingRelationshipInput = z.infer<typeof relationshipSchema>

export const bookingDraftSchema = z.object({
  cityId:z.string().uuid(),
  vehicleClassId:z.string().uuid(),
  serviceType:z.string().min(2).max(40),
  tripType:z.enum(['IMMEDIATE','SCHEDULED','ROUND_TRIP','HOURLY','AIRPORT','INTERSTATE','EVENT']),
  pickup:placeSchema,
  destination:placeSchema,
  scheduledAt:z.coerce.date().optional(),
  passengerCount:z.number().int().min(1).max(14).default(1),
  specialInstructions:z.string().max(500).optional(),
  relationship:relationshipSchema.default('SELF'),
  passengerName:z.string().min(2).max(120).optional(),
  passengerPhone:z.string().min(7).max(20).optional(),
})
export type BookingDraft = z.infer<typeof bookingDraftSchema>

export function validateBookingForSomeoneElse(draft:BookingDraft) {
  if (draft.relationship !== 'SELF' && (!draft.passengerName || !draft.passengerPhone)) throw new Error('Passenger name and phone are required when booking for someone else')
  if (draft.tripType === 'SCHEDULED' || draft.tripType === 'AIRPORT' || draft.tripType === 'INTERSTATE') {
    if (!draft.scheduledAt) throw new Error('A scheduled time is required for this trip type')
    if (draft.scheduledAt.getTime() < Date.now() - 60_000) throw new Error('Scheduled time must be in the future')
  }
  if (draft.pickup.address.trim().toLowerCase() === draft.destination.address.trim().toLowerCase()) throw new Error('Pickup and destination must be different')
  return true
}

export function assertBookingTransition(current:string, next:string) {
  if (!(bookingStatuses as readonly string[]).includes(current) || !(bookingStatuses as readonly string[]).includes(next)) throw new Error(`Unknown booking status: ${current} → ${next}`)
  if (!validTripTransitions[current]?.includes(next)) throw new Error(`Invalid booking transition: ${current} → ${next}`)
  return true
}

export const CANCELLATION_RULES = {
  freeWindowMinutesBeforePickup: 60,
  driverEnRouteCancelAllowed: false,
  lateCancelFeePolicyKey: 'cancellation.late_fee_percent',
} as const

export function canCancelBooking(status:string, scheduledAt:Date|null, now=new Date()) {
  if (['CANCELLED','COMPLETED','REFUNDED','NO_SHOW'].includes(status)) return { allowed:false, reason:'Booking is already closed' }
  if (['DRIVER_EN_ROUTE','DRIVER_ARRIVED','PASSENGER_ONBOARD','IN_PROGRESS'].includes(status)) return { allowed:false, reason:'Chauffeur is already en route or the trip has started' }
  if (status === 'DRAFT' || status === 'PENDING_PAYMENT' || status === 'CONFIRMED' || status === 'SEARCHING_DRIVER' || status === 'DRIVER_ASSIGNED') {
    if (scheduledAt) {
      const minutes = (scheduledAt.getTime() - now.getTime()) / 60_000
      if (minutes < 0) return { allowed:true, late:true }
      return { allowed:true, late:minutes < CANCELLATION_RULES.freeWindowMinutesBeforePickup }
    }
    return { allowed:true, late:false }
  }
  return { allowed:true, late:false }
}

export function generateBookingReference(prefix='FR', now=new Date()) {
  const stamp = now.toISOString().slice(2,10).replaceAll('-','')
  const random = Math.random().toString(36).slice(2,7).toUpperCase()
  return `${prefix}-${stamp}-${random}`
}

export function membershipDiscountAmount(estimate:number, benefitPercent:number|null) {
  if (!benefitPercent || benefitPercent <= 0) return 0
  const capped = Math.min(benefitPercent, 50)
  return Math.round(estimate * capped / 100 * 100) / 100
}