import type { Config } from '@netlify/functions'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { bookings, driverAssignments, driverLevels, driverProfiles, trips, users, vehicles } from '../../db/schema.js'
import { appUserForIdentity, json, methodGuard, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'

const activeAssignmentStates = ['OFFERED', 'ACCEPTED']
const activeTripStates = ['DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'PASSENGER_ONBOARD', 'IN_PROGRESS'] as const

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
    const assignments = await db.select({ assignment:driverAssignments, bookingReference:bookings.reference, bookingStatus:bookings.status, bookingPickup:bookings.pickup, bookingDestination:bookings.destination, bookingScheduledAt:bookings.scheduledAt }).from(driverAssignments).leftJoin(bookings,eq(driverAssignments.bookingId,bookings.id)).where(eq(driverAssignments.driverId,driver.id)).orderBy(desc(driverAssignments.offeredAt)).limit(20)

    // The live assignment: an accepted offer, or an offered one, tied to an active trip.
    const liveAssignment = assignments.find((row) => activeAssignmentStates.includes(row.assignment.status))
    let currentTrip = null
    if (liveAssignment) {
      const [trip] = await db.select().from(trips).where(eq(trips.bookingId,liveAssignment.assignment.bookingId)).orderBy(desc(trips.startedAt)).limit(1)
      if (trip && (activeTripStates as readonly string[]).includes(trip.status)) {
        currentTrip = { id:trip.id, status:trip.status, startedAt:trip.startedAt, bookingReference:liveAssignment.bookingReference }
      }
    }

    // Recently completed trips driven by this chauffeur.
    const completedTrips = await db.select({ trip:trips, bookingReference:bookings.reference, bookingDestination:bookings.destination }).from(trips).leftJoin(bookings,eq(trips.bookingId,bookings.id)).where(and(eq(trips.driverId,driver.id),inArray(trips.status,['COMPLETED','CANCELLED','NO_SHOW']))).orderBy(desc(trips.completedAt)).limit(20)

    return json({
      driver,
      level:level ?? null,
      vehicle:vehicle[0] ?? null,
      assignments:assignments.map((row) => ({ ...row.assignment, bookingReference:row.bookingReference, bookingStatus:row.bookingStatus, pickup:row.bookingPickup, destination:row.bookingDestination, scheduledAt:row.bookingScheduledAt })),
      currentTrip,
      completedTrips:completedTrips.map((row) => ({ id:row.trip.id, status:row.trip.status, startedAt:row.trip.startedAt, completedAt:row.trip.completedAt, bookingReference:row.bookingReference, destination:row.bookingDestination })),
      user:{ fullName:appUser.fullName, email:appUser.email, phone:appUser.phone },
    })
  } catch (error) { return serverError('driver-me',error) }
}

export const config:Config = { path:'/api/driver/me' }