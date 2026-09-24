import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { driverAvailability, driverProfiles } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, json, methodGuard, readJson, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { availabilityStatusSchema } from '../../src/lib/driver-career'

const statusSchema = z.object({ status: availabilityStatusSchema })

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET', 'POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    const [driver] = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, appUser.id)).limit(1)
    if (!driver) return json({ driver: null, message: 'No chauffeur profile exists for this account yet.' })

    if (request.method === 'GET') {
      const history = await db.select().from(driverAvailability).where(eq(driverAvailability.driverId, driver.id)).orderBy(desc(driverAvailability.startedAt)).limit(30)
      return json({ status: driver.availabilityStatus, history })
    }

    const parsed = await readJson(request, statusSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const nextStatus = parsed.ok.data.status

    // Close any open availability window, then open a new one.
    const open = await db.select().from(driverAvailability).where(eq(driverAvailability.driverId, driver.id)).orderBy(desc(driverAvailability.startedAt)).limit(1)
    const latest = open[0]
    if (latest && !latest.endedAt) {
      await db.update(driverAvailability).set({ endedAt: new Date(), status: nextStatusForRecord(driver.availabilityStatus) }).where(eq(driverAvailability.id, latest.id))
    }
    if (nextStatus !== 'offline') {
      await db.insert(driverAvailability).values({ driverId: driver.id, status: nextStatus, startedAt: new Date() })
    }
    await db.update(driverProfiles).set({ availabilityStatus: nextStatus, updatedAt: new Date() }).where(eq(driverProfiles.id, driver.id))
    await audit({ actorId: appUser.id, action: 'driver.availability.set', targetType: 'driver_profile', targetId: driver.id, before: { status: driver.availabilityStatus }, after: { status: nextStatus }, request })
    return json({ status: nextStatus, message: nextStatus === 'available' ? 'You are available for assignment.' : 'You are offline.' })
  } catch (error) { return serverError('driver-availability', error) }
}

function nextStatusForRecord(previous: string) {
  return previous === 'available' ? 'available' : 'offline'
}

export const config: Config = { path: '/api/driver/availability' }