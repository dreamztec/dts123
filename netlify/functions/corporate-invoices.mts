import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { invoices } from '../../db/schema.js'
import { appUserForIdentity, corporateMembershipForUser, json, methodGuard, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    const membership = await corporateMembershipForUser(appUser.id)
    if (!membership) return json({ invoices: [], message: 'Your account is not linked to a corporate mobility account.' })
    const rows = await db.select().from(invoices).where(eq(invoices.corporateAccountId, membership.account.id)).orderBy(desc(invoices.periodStart)).limit(50)
    return json({ invoices: rows })
  } catch (error) { return serverError('corporate-invoices', error) }
}

export const config: Config = { path: '/api/corporate/invoices' }