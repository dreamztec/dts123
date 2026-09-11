import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { bookings, driverAssignments, driverLevels, driverProfiles, users, vehicles } from '../../db/schema.js'
import { appUserForIdentity, json, methodGuard, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'

export default async (request:Request) => {
  const guard = methodGuard(request,['GET'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    const [driver] = await db.select().from(driverProfiles).where(eq(driverProfiles.userId,appUser.id)).limit(1)
    if (!driver) return json({ driver:null, message:'No chauffeur profile exists for this account yet. Registration and verification appear here once operations onboard you.' })
    const [level] = await db.select().from(driverLevels).where(eq(driverLevels.code,driver.driverLevelCode)).limit(1)
    const [vehicle] = driver.currentVehicleId ? await db.select().from(vehicles).where(eq(vehicles.id,driver.currentVehicleId)).limit(1) : []
    const assignments = await db.select({ assignment:driverAssignments, bookingReference:bookings.reference }).from(driverAssignments).leftJoin(bookings,eq(driverAssignments.bookingId,bookings.id)).where(eq(driverAssignments.driverId,driver.id)).orderBy(desc(driverAssignments.offeredAt)).limit(20)
    return json({
      driver,
      level:level ?? null,
      vehicle:vehicle[0] ?? null,
      assignments:assignments.map((row) => ({ ...row.assignment, bookingReference:row.bookingReference })),
      user:{ fullName:appUser.fullName, email:appUser.email, phone:appUser.phone },
    })
  } catch (error) { return serverError('driver-me',error) }
}

export const config:Config = { path:'/api/driver/me' }