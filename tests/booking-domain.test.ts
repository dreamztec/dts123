import assert from 'node:assert/strict'
import test from 'node:test'
import { generateBookingReference, validateBookingForSomeoneElse, membershipDiscountAmount, canCancelBooking, assertBookingTransition, bookingDraftSchema } from '../src/lib/booking-domain.ts'

const base = {
  cityId:'11111111-1111-4111-8111-111111111111',
  vehicleClassId:'22222222-2222-4222-8222-222222222222',
  serviceType:'FAST_RIDE',
  tripType:'IMMEDIATE' as const,
  pickup:{ label:'Wuse 2', address:'Wuse 2, Abuja' },
  destination:{ label:'Maitama', address:'Maitama, Abuja' },
  passengerCount:1,
  relationship:'SELF' as const,
}

test('booking for someone else requires passenger name and phone', () => {
  assert.throws(() => validateBookingForSomeoneElse({ ...base, relationship:'FRIEND' }), /Passenger name and phone/i)
  assert.throws(() => validateBookingForSomeoneElse({ ...base, relationship:'EMPLOYEE', passengerName:'Tunde' }), /Passenger name and phone/i)
  assert.doesNotThrow(() => validateBookingForSomeoneElse({ ...base, relationship:'CLIENT', passengerName:'Tunde Balogun', passengerPhone:'08031234567' }))
})

test('scheduled trip types require a future scheduled time', () => {
  const past = new Date(Date.now() - 3_600_000)
  assert.throws(() => validateBookingForSomeoneElse({ ...base, tripType:'AIRPORT', scheduledAt:past, passengerName:'A', passengerPhone:'08031234567' }), /future/i)
  assert.throws(() => validateBookingForSomeoneElse({ ...base, tripType:'SCHEDULED', scheduledAt:undefined, relationship:'FAMILY', passengerName:'A B', passengerPhone:'08031234567' }), /scheduled time is required/i)
  assert.doesNotThrow(() => validateBookingForSomeoneElse({ ...base, tripType:'IMMEDIATE' }))
})

test('pickup and destination must differ', () => {
  assert.throws(() => validateBookingForSomeoneElse({ ...base, destination:{ label:'Wuse 2', address:'Wuse 2, Abuja' } }), /must be different/i)
})

test('membership discount is capped and rounded', () => {
  assert.equal(membershipDiscountAmount(10000,15), 1500)
  assert.equal(membershipDiscountAmount(10000,0), 0)
  assert.equal(membershipDiscountAmount(10000,null), 0)
  assert.equal(membershipDiscountAmount(10000,80), 5000)
})

test('cancellation is blocked once the chauffeur is en route', () => {
  const scheduled = new Date(Date.now() + 3 * 3_600_000)
  assert.equal(canCancelBooking('DRIVER_EN_ROUTE',scheduled).allowed,false)
  assert.equal(canCancelBooking('IN_PROGRESS',scheduled).allowed,false)
  const verdict = canCancelBooking('DRIVER_ASSIGNED',scheduled)
  assert.equal(verdict.allowed,true)
  assert.equal(verdict.late,false)
})

test('cancellation inside the free window is marked late', () => {
  const soon = new Date(Date.now() + 30 * 60_000)
  const verdict = canCancelBooking('CONFIRMED',soon)
  assert.equal(verdict.allowed,true)
  assert.equal(verdict.late,true)
})

test('closed bookings cannot be cancelled again', () => {
  assert.equal(canCancelBooking('COMPLETED',null).allowed,false)
  assert.equal(canCancelBooking('CANCELLED',null).allowed,false)
})

test('booking transitions are validated server-side', () => {
  assert.equal(assertBookingTransition('DRAFT','PENDING_PAYMENT'),true)
  assert.throws(() => assertBookingTransition('DRAFT','COMPLETED'),/Invalid booking transition/)
  assert.throws(() => assertBookingTransition('UNKNOWN','COMPLETED'),/Unknown booking status/)
})

test('booking draft schema enforces passenger count bounds', () => {
  assert.throws(() => bookingDraftSchema.parse({ ...base, passengerCount:0 }), />=1|at least 1/i)
  assert.throws(() => bookingDraftSchema.parse({ ...base, cityId:'not-a-uuid' }), /uuid/i)
  const parsed = bookingDraftSchema.parse({ ...base, passengerCount:undefined })
  assert.equal(parsed.passengerCount,1)
})

test('booking references use the FASTRIDES prefix and are unique-ish', () => {
  const reference = generateBookingReference()
  assert.ok(reference.startsWith('FR-'))
  assert.notEqual(reference, generateBookingReference())
})