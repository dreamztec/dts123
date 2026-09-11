import { z } from 'zod'

export const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateReferralCode(seed=Date.now()) {
  let value = seed
  let code = ''
  for (let index=0; index<8; index++) { code += REFERRAL_CODE_ALPHABET[value % REFERRAL_CODE_ALPHABET.length]; value = Math.floor(value / REFERRAL_CODE_ALPHABET.length) + (index === 7 ? 7 : 0) }
  return `FR-${code}`
}

export const referralCodeSchema = z.string().regex(/^FR-[A-Z0-9]{4,12}$/)

export const referralQualifyingEvents = ['FIRST_COMPLETED_TRIP','FIRST_PAID_BOOKING'] as const
export type ReferralQualifyingEvent = typeof referralQualifyingEvents[number]

export function qualifyReferral(params:{ referralStatus:string; referredUserRegisteredAt:Date|null; qualifyingEventCompleted:boolean; expiryDays:number; now?:Date }) {
  const now = params.now ?? new Date()
  if (params.referralStatus === 'REWARDED' || params.referralStatus === 'COMPLETED') return { qualified:false, reason:'Referral has already been rewarded' }
  if (params.referralStatus === 'CANCELLED' || params.referralStatus === 'FRAUD') return { qualified:false, reason:'Referral is closed' }
  if (!params.referredUserRegisteredAt) return { qualified:false, reason:'Referred user has not registered yet' }
  const ageDays = (now.getTime() - params.referredUserRegisteredAt.getTime()) / 86_400_000
  if (ageDays > params.expiryDays) return { qualified:false, reason:'Referral window has expired' }
  if (!params.qualifyingEventCompleted) return { qualified:false, reason:'Referral reward waits for the configured qualifying event' }
  return { qualified:true, reason:'Qualifying event completed' }
}

export const fraudSignalsSchema = z.object({
  sameDeviceFingerprint:z.boolean().optional(),
  samePaymentMethod:z.boolean().optional(),
  sharedIpAddress:z.boolean().optional(),
  selfReferral:z.boolean().optional(),
  disposableEmail:z.boolean().optional(),
})

export function detectReferralFraud(input:{ referrerUserId:string; referredUserId?:string|null; referrerCreatedAt?:Date|null; referredCreatedAt?:Date|null; sameDevice?:boolean }) {
  const signals:string[] = []
  if (input.referredUserId && input.referredUserId === input.referrerUserId) signals.push('self_referral')
  if (input.sameDevice) signals.push('same_device_fingerprint')
  if (input.referrerCreatedAt && input.referredCreatedAt && Math.abs(input.referredCreatedAt.getTime()-input.referrerCreatedAt.getTime()) < 60_000) signals.push('rapid_signup_pair')
  return signals
}

export const referralStatuses = ['PENDING','QUALIFIED','REWARDED','CANCELLED','FRAUD'] as const
export type ReferralStatus = typeof referralStatuses[number]