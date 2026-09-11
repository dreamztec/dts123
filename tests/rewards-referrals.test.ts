import assert from 'node:assert/strict'
import test from 'node:test'
import { qualifyReferral, generateReferralCode, detectReferralFraud, referralCodeSchema } from '../src/lib/referrals.ts'
import { applyTierMultiplier, evaluateEarnRule, redeemPoints, npsBucket, npsSummary, tripRatingSchema } from '../src/lib/rewards.ts'

test('referral rewards require the configured qualifying event', () => {
  const registered = new Date(Date.now() - 5 * 86_400_000)
  const pending = qualifyReferral({ referralStatus:'PENDING', referredUserRegisteredAt:registered, qualifyingEventCompleted:false, expiryDays:90 })
  assert.equal(pending.qualified,false)
  assert.match(pending.reason,/qualifying event/i)
  const qualified = qualifyReferral({ referralStatus:'PENDING', referredUserRegisteredAt:registered, qualifyingEventCompleted:true, expiryDays:90 })
  assert.equal(qualified.qualified,true)
})

test('referral rewards never double-issue and respect the expiry window', () => {
  const old = new Date(Date.now() - 120 * 86_400_000)
  assert.equal(qualifyReferral({ referralStatus:'REWARDED', referredUserRegisteredAt:old, qualifyingEventCompleted:true, expiryDays:90 }).qualified,false)
  assert.equal(qualifyReferral({ referralStatus:'PENDING', referredUserRegisteredAt:old, qualifyingEventCompleted:true, expiryDays:90 }).qualified,false)
  assert.match(qualifyReferral({ referralStatus:'FRAUD', referredUserRegisteredAt:old, qualifyingEventCompleted:true, expiryDays:90 }).reason,/closed/i)
})

test('referrals stay pending until the referred user registers', () => {
  const verdict = qualifyReferral({ referralStatus:'PENDING', referredUserRegisteredAt:null, qualifyingEventCompleted:true, expiryDays:90 })
  assert.equal(verdict.qualified,false)
  assert.match(verdict.reason,/not registered/i)
})

test('referral codes are generated from the safe alphabet', () => {
  const code = generateReferralCode()
  assert.equal(referralCodeSchema.safeParse(code).success,true)
  assert.ok(!['I','L','O'].some((char) => code.slice(3).includes(char)))
})

test('fraud detection flags self referrals and rapid signup pairs', () => {
  const userId = '11111111-1111-4111-8111-111111111111'
  const now = new Date()
  assert.ok(detectReferralFraud({ referrerUserId:userId, referredUserId:userId }).includes('self_referral'))
  assert.ok(detectReferralFraud({ referrerUserId:userId, referredUserId:'22222222-2222-4222-8222-222222222222', referrerCreatedAt:now, referredCreatedAt:new Date(now.getTime()+5_000) }).includes('rapid_signup_pair'))
  assert.deepEqual(detectReferralFraud({ referrerUserId:userId, referredUserId:'22222222-2222-4222-8222-222222222222', referrerCreatedAt:now, referredCreatedAt:new Date(now.getTime()+3_600_000) }),[])
})

test('reward earning rules stay dormant until admins configure points', () => {
  const rule = { ruleKey:'completed_trip', points:0, conditions:{}, tierMultipliers:{}, expiryDays:null }
  const verdict = evaluateEarnRule(rule,{ active:true })
  assert.equal(verdict.eligible,false)
  assert.match(verdict.reason ?? '',/not been configured/i)
})

test('tier multipliers and redemption math', () => {
  assert.equal(applyTierMultiplier(100,{ SIGNATURE:2 },'SIGNATURE'), 200)
  assert.equal(applyTierMultiplier(100,{},null), 100)
  const redeemed = redeemPoints(500,300)
  assert.equal(redeemed.allowed,true)
  assert.equal(redeemed.remaining,200)
  const rejected = redeemPoints(100,300)
  assert.equal(rejected.allowed,false)
  assert.equal(rejected.remaining,100)
  assert.throws(() => redeemPoints(500,0),/positive/i)
})

test('NPS bucketing and summary match the 0–10 methodology', () => {
  assert.equal(npsBucket(9),'PROMOTER')
  assert.equal(npsBucket(7),'PASSIVE')
  assert.equal(npsBucket(3),'DETRACTOR')
  assert.throws(() => npsBucket(11),/0–10/)
  const summary = npsSummary([{ npsScore:10 },{ npsScore:9 },{ npsScore:7 },{ npsScore:2 }])
  assert.equal(summary.promoters,2)
  assert.equal(summary.passives,1)
  assert.equal(summary.detractors,1)
  assert.equal(summary.nps,25)
  assert.equal(npsSummary([{ npsScore:null }]).nps,null)
})

test('trip ratings validate the 1–5 scale and NPS range', () => {
  assert.throws(() => tripRatingSchema.parse({ rating:6 }),/<=5|less than or equal|Too big/i)
  assert.throws(() => tripRatingSchema.parse({ rating:0 }),/>=1|greater than or equal|Too small/i)
  const parsed = tripRatingSchema.parse({ rating:5, npsScore:10, categories:{ driver:5, vehicle:4 } })
  assert.equal(parsed.categories.driver,5)
})