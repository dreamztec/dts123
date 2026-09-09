import assert from 'node:assert/strict'
import test from 'node:test'
import { matchSharedRide, type SharedCandidate } from '../src/lib/shared-ride-matching.ts'

const city='11111111-1111-4111-8111-111111111111'; const vehicleClass='22222222-2222-4222-8222-222222222222'; const pickupZone='33333333-3333-4333-8333-333333333333'; const dropZone='44444444-4444-4444-8444-444444444444'
const candidate=(id:string,latitude:number,seats=1):SharedCandidate => ({id,userId:id.replace(/^./,'9'),cityId:city,vehicleClassId:vehicleClass,seats,pickup:{latitude,longitude:7.49,zoneId:pickupZone},destination:{latitude:9.0,longitude:7.3,zoneId:dropZone},availableAt:new Date('2026-09-08T10:00:00Z'),availabilityMode:true,membershipEligible:true})
const rules={maxPassengers:4 as const,maxPickupDistanceKm:3,maxDestinationDistanceKm:3,maxWaitMinutes:15,eligibleVehicleClassIds:[vehicleClass],enabledPickupZoneIds:[pickupZone],enabledDropoffZoneIds:[dropZone]}

test('matches compatible members without exceeding four seats', () => {
  const result=matchSharedRide(candidate('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',9.05,2),[candidate('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',9.051,2),candidate('cccccccc-cccc-4ccc-8ccc-cccccccccccc',9.052,1)],rules,new Date('2026-09-08T10:05:00Z'))
  assert.equal(result.matched,true); assert.equal(result.totalPassengers,4); assert.equal(result.participants.length,2)
})
