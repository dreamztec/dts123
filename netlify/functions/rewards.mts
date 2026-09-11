import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { rewardAccounts, rewardTransactions } from '../../db/schema.js'
import { appUserForIdentity, json, methodGuard, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'

export default async (request:Request) => {
  const guard = methodGuard(request,['GET'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    let [account] = await db.select().from(rewardAccounts).where(eq(rewardAccounts.userId,appUser.id)).limit(1)
    if (!account) [account] = await db.insert(rewardAccounts).values({ userId:appUser.id, pointsBalance:0 }).returning()
    const transactions = await db.select().from(rewardTransactions).where(eq(rewardTransactions.rewardAccountId,account.id)).orderBy(desc(rewardTransactions.createdAt)).limit(50)
    return json({ account:{ pointsBalance:account.pointsBalance }, transactions, note:'Points are earned through admin-configured rules once those rules are enabled.' })
  } catch (error) { return serverError('rewards',error) }
}

export const config:Config = { path:'/api/rewards' }