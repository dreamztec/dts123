import type { Config } from '@netlify/functions'
import { getUser } from '@netlify/identity'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { driverProfiles, trips, tripLocations, users } from '../../db/schema.js'

const locationSchema = z.object({ tripId:z.string().uuid(), vehicleId:z.string().uuid(), latitude:z.number().min(-90).max(90), longitude:z.number().min(-180).max(180), accuracyMeters:z.number().positive().optional(), recordedAt:z.coerce.date().optional() })
const authorisedStates = new Set(['DRIVER_EN_ROUTE','DRIVER_ARRIVED','PASSENGER_ONBOARD','IN_PROGRESS'])
export default async (request:Request) => {
  if (request.method !== 'POST') return Response.json({error:'Method not allowed'},{status:405})
  const identity = await getUser()
  if (!identity || !identity.roles?.includes('driver')) return Response.json({error:'Driver role required'},{status:403})
  try {
    const input = locationSchema.parse(await request.json())
    const [applicationUser] = await db.select().from(users).where(eq(users.identityId,String(identity.id))).limit(1)
    if (!applicationUser) return Response.json({error:'Application user not found'},{status:403})
    const [driver] = await db.select().from(driverProfiles).where(eq(driverProfiles.userId,applicationUser.id)).limit(1)
    if (!driver) return Response.json({error:'Chauffeur profile not found'},{status:403})
    const [trip] = await db.select().from(trips).where(eq(trips.id,input.tripId)).limit(1)
    if (!trip || trip.driverId !== driver.id || trip.vehicleId !== input.vehicleId) return Response.json({error:'Trip assignment does not match'},{status:403})
    if (!authorisedStates.has(trip.status)) return Response.json({error:'Location collection is not authorised for this trip state'},{status:409})
    await db.insert(tripLocations).values({ ...input, driverId:driver.id, recordedAt:input.recordedAt ?? new Date(), accuracyMeters:input.accuracyMeters?.toString(), latitude:input.latitude.toString(), longitude:input.longitude.toString() })
    return Response.json({stored:true},{status:201})
  } catch (error) { return Response.json({error:error instanceof Error ? error.message : 'Invalid location update'},{status:400}) }
}
export const config:Config = { path:'/api/trips/location' }
