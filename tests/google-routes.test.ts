import assert from 'node:assert/strict'
import test from 'node:test'
import { GoogleMapsProvider, RouteUnavailableError, isPlausibleCoordinate, parseDurationSeconds } from '../src/services/google-maps.server.ts'
import { calculateFare } from '../src/lib/pricing-engine.ts'

test('parses Google protobuf duration strings', () => {
  assert.equal(parseDurationSeconds('1284s'), 1284)
  assert.equal(parseDurationSeconds('90.5s'), 90.5)
  assert.equal(parseDurationSeconds('not-a-duration'), null)
  assert.equal(parseDurationSeconds(undefined), null)
})

test('rejects implausible coordinates', () => {
  assert.equal(isPlausibleCoordinate({ latitude:9.0765, longitude:7.4589 }), true)
  assert.equal(isPlausibleCoordinate({ latitude:120, longitude:7 }), false)
  assert.equal(isPlausibleCoordinate({ latitude:'9', longitude:7 }), false)
  assert.equal(isPlausibleCoordinate(null), false)
})

test('route lookup refuses invalid coordinates instead of inventing a distance', async () => {
  const provider = new GoogleMapsProvider()
  await assert.rejects(
    () => provider.route({ latitude:Number.NaN, longitude:7.4 }, { latitude:9, longitude:7 }),
    (error:unknown) => error instanceof RouteUnavailableError && error.customerMessage === 'Route estimate unavailable. Please try again.',
  )
})

test('fare breakdown itemises the measured road route', () => {
  const result = calculateFare({
    cityId:'11111111-1111-4111-8111-111111111111', vehicleClassId:'22222222-2222-4222-8222-222222222222',
    serviceType:'IMMEDIATE', distanceKm:28.4, durationMinutes:41, waitingMinutes:0, passengerCount:1,
    scheduledAt:new Date('2026-09-09T09:00:00Z'),
  }, [{ id:'base', priority:1, baseFare:1500, perKm:280, perMinute:25, minimumFare:2500 }])
  const labels = result.breakdown.map((line) => line.label)
  assert.deepEqual(labels, ['Base fare','Distance charge','Time charge'])
  assert.equal(result.breakdown[1].detail, '28.4 km by road')
  assert.equal(result.breakdown[2].detail, '41 min driving time')
  // 1500 + 28.4*280 + 41*25 = 1500 + 7952 + 1025
  assert.equal(result.estimate, 10477)
  assert.equal(result.breakdown.reduce((sum, line) => sum + line.amount, 0), result.estimate)
})

test('percentage adjustments appear as an explicit fee line', () => {
  const result = calculateFare({
    cityId:'11111111-1111-4111-8111-111111111111', vehicleClassId:'22222222-2222-4222-8222-222222222222',
    serviceType:'IMMEDIATE', distanceKm:10, durationMinutes:20, waitingMinutes:0, passengerCount:1,
    scheduledAt:new Date('2026-09-09T09:00:00Z'),
  }, [{ id:'base', priority:1, baseFare:1000, perKm:200, perMinute:0 }, { id:'peak', priority:2, percentageAdjustment:10 }])
  assert.equal(result.estimate, 3300)
  assert.deepEqual(result.breakdown.map((line) => line.label), ['Base fare','Distance charge','Applicable fee'])
  assert.equal(result.breakdown[2].detail, '+10%')
})
