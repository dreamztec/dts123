import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { driverEarningsRecords, driverPerformanceRecords, driverProfiles } from '../../db/schema.js'
import { appUserForIdentity, json, methodGuard, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    const [driver] = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, appUser.id)).limit(1)
    if (!driver) return json({ driver: null, message: 'No chauffeur profile exists for this account yet.' })
    const earnings = await db.select().from(driverEarningsRecords).where(eq(driverEarningsRecords.driverId, driver.id)).orderBy(desc(driverEarningsRecords.periodStart)).limit(12)
    const performance = await db.select().from(driverPerformanceRecords).where(eq(driverPerformanceRecords.driverId, driver.id)).orderBy(desc(driverPerformanceRecords.periodStart)).limit(6)
    return json({
      driver: { completedTrips: driver.completedTrips, rating: driver.rating, acceptanceRate: driver.acceptanceRate, completionRate: driver.completionRate, safetyScore: driver.safetyScore },
      earnings,
      performance,
      note: earnings.length ? null : 'Earnings periods appear here once payroll operations record them. No figures are estimated.',
    })
  } catch (error) { return serverError('driver-earnings', error) }
}

export const config: Config = { path: '/api/driver/earnings' }