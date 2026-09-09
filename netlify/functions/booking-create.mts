import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { getUser } from '@netlify/identity'
import { db } from '../../db/index.js'
import { bookings, cities, users, vehicleClasses } from '../../db/schema.js'
import { createBookingSchema, generateBookingReference, type BookingSummary } from '../../src/lib/journey.js'
import { buildEstimate } from './booking-estimate.mts'

const headers = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }

/** Maps an Identity user to the application user row, provisioning it on first booking. */
async function requireApplicationUser(identityId: string, email: string, fullName: string) {
  const [existing] = await db.select().from(users).where(eq(users.identityId, identityId)).limit(1)
  if (existing) return existing
  const [provisioned] = await db.insert(users).values({
    identityId,
    email,
    fullName,
    role: 'customer',
    status: 'ACTIVE',
    lastLoginAt: new Date(),
  }).onConflictDoUpdate({ target: users.identityId, set: { email, fullName, lastLoginAt: new Date() } }).returning()
  return provisioned
}

export default async (request: Request) => {
  const identity = await getUser()
  if (!identity) return Response.json({ error:'Please log in to manage your bookings.' },{ status:401, headers })

  // List the authenticated customer's bookings for the My Trips workspace.
  if (request.method === 'GET') {
    const [appUser] = await db.select().from(users).where(eq(users.identityId, String(identity.id))).limit(1)
    if (!appUser) return Response.json({ bookings: [] as BookingSummary[] },{ headers })
    const rows = await db.select({ booking: bookings, cityName: cities.name, classCode: vehicleClasses.code, className: vehicleClasses.name })
      .from(bookings)
      .innerJoin(cities, eq(cities.id, bookings.cityId))
      .leftJoin(vehicleClasses, eq(vehicleClasses.id, bookings.vehicleClassId))
      .where(eq(bookings.bookerId, appUser.id))
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

  const appUser = await requireApplicationUser(
    String(identity.id),
    String(identity.email ?? ''),
    String(identity.user_metadata?.full_name ?? identity.email?.split('@')[0] ?? 'FASTRIDES customer'),
  )
  if (!appUser) return Response.json({ error:'We could not set up your customer account.' },{ status:500, headers })

  const reference = generateBookingReference()
  const pickupPayload = { address: origin.address ?? null, placeId: origin.placeId ?? null, coordinates: origin.coordinates }
  const destinationPayload = { address: destination.address ?? null, placeId: destination.placeId ?? null, coordinates: destination.coordinates }

  try {
    const [booking] = await db.insert(bookings).values({
      reference,
      bookerId: appUser.id,
      cityId: city.id,
      vehicleClassId: vehicleClass.id,
      tripType: 'SINGLE',
      status: 'CONFIRMED',
      pickup: pickupPayload,
      destination: destinationPayload,
      scheduledAt,
      passengerCount: input.passengerCount,
      specialInstructions: input.specialInstructions ?? null,
      estimate: {
        route: { distanceKm: route.distanceKm, durationMinutes: route.durationMinutes },
        pricing: { connected: pricing.connected, currency: pricing.currency, estimate: pricing.estimate, fixed: pricing.fixed ?? false, breakdown: pricing.breakdown },
      },
      cancellationRuleSnapshot: { snapshot: 'standard', capturedAt: new Date().toISOString() },
    }).returning()

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

export const config:Config = { path:'/api/bookings' }
