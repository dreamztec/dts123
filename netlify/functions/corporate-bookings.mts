import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { bookings, users } from '../../db/schema.js'
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
    if (!membership) return json({ bookings: [], message: 'Your account is not linked to a corporate mobility account.' })
    const rows = await db.select({ booking:bookings, bookerName:users.fullName }).from(bookings).leftJoin(users, eq(bookings.bookerId, users.id)).where(eq(bookings.corporateAccountId, membership.account.id)).orderBy(desc(bookings.createdAt)).limit(50)
    return json({ bookings: rows.map((row) => ({ ...row.booking, bookerName: row.bookerName })) })
  } catch (error) { return serverError('corporate-bookings', error) }
}

export const config: Config = { path: '/api/corporate/bookings' }