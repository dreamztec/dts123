import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateFare } from '../src/lib/pricing-engine.ts'

test('pricing engine applies base, distance and minimum rules', () => {
  const result=calculateFare({cityId:'11111111-1111-4111-8111-111111111111',vehicleClassId:'22222222-2222-4222-8222-222222222222',serviceType:'IMMEDIATE',distanceKm:10,durationMinutes:20,waitingMinutes:0,passengerCount:1,scheduledAt:new Date('2026-09-08T10:00:00Z')},[{id:'base',priority:1,baseFare:1000,perKm:250,perMinute:20,minimumFare:3000}])
  assert.equal(result.estimate,3900); assert.equal(result.fixed,false)
})

test('pricing engine clearly reports missing configuration', () => {
  const result=calculateFare({cityId:'11111111-1111-4111-8111-111111111111',vehicleClassId:'22222222-2222-4222-8222-222222222222',serviceType:'IMMEDIATE',distanceKm:1,durationMinutes:1,waitingMinutes:0,passengerCount:1,scheduledAt:new Date()},[])
  assert.equal(result.connected,false); assert.equal(result.estimate,null)
})
