import assert from 'node:assert/strict'
import test from 'node:test'
import { routineSubscriptionSchema, validateRoutineWindow, nextRoutineDate, routineTotals } from '../src/lib/routine.ts'
import { membershipDiscountFor, isActiveSubscription, nextRenewalDate, savingsFromAnnual } from '../src/lib/membership.ts'
import { isSharedEligible, seatCapacityOk, sharedRideStatusFlow, MAX_SHARED_PASSENGERS } from '../src/lib/shared-ride-eligibility.ts'

test('routine subscriptions require at least one day and a valid pickup time', () => {
  const base = {
    origin:{ label:'Gwagwalada', address:'Gwagwalada, FCT' },
    destination:{ label:'Wuse', address:'Wuse, Abuja' },
    days:['MON','TUE'] as never,
    pickupTime:'06:30',
    passengers:1,
    startDate:'2026-09-14',
  }
  assert.doesNotThrow(() => routineSubscriptionSchema.parse(base))
  assert.throws(() => routineSubscriptionSchema.parse({ ...base, days:[] }),/>=1 items|at least 1/i)
  assert.throws(() => routineSubscriptionSchema.parse({ ...base, pickupTime:'25:00' }),/must match pattern|Invalid/i)
  assert.throws(() => routineSubscriptionSchema.parse({ ...base, pickupTime:'6:30' }),/must match pattern|Invalid/i)
})

test('routine windows cannot end before they start', () => {
  assert.doesNotThrow(() => validateRoutineWindow('2026-09-14','2026-10-14'))
  assert.doesNotThrow(() => validateRoutineWindow('2026-09-14'))
  assert.throws(() => validateRoutineWindow('2026-09-14','2026-09-01'),/before the start date/i)
})

test('next routine date respects configured days and time', () => {
  const mondayMorning = new Date('2026-09-07T05:30:00')
  const next = nextRoutineDate(['MON','WED','FRI'],'06:00',mondayMorning)
  assert.equal(next!.getDay(),1)
  assert.equal(next!.getHours(),6)
  const sameEvening = nextRoutineDate(['MON'],'18:30',mondayMorning)
  assert.equal(sameEvening!.getDate(),7)
  assert.equal(nextRoutineDate(['TUE'],'06:00',mondayMorning)!.getDay(),2)
})

test('routine totals require a server-calculated route price', () => {
  const withoutRoute = routineTotals({ oneWayPrice:null, packagePrice:null, discountPercent:10, ridesPerRoundTrip:10 })
  assert.equal(withoutRoute.calculable,false)
  assert.match(withoutRoute.reason,/cannot yet be calculated/i)
})

test('routine totals compute one-way, round trip, package and savings', () => {
  const totals = routineTotals({ oneWayPrice:2000, packagePrice:null, discountPercent:10, ridesPerRoundTrip:10 })
  assert.equal(totals.calculable,true)
  if (totals.calculable) {
    assert.equal(totals.oneWayTotal,2000)
    assert.equal(totals.roundTripTotal,4000)
    assert.equal(totals.packageTotal,36000)
    assert.equal(totals.discount,4000)
    assert.equal(totals.savings,4000)
  }
})

test('membership discount percentages come from configuration, not invention', () => {
  assert.equal(membershipDiscountFor('FASTRIDES_ROYALE'),15)
  assert.equal(membershipDiscountFor('FASTRIDES_ACCESS'),0)
  assert.equal(membershipDiscountFor('UNKNOWN_PLAN'),0)
})

test('membership subscriptions honour grace periods and cancellation', () => {
  const active = { status:'ACTIVE', expiresAt:new Date(Date.now() + 86_400_000), gracePeriodDays:3 }
  const grace = { status:'GRACE', expiresAt:new Date(Date.now() - 86_400_000), gracePeriodDays:3 }
  const expired = { status:'ACTIVE', expiresAt:new Date(Date.now() - 5 * 86_400_000), gracePeriodDays:0 }
  const cancelled = { status:'CANCELLED', expiresAt:new Date(Date.now() + 86_400_000) }
  assert.equal(isActiveSubscription(active),true)
  assert.equal(isActiveSubscription(grace),true)
  assert.equal(isActiveSubscription(expired),false)
  assert.equal(isActiveSubscription(cancelled),false)
})

test('membership renewal dates follow the billing cycle', () => {
  const start = new Date('2026-09-11T00:00:00Z')
  assert.equal(nextRenewalDate(start,'MONTHLY').getUTCMonth(),9)
  assert.equal(nextRenewalDate(start,'ANNUAL').getUTCFullYear(),2027)
})

test('annual savings are only computed from configured prices', () => {
  assert.equal(savingsFromAnnual(1000,10800),1200)
  assert.equal(savingsFromAnnual(1000,null),null)
  assert.equal(savingsFromAnnual(null,10800),null)
})

test('shared rides require an active membership and eligible configuration', () => {
  assert.equal(isSharedEligible({ membershipPlanCode:null, subscriptionActive:false, vehicleClassSharedEligible:true, serviceAllowsShared:true, citySharedEnabled:true }).eligible,false)
  assert.equal(isSharedEligible({ membershipPlanCode:'FASTRIDES_ACCESS', subscriptionActive:false, vehicleClassSharedEligible:true, serviceAllowsShared:true, citySharedEnabled:true }).eligible,false)
  assert.equal(isSharedEligible({ membershipPlanCode:'FASTRIDES_ACCESS', subscriptionActive:true, vehicleClassSharedEligible:false, serviceAllowsShared:true, citySharedEnabled:true }).eligible,false)
  assert.equal(isSharedEligible({ membershipPlanCode:'FASTRIDES_ACCESS', subscriptionActive:true, vehicleClassSharedEligible:true, serviceAllowsShared:true, citySharedEnabled:false }).eligible,false)
  assert.equal(isSharedEligible({ membershipPlanCode:'FASTRIDES_ACCESS', subscriptionActive:true, vehicleClassSharedEligible:true, serviceAllowsShared:true, citySharedEnabled:true }).eligible,true)
})

test('shared ride capacity never exceeds four passengers', () => {
  assert.equal(MAX_SHARED_PASSENGERS,4)
  assert.equal(seatCapacityOk([{ seats:2 },{ seats:2 }],{ maxPassengers:4 } as never).ok,true)
  assert.equal(seatCapacityOk([{ seats:3 },{ seats:2 }],{ maxPassengers:4 } as never).ok,false)
  assert.equal(seatCapacityOk([{ seats:3 }],{ maxPassengers:4 } as never).remaining,1)
})

test('shared ride status flow rejects invalid transitions', () => {
  assert.equal(sharedRideStatusFlow('MATCHING','MATCHED'),true)
  assert.throws(() => sharedRideStatusFlow('MATCHING','COMPLETED'),/Invalid shared-ride transition/)
  assert.throws(() => sharedRideStatusFlow('COMPLETED','MATCHING'),/Invalid shared-ride transition/)
})