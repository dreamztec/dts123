import { z } from 'zod'
import { recurringDays } from './domain'

export const daysSchema = z.array(z.enum(recurringDays)).min(1)
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

export const routineSubscriptionSchema = z.object({
  packageCode:z.string().min(2).max(60).optional(),
  origin:z.object({ label:z.string().min(2).max(200), address:z.string().min(2).max(300), latitude:z.number().optional(), longitude:z.number().optional() }),
  destination:z.object({ label:z.string().min(2).max(200), address:z.string().min(2).max(300), latitude:z.number().optional(), longitude:z.number().optional() }),
  days:daysSchema,
  pickupTime:timeSchema,
  returnTime:timeSchema.optional(),
  passengers:z.number().int().min(1).max(14).default(1),
  vehicleClassCode:z.enum(['CITY','PREMIUM','SUV','LUXURY','BUS']).default('CITY'),
  serviceType:z.enum(['ROUTINE','CORPORATE']).default('ROUTINE'),
  startDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
export type RoutineSubscriptionInput = z.infer<typeof routineSubscriptionSchema>

export function validateRoutineWindow(startDate:string, endDate?:string) {
  if (endDate && endDate < startDate) throw new Error('End date cannot be before the start date')
  return true
}

export function nextRoutineDate(days:readonly string[], time:string, after=new Date()) {
  const [hours,minutes] = time.split(':').map(Number)
  for (let offset=0; offset<8; offset++) {
    const candidate = new Date(after)
    candidate.setDate(candidate.getDate() + offset)
    const day = ['SUN','MON','TUE','WED','THU','FRI','SAT'][candidate.getDay()]
    if (!days.includes(day)) continue
    candidate.setHours(hours,minutes,0,0)
    if (candidate.getTime() > after.getTime()) return candidate
  }
  return null
}

export function routineTotals(input:{ oneWayPrice:number|null; packagePrice:number|null; discountPercent:number|null; ridesPerRoundTrip:number }) {
  const { oneWayPrice, packagePrice, discountPercent, ridesPerRoundTrip } = input
  if (oneWayPrice == null) return { calculable:false as const, reason:'Route price cannot yet be calculated — routing configuration is required for this origin and destination.' }
  const oneWayTotal = oneWayPrice
  const roundTripTotal = oneWayPrice * 2
  const gross = packagePrice != null ? packagePrice : roundTripTotal * ridesPerRoundTrip
  const discount = discountPercent ? Math.round(gross * discountPercent / 100 * 100) / 100 : 0
  const packageTotal = Math.round((gross - discount) * 100) / 100
  return { calculable:true as const, oneWayTotal, roundTripTotal, packageTotal, discount, savings:Math.round(discount * 100) / 100 }
}