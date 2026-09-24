import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { referralConfig, referrals, users } from '../../db/schema.js'
import { appUserForIdentity, json, methodGuard, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { generateReferralCode } from '../../src/lib/referrals'

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    const [config] = await db.select().from(referralConfig).limit(1)
    let [referral] = await db.select().from(referrals).where(eq(referrals.referrerId, appUser.id)).orderBy(desc(referrals.createdAt)).limit(1)
    if (!referral) {
      // A code is reserved for every eligible customer; qualification rules stay admin-configured.
      const code = generateReferralCode()
      ;[referral] = await db.insert(referrals).values({ referrerId: appUser.id, code, status: 'PENDING' }).returning()
    }
    return json({
      code: referral.code,
      status: referral.status,
      expiresAt: referral.expiresAt,
      rewardData: referral.rewardData,
      program: config ?? null,
      note: config?.active ? 'Rewards are issued once the configured qualifying event completes.' : 'The referral programme is being finalised. Your code is reserved.',
    })
  } catch (error) { return serverError('referrals', error) }
}

export const config: Config = { path: '/api/referrals/me' }