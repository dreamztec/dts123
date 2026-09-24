import type { Config } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { corporateMembers, departments, users } from '../../db/schema.js'
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
    if (!membership) return json({ members: [], message: 'Your account is not linked to a corporate mobility account.' })
    const rows = await db.select({ member:corporateMembers, fullName:users.fullName, email:users.email, departmentName:departments.name }).from(corporateMembers).leftJoin(users, eq(corporateMembers.userId, users.id)).leftJoin(departments, eq(corporateMembers.departmentId, departments.id)).where(eq(corporateMembers.corporateAccountId, membership.account.id)).limit(200)
    return json({ account: { name: membership.account.name, status: membership.account.status }, members: rows.map((row) => ({ ...row.member, fullName:row.fullName, email:row.email, department:row.departmentName })) })
  } catch (error) { return serverError('corporate-members', error) }
}

export const config: Config = { path: '/api/corporate/members' }