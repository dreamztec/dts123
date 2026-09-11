import assert from 'node:assert/strict'
import test from 'node:test'
import { levelProgress, meetsLevel, isQualifyingActiveStatus, computeEarningsRecord, activeHourGuaranteeEarnings, productivityBonus, weightedPerformanceScore, isLegitimateDecline, legitimateDeclineRate, driverRegistrationSchema } from '../src/lib/driver-career.ts'
import { DEFAULT_PERFORMANCE_WEIGHTS } from '../src/lib/domain.ts'

test('starter drivers stay at starter with no fabricated progress', () => {
  const progress = levelProgress({ completedTrips:0, rating:0, safetyScore:0 })
  assert.equal(progress.currentLevel,'STARTER')
  assert.equal(progress.nextLevel,'PROFESSIONAL')
  assert.ok(progress.nextProgress)
  assert.equal(progress.nextProgress!.missing.completedTrips!.required,50)
})

test('level calculation orders by trips, rating and safety score', () => {
  const progress = levelProgress({ completedTrips:260, rating:4.6, safetyScore:88 })
  assert.equal(progress.currentLevel,'EXECUTIVE')
  assert.equal(progress.nextLevel,'ELITE')
  const elite = levelProgress({ completedTrips:800, rating:4.8, safetyScore:95 })
  assert.equal(elite.currentLevel,'ELITE')
  assert.equal(elite.nextLevel,null)
  assert.equal(elite.nextProgress,null)
})

test('level requirements gate each tier', () => {
  assert.equal(meetsLevel({ completedTrips:49, rating:4.3, safetyScore:80 }, { completedTrips:50, rating:4.2, safetyScore:75 }),false)
  assert.equal(meetsLevel({ completedTrips:50, rating:4.2, safetyScore:75 }, { completedTrips:50, rating:4.2, safetyScore:75 }),true)
})

test('only operational availability counts toward the active-hour guarantee', () => {
  assert.equal(isQualifyingActiveStatus('available'),true)
  assert.equal(isQualifyingActiveStatus('on_trip'),true)
  assert.equal(isQualifyingActiveStatus('offline'),false)
  assert.equal(isQualifyingActiveStatus('paused'),false)
  assert.equal(isQualifyingActiveStatus('unavailable'),false)
})

test('earnings computation totals gross and net without inventing values', () => {
  const totals = computeEarningsRecord({ tripEarnings:12000, activeHourEarnings:3000, productivityBonus:1000, performanceBonus:0, qualityBonus:500, specialAssignmentBonus:0 }, 1500)
  assert.equal(totals.gross,16500)
  assert.equal(totals.net,15000)
  const empty = computeEarningsRecord({ tripEarnings:0, activeHourEarnings:0, productivityBonus:0, performanceBonus:0, qualityBonus:0, specialAssignmentBonus:0 }, 0)
  assert.deepEqual(empty,{ gross:0, net:0 })
})

test('active-hour guarantee only pays qualifying minutes up to the cap', () => {
  assert.equal(activeHourGuaranteeEarnings(300,500,8), 2500)
  assert.equal(activeHourGuaranteeEarnings(900,500,8), 4000)
  assert.equal(activeHourGuaranteeEarnings(300,0,8), 0)
  assert.equal(activeHourGuaranteeEarnings(0,500,8), 0)
})

test('productivity bonus applies only beyond the threshold', () => {
  assert.equal(productivityBonus(10,200,12), 0)
  assert.equal(productivityBonus(15,200,12), 600)
})

test('performance weighting honours configured weights', () => {
  const components = { punctuality:90, acceptanceCompletion:80, ratingScore:70, safety:100, utilisation:50, vehicleCare:60, complaints:100 }
  assert.equal(weightedPerformanceScore(components,DEFAULT_PERFORMANCE_WEIGHTS),80)
  assert.equal(weightedPerformanceScore(components,{ ...DEFAULT_PERFORMANCE_WEIGHTS, safety:0 }), 75)
})

test('decline reasons distinguish legitimate from reviewed declines', () => {
  assert.equal(isLegitimateDecline('VEHICLE_ISSUE'),true)
  assert.equal(isLegitimateDecline('REST_PERIOD'),true)
  assert.equal(isLegitimateDecline('OTHER'),false)
  assert.equal(isLegitimateDecline('MADE_UP_REASON'),false)
})

test('legitimate decline rate counts accepted plus legitimate declines', () => {
  assert.equal(legitimateDeclineRate(10,7,2),90)
  assert.equal(legitimateDeclineRate(0,0,0),0)
})

test('driver registration validates licence and vehicle details', () => {
  const schema = driverRegistrationSchema()
  const valid = {
    fullName:'Musa Bello', phone:'08031234567', email:'driver@example.com',
    licenceNumber:'ABC12345', licenceExpiry:'2027-01-31', yearsExperience:4,
    vehicle:{ make:'Toyota', model:'Camry', year:2022, plateNumber:'ABU123XY', fuelType:'PETROL' as const },
    questionnaireSelectedOption:'UNPREDICTABLE_INCOME',
  }
  assert.doesNotThrow(() => schema.parse(valid))
  assert.throws(() => schema.parse({ ...valid, licenceExpiry:'31-01-2027' }),/regex/i)
  assert.throws(() => schema.parse({ ...valid, questionnaireSelectedOption:'' }),/at least 2|too small/i)
})