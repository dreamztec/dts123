import type { Config } from '@netlify/functions'
import { and, desc, eq, ne } from 'drizzle-orm'
import { getUser } from '@netlify/identity'
import { db } from '../../db/index.js'
import { bookingEvents, bookings, cities, users, vehicleClasses } from '../../db/schema.js'
import { createBookingSchema, type BookingSummary } from '../../src/lib/journey.js'
import { generateBookingReference } from '../../src/lib/booking-domain'
import { audit } from './_lib/api.mts'
import { buildEstimate } from './booking-estimate.mts'

const headers = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }

export default async (request: Request) => {
  const identity = await getUser()
  if (!identity) return Response.json({ error:'Please log in to manage your bookings.' },{ status:401, headers })

  // List the authenticated customer's confirmed journeys for the My Trips workspace.
  if (request.method === 'GET') {
    const [appUser] = await db.select().from(users).where(eq(users.identityId, String(identity.id))).limit(1)
    if (!appUser) return Response.json({ bookings: [] as BookingSummary[] },{ headers })
    const rows = await db.select({ booking: bookings, cityName: cities.name, classCode: vehicleClasses.code, className: vehicleClasses.name })
      .from(bookings)
      .innerJoin(cities, eq(cities.id, bookings.cityId))
      .leftJoin(vehicleClasses, eq(vehicleClasses.id, bookings.vehicleClassId))
      .where(and(eq(bookings.bookerId, appUser.id), ne(bookings.status, 'DRAFT')))
      .orderBy(desc(bookings.createdAt))
      .limit(50)
    const list: BookingSummary[] = rows.map(({ booking, cityName, classCode, className }) => ({
      reference: booking.reference,
      status: booking.status,
      tripType: booking.tripType,
      pickup: booking.pickup,
      destination: booking.destination,
      scheduledAt: booking.scheduledAt ? booking.scheduledAt.toISOString() : null,
      passengerCount: booking.passengerCount,
      createdAt: booking.createdAt.toISOString(),
      cityName,
      vehicleClassCode: classCode ?? null,
      vehicleClassName: className ?? null,
      estimate: booking.estimate as BookingSummary['estimate'],
    }))
    return Response.json({ bookings: list },{ headers })
  }

  if (request.method !== 'POST') return Response.json({ error:'Method not allowed' },{ status:405, headers })

  const body = await request.json().catch(() => null)
  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request'
    return Response.json({ error: message },{ status:400, headers })
  }
  const input = parsed.data

  const estimate = await buildEstimate(body)
  if (estimate.error) return estimate.error
  const { city, vehicleClass, origin, destination, route, scheduledAt, pricing } = estimate

  // Maps an Identity user to the application user row, provisioning it on first booking.
  const [existingUser] = await db.select().from(users).where(eq(users.identityId, String(identity.id))).limit(1)
  let appUser = existingUser
  if (!appUser) {
    const [provisioned] = await db.insert(users).values({
      identityId: String(identity.id),
      email: String(identity.email ?? ''),
      fullName: String(identity.user_metadata?.full_name ?? identity.email?.split('@')[0] ?? 'FASTRIDES customer'),
      role: 'customer',
      status: 'ACTIVE',
      lastLoginAt: new Date(),
    }).onConflictDoUpdate({ target: users.identityId, set: { email: String(identity.email ?? ''), fullName: String(identity.user_metadata?.full_name ?? identity.email?.split('@')[0] ?? 'FASTRIDES customer'), lastLoginAt: new Date() } }).returning()
    appUser = provisioned
  }
  if (!appUser) return Response.json({ error:'We could not set up your customer account.' },{ status:500, headers })

  const reference = generateBookingReference('FR')
  const pickupPayload = { label: origin.address ?? 'Selected location', address: origin.address ?? 'Selected location', placeId: origin.placeId ?? null, latitude: origin.coordinates.latitude, longitude: origin.coordinates.longitude }
  const destinationPayload = { label: destination.address ?? 'Selected location', address: destination.address ?? 'Selected location', placeId: destination.placeId ?? null, latitude: destination.coordinates.latitude, longitude: destination.coordinates.longitude }

  try {
    const [booking] = await db.insert(bookings).values({
      reference,
      bookerId: appUser.id,
      cityId: city.id,
      vehicleClassId: vehicleClass.id,
      serviceType: input.serviceType,
      bookingRelationship: 'SELF',
      tripType: 'IMMEDIATE',
      status: 'CONFIRMED',
      pickup: pickupPayload,
      destination: destinationPayload,
      scheduledAt,
      passengerCount: input.passengerCount,
      specialInstructions: input.specialInstructions ?? null,
      estimate: {
        price: pricing.estimate,
        connected: pricing.connected,
        message: pricing.disclaimer ?? '',
        route: { distanceKm: route.distanceKm, durationMinutes: route.durationMinutes },
        pricing: { connected: pricing.connected, currency: pricing.currency, estimate: pricing.estimate, fixed: pricing.fixed ?? false, breakdown: pricing.breakdown },
      },
      routeSnapshot: { distanceKm: route.distanceKm, durationMinutes: route.durationMinutes, polyline: route.geometry ?? null, source: 'GOOGLE_ROUTES', measuredAt: new Date().toISOString() },
      fareSnapshot: pricing,
      cancellationRuleSnapshot: { snapshot: 'standard', capturedAt: new Date().toISOString() },
    }).returning()

    await db.insert(bookingEvents).values({ bookingId: booking.id, fromStatus: null, toStatus: 'CONFIRMED', actorId: appUser.id, note: 'Instant journey confirmed with server-measured route' })
    await audit({ actorId: appUser.id, action: 'journey.create', targetType: 'booking', targetId: booking.id, after: { reference, status: 'CONFIRMED' }, request })

    const summary: BookingSummary = {
      reference: booking.reference,
      status: booking.status,
      tripType: booking.tripType,
      pickup: booking.pickup,
      destination: booking.destination,
      scheduledAt: booking.scheduledAt ? booking.scheduledAt.toISOString() : null,
      passengerCount: booking.passengerCount,
      createdAt: booking.createdAt.toISOString(),
      cityName: city.name,
      vehicleClassCode: vehicleClass.code,
      vehicleClassName: vehicleClass.name,
      estimate: booking.estimate as BookingSummary['estimate'],
    }
    return Response.json({ ok:true, booking: summary },{ headers })
  } catch (error) {
    console.error('[booking-create] insert failed', { message: error instanceof Error ? error.message : 'unknown' })
    return Response.json({ error:'We could not save your booking. Please try again.' },{ status:500, headers })
  }
}

export const config:Config = { path:'/api/journeys' }
