import assert from 'node:assert/strict'
import test from 'node:test'
import { createBookingSchema, estimateRequestSchema, generateBookingReference } from '../src/lib/journey.ts'
import { ROUTE_UNAVAILABLE_MESSAGE } from '../src/lib/route-messages.ts'
import { isPlausibleCoordinate, parseDurationSeconds, resolvePlaceId, RouteUnavailableError } from '../src/services/google-maps.server.ts'

const journey = {
  origin: { placeId: 'ChIJ1234567890abcdefGIhg' },
  destination: { address: 'Nnamdi Azikiwe International Airport, Abuja' },
  cityName: 'Abuja',
  vehicleClassCode: 'city',
  passengerCount: 2,
}

test('estimate schema normalises vehicle class codes case-insensitively', () => {
  const parsed = estimateRequestSchema.parse(journey)
  assert.equal(parsed.vehicleClassCode, 'CITY')
  assert.equal(parsed.cityName, 'Abuja')
})

test('estimate schema never reads browser-supplied distance or duration', () => {
  // Zod strips unknown keys; the server only reads place refs/addresses — it never prices
  // from request-supplied measurements. The parsed output proves distanceKm is not carried.
  const parsed = estimateRequestSchema.parse({ ...journey, distanceKm: 42, durationMinutes: 60 })
  assert.equal('distanceKm' in parsed, false)
  assert.equal('durationMinutes' in parsed, false)
})

test('estimate schema requires a selected location for each endpoint', () => emptyOrigin())
function emptyOrigin() {
  const result = estimateRequestSchema.safeParse({ ...journey, origin: {} })
  assert.equal(result.success, false)
}

test('create booking schema inherits the journey contract plus notes', () => {
  const parsed = createBookingSchema.parse({ ...journey, specialInstructions: 'Meet at gate 2' })
  assert.equal(parsed.specialInstructions, 'Meet at gate 2')
})

test('booking references are unique, well-formed and server-side generated', () => {
  const seen = new Set<string>()
  for (let index = 0; index < 200; index++) {
    const reference = generateBookingReference()
    assert.match(reference, /^FTR-[A-HJ-KM-NP-Z2-9]{8}$/)
    seen.add(reference)
  }
  assert.equal(seen.size, 200)
})

test('upstream helpers still reject unusable inputs', async () => {
  assert.equal(parseDurationSeconds('3720s'), 3720)
  assert.equal(isPlausibleCoordinate({ latitude: 9.07, longitude: 7.49 }), true)
  // Malformed place IDs are rejected before any network call is made.
  await assert.rejects(() => resolvePlaceId('ab'), RouteUnavailableError)
  assert.equal(ROUTE_UNAVAILABLE_MESSAGE, 'Route estimate unavailable. Please try again.')
})
