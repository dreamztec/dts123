import type { Config } from '@netlify/functions'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { corporateAccounts, corporateMembers } from '../../db/schema.js'
import { json, methodGuard, requireRoles, serverError } from './_lib/api.mts'

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET'])
  if (guard) return guard
  const auth = await requireRoles(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  try {
    const rows = await db.select({
      account:corporateAccounts,
      members:sql<number>`count(${corporateMembers.id})::int`,
    }).from(corporateAccounts).leftJoin(corporateMembers, eq(corporateMembers.corporateAccountId, corporateAccounts.id)).groupBy(corporateAccounts.id).orderBy(desc(corporateAccounts.createdAt)).limit(200)
    return json({ accounts: rows.map((row) => ({ ...row.account, members:Number(row.members) })) })
  } catch (error) { return serverError('admin-corporates', error) }
}

export const config: Config = { path: '/api/admin/corporates' }