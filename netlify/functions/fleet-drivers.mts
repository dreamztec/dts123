import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { driverProfiles, users } from '../../db/schema.js'
import { json, methodGuard, requireRoles, serverError } from './_lib/api.mts'

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET'])
  if (guard) return guard
  const auth = await requireRoles(request, ['admin', 'super_admin', 'fleet_manager'])
  if ('error' in auth) return auth.error
  try {
    const rows = await db.select({ driver:driverProfiles, fullName:users.fullName, email:users.email }).from(driverProfiles).leftJoin(users, eq(driverProfiles.userId, users.id)).orderBy(desc(driverProfiles.completedTrips)).limit(200)
    return json({ drivers: rows.map((row) => ({ ...row.driver, fullName:row.fullName, email:row.email })) })
  } catch (error) { return serverError('fleet-drivers', error) }
}

export const config: Config = { path: '/api/fleet/drivers' }