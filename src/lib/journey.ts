import { z } from 'zod'

export const VEHICLE_CLASS_CODES = ['CITY', 'PREMIUM', 'SUV', 'LUXURY', 'BUS', 'EV', 'CHAUFFEUR'] as const
export type VehicleClassCode = typeof VEHICLE_CLASS_CODES[number]

/**
 * A journey endpoint as submitted by the browser. Only a place reference or coordinates are
 * accepted — distance and duration are never read from the request; the server measures them.
 */
export const journeyEndpointSchema = z.object({
  placeId: z.string().regex(/^[A-Za-z0-9_-]{5,512}$/).optional(),
  address: z.string().trim().min(3).max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).refine((value) => Boolean(value.placeId) || Boolean(value.address) || (value.latitude !== undefined && value.longitude !== undefined), { message: 'A selected location is required' })

export const estimateRequestSchema = z.object({
  origin: journeyEndpointSchema,
  destination: journeyEndpointSchema,
  cityName: z.string().trim().min(2).max(80).default('Abuja'),
  vehicleClassCode: z.string().trim().toUpperCase().pipe(z.enum(VEHICLE_CLASS_CODES)),
  serviceType: z.string().trim().min(2).max(40).default('IMMEDIATE'),
  passengerCount: z.coerce.number().int().min(1).max(14).default(1),
  waitingMinutes: z.coerce.number().int().min(0).max(240).default(0),
  scheduledAt: z.coerce.date().optional(),
})

export type EstimateRequestInput = z.input<typeof estimateRequestSchema>
export type EstimateRequest = z.output<typeof estimateRequestSchema>
export type JourneyEndpoint = z.output<typeof journeyEndpointSchema>

/** Booking creation accepts the same journey plus optional customer notes. */
export const createBookingSchema = estimateRequestSchema.extend({
  specialInstructions: z.string().trim().max(500).optional(),
})

const REFERENCE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Human-friendly, unambiguous booking reference generated server-side only. */
export function generateBookingReference(): string {
  const bytes = new Uint8Array(8)
  globalThis.crypto.getRandomValues(bytes)
  return `FTR-${Array.from(bytes, (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join('')}`
}

export type BookingSummary = {
  reference: string
  status: string
  tripType: string
  pickup: unknown
  destination: unknown
  scheduledAt: string | null
  passengerCount: number
  createdAt: string
  cityName: string
  vehicleClassCode: string | null
  vehicleClassName: string | null
  estimate: { route?: { distanceKm?: number; durationMinutes?: number }; pricing?: { estimate?: number | null; currency?: string; connected?: boolean } }
}
