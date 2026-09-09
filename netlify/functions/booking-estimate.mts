import { and, eq, isNull, or } from 'drizzle-orm'
import type { Config } from '@netlify/functions'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { cities, pricingRules, vehicleClasses } from '../../db/schema.js'
import { calculateFare, type PricingRule } from '../../src/lib/pricing-engine.js'
import { estimateRequestSchema, type EstimateRequest, type JourneyEndpoint } from '../../src/lib/journey.js'
import { IntegrationNotConnectedError } from '../../src/services/adapters.js'
import { ROUTE_UNAVAILABLE_MESSAGE, RouteUnavailableError, googleMapsProvider, resolvePlaceId } from '../../src/services/google-maps.server.js'

const headers = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }

/** Turns a submitted endpoint into coordinates the server has verified with Google. */
async function resolveEndpoint(endpoint: JourneyEndpoint, label: string) {
  if (endpoint.placeId) {
    const place = await resolvePlaceId(endpoint.placeId)
    return { coordinates: place.coordinates, address: place.formattedAddress ?? endpoint.address, placeId: place.placeId }
  }
  if (endpoint.address) {
    const results = await googleMapsProvider.geocode(endpoint.address)
    if (!results.length) throw new RouteUnavailableError(`${label} could not be located`)
    return { coordinates: results[0], address: endpoint.address, placeId: undefined }
  }
  return { coordinates: { latitude: endpoint.latitude!, longitude: endpoint.longitude! }, address: endpoint.address, placeId: undefined }
}

/**
 * Shared estimate core: validates a journey request, resolves city and vehicle-class
 * configuration server-side, measures the road route with Google, and prices it from the
 * database pricing rules. Both the estimate endpoint and the booking-creation endpoint use
 * this single flow so there is exactly one route-and-price pipeline.
 */
export async function buildEstimate(rawInput: unknown) {
  let input: EstimateRequest
  try {
    input = estimateRequestSchema.parse(rawInput)
  } catch (error) {
    const message = error instanceof z.ZodError ? (error.issues[0]?.message ?? 'Invalid request') : 'Invalid request'
    return { error: Response.json({ available:false, error:message },{ status:400, headers }) } as const
  }

  // Resolve the customer's public selections against configuration. Internal UUIDs never leave the server.
  const [city] = await db.select().from(cities).where(and(eq(cities.name,input.cityName), eq(cities.active,true))).limit(1)
  if (!city) return { error: Response.json({ available:false, error:`FASTRIDES does not currently serve ${input.cityName}.` },{ status:400, headers }) } as const
  const [vehicleClass] = await db.select().from(vehicleClasses).where(and(eq(vehicleClasses.code,input.vehicleClassCode), eq(vehicleClasses.active,true))).limit(1)
  if (!vehicleClass) return { error: Response.json({ available:false, error:'That vehicle class is not currently available.' },{ status:400, headers }) } as const
  if (input.passengerCount > vehicleClass.passengerCapacity) {
    return { error: Response.json({ available:false, error:`${vehicleClass.name} seats up to ${vehicleClass.passengerCapacity} passengers.` },{ status:400, headers }) } as const
  }

  // The server is the sole source of truth for distance and duration.
  let origin: Awaited<ReturnType<typeof resolveEndpoint>>
  let destination: Awaited<ReturnType<typeof resolveEndpoint>>
  let route: Awaited<ReturnType<typeof googleMapsProvider.route>>
  try {
    origin = await resolveEndpoint(input.origin,'Pickup')
    destination = await resolveEndpoint(input.destination,'Destination')
    route = await googleMapsProvider.route(origin.coordinates,destination.coordinates)
  } catch (error) {
    if (error instanceof RouteUnavailableError) {
      console.error('[booking-estimate] route lookup failed', { reason: error.reason })
      return { error: Response.json({ available:false, error:error.customerMessage },{ status:503, headers }) } as const
    }
    if (error instanceof IntegrationNotConnectedError) {
      console.error('[booking-estimate] maps integration not configured')
      return { error: Response.json({ available:false, error:ROUTE_UNAVAILABLE_MESSAGE },{ status:503, headers }) } as const
    }
    console.error('[booking-estimate] unexpected route error', { message: error instanceof Error ? error.message : 'unknown' })
    return { error: Response.json({ available:false, error:ROUTE_UNAVAILABLE_MESSAGE },{ status:503, headers }) } as const
  }

  const scheduledAt = input.scheduledAt ?? new Date()
  const records = await db.select().from(pricingRules).where(and(
    eq(pricingRules.active,true),
    or(isNull(pricingRules.cityId), eq(pricingRules.cityId,city.id)),
    or(isNull(pricingRules.vehicleClassId), eq(pricingRules.vehicleClassId,vehicleClass.id)),
  ))
  const mapped:PricingRule[] = records.map((record) => ({ id:record.id, priority:record.priority, ...(record.calculation as Omit<PricingRule,'id'|'priority'>), conditions:record.conditions as PricingRule['conditions'] }))

  // Measured route values — not values supplied by the browser — are what get priced.
  const pricing = calculateFare({
    cityId: city.id,
    vehicleClassId: vehicleClass.id,
    serviceType: input.serviceType,
    distanceKm: route.distanceKm,
    durationMinutes: route.durationMinutes,
    waitingMinutes: input.waitingMinutes,
    passengerCount: input.passengerCount,
    scheduledAt,
  }, mapped)

  return {
    city,
    vehicleClass,
    input,
    origin,
    destination,
    route,
    scheduledAt,
    pricing,
    payload: {
      available: true,
      route: {
        distanceKm: route.distanceKm,
        durationMinutes: route.durationMinutes,
        etaIso: new Date(scheduledAt.getTime() + route.durationMinutes*60_000).toISOString(),
        polyline: route.geometry ?? null,
        source: 'Google Routes API (driving, traffic aware)',
      },
      origin: { address: origin.address ?? null, placeId: origin.placeId ?? null },
      destination: { address: destination.address ?? null, placeId: destination.placeId ?? null },
      vehicleClass: { code: vehicleClass.code, name: vehicleClass.name, passengerCapacity: vehicleClass.passengerCapacity },
      pricing,
    },
  } as const
}

export default async (request:Request) => {
  if (request.method !== 'POST') return Response.json({ error:'Method not allowed' },{ status:405, headers })
  const body = await request.json().catch(() => null)
  const result = await buildEstimate(body)
  return result.error ?? Response.json(result.payload,{ headers })
}

export const config:Config = { path:'/api/bookings/estimate' }
