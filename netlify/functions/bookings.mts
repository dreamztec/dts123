import type { Config } from '@netlify/functions'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { bookingEvents, bookingPassengers, bookings, cities, membershipPlans, notifications, pricingRules, subscriptions, vehicleClasses } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, json, methodGuard, readJson, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { bookingDraftSchema, generateBookingReference, validateBookingForSomeoneElse } from '../../src/lib/booking-domain'
import { calculateFare, pricingInputSchema, type PricingRule } from '../../src/lib/pricing-engine'
import { membershipDiscountFor, isActiveSubscription } from '../../src/lib/membership'
import { membershipDiscountAmount } from '../../src/lib/booking-domain'

export default async (request:Request) => {
  const guard = methodGuard(request,['GET','POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')

    if (request.method === 'GET') {
      const url = new URL(request.url)
      const statusFilter = url.searchParams.get('status')
      const search = url.searchParams.get('search')
      const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20),1),50)
      const offset = Math.max(Number(url.searchParams.get('offset') ?? 0),0)
      const conditions = [eq(bookings.bookerId,appUser.id)]
      if (statusFilter) conditions.push(eq(bookings.status,statusFilter as typeof bookings.$inferSelect.status))
      if (search) conditions.push(or(ilike(bookings.reference,`%${search}%`),ilike(bookings.specialInstructions,`%${search}%`))!)
      const rows = await db.select({ booking:bookings, cityName:cities.name, className:vehicleClasses.name }).from(bookings).leftJoin(cities,eq(bookings.cityId,cities.id)).leftJoin(vehicleClasses,eq(bookings.vehicleClassId,vehicleClasses.id)).where(and(...conditions)).orderBy(desc(bookings.createdAt)).limit(limit).offset(offset)
      const [{ count }] = await db.select({ count:sql<number>`count(*)::int` }).from(bookings).where(and(...conditions))
      return json({ bookings:rows.map((row) => ({ ...row.booking, cityName:row.cityName, vehicleClassName:row.className })), total:Number(count), limit, offset })
    }

    const parsed = await readJson(request,bookingDraftSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const draft = parsed.ok.data
    try { validateBookingForSomeoneElse(draft) } catch (error) { return badRequest(error instanceof Error ? error.message : 'Invalid booking') }

    const [city] = await db.select().from(cities).where(and(eq(cities.id,draft.cityId),eq(cities.active,true))).limit(1)
    if (!city) return badRequest('City is not active for operations')
    const [vehicleClass] = await db.select().from(vehicleClasses).where(and(eq(vehicleClasses.id,draft.vehicleClassId),eq(vehicleClasses.active,true))).limit(1)
    if (!vehicleClass) return badRequest('Vehicle class is not available')

    const [activeSubscription] = await db.select({ subscription:subscriptions, plan:membershipPlans }).from(subscriptions).innerJoin(membershipPlans,eq(subscriptions.planId,membershipPlans.id)).where(and(eq(subscriptions.userId,appUser.id),eq(subscriptions.status,'ACTIVE'))).orderBy(desc(subscriptions.createdAt)).limit(1)
    const discountPercent = activeSubscription && isActiveSubscription(activeSubscription.subscription) ? membershipDiscountFor(activeSubscription.plan.code) : 0

    const measure = pricingInputSchema.safeParse({
      cityId:draft.cityId, vehicleClassId:draft.vehicleClassId, serviceType:draft.serviceType,
      distanceKm:0, durationMinutes:0, waitingMinutes:0, passengerCount:draft.passengerCount,
      scheduledAt:draft.scheduledAt ?? new Date(),
    })
    let estimate: { connected:boolean; price:number|null; discount:number; message:string } = {
      connected:false, price:null, discount:0,
      message:'Route distance is measured server-side when map data is available for this journey; pricing cannot be estimated yet.',
    }
    if (measure.success) {
      const ruleRecords = await db.select().from(pricingRules).where(eq(pricingRules.active,true))
      const mapped:PricingRule[] = ruleRecords.map((record) => ({ id:record.id, priority:record.priority, ...(record.calculation as Omit<PricingRule,'id'|'priority'>), conditions:record.conditions as PricingRule['conditions'] }))
      const fare = calculateFare(measure.data,mapped)
      const base = fare.estimate ?? null
      estimate = {
        connected:fare.connected,
        price:base,
        discount:base != null && fare.connected ? membershipDiscountAmount(base,discountPercent) : 0,
        message:fare.connected ? (fare.disclaimer ?? '') : (fare.message ?? 'Pricing configuration not available'),
      }
    }

    const reference = generateBookingReference()
    const [booking] = await db.insert(bookings).values({
      reference, bookerId:appUser.id, cityId:draft.cityId, vehicleClassId:draft.vehicleClassId, serviceType:draft.serviceType, bookingRelationship:draft.relationship, tripType:draft.tripType,
      pickup:draft.pickup, destination:draft.destination, scheduledAt:draft.scheduledAt ?? null, passengerCount:draft.passengerCount, specialInstructions:draft.specialInstructions ?? null,
      estimate:{ price:estimate.price, discount:estimate.discount, connected:estimate.connected, message:estimate.message }, status:'DRAFT',
    }).returning()
    await db.insert(bookingEvents).values({ bookingId:booking.id, fromStatus:null, toStatus:'DRAFT', actorId:appUser.id, note:`Booking created (${draft.relationship})` })
    if (draft.relationship !== 'SELF' && draft.passengerName && draft.passengerPhone) {
      await db.insert(bookingPassengers).values({ bookingId:booking.id, fullName:draft.passengerName, phone:draft.passengerPhone, isBooker:false, specialInstructions:draft.specialInstructions ?? null })
      await db.insert(notifications).values({ userId:appUser.id, channel:'IN_APP', templateKey:'booking.for_someone_else', subject:'Booking for someone else', content:{ reference:booking.reference, passenger:draft.passengerName, delivery:'External passenger notification is stored as an intent and will be sent once a messaging provider is connected.' } })
    } else {
      await db.insert(bookingPassengers).values({ bookingId:booking.id, userId:appUser.id, fullName:appUser.fullName, phone:appUser.phone ?? '', isBooker:true })
    }
    await audit({ actorId:appUser.id, action:'booking.create', targetType:'booking', targetId:booking.id, after:{ reference, status:'DRAFT' }, request })
    return json({ booking, estimate },{ status:201 })
  } catch (error) { return serverError('bookings',error) }
}

export const config:Config = { path:'/api/bookings' }