import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { emergencyContacts, sosAlerts } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, json, methodGuard, notFound, readJson, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'

const sosSchema = z.object({
  bookingId:z.string().uuid().optional(),
  tripId:z.string().uuid().optional(),
  emergencyContactId:z.string().uuid().optional(),
  details:z.string().min(3).max(1000).optional(),
  coordinates:z.object({ latitude:z.number().min(-90).max(90), longitude:z.number().min(-180).max(180), accuracyMeters:z.number().positive().optional() }).nullable().optional(),
})

export default async (request:Request) => {
  const guard = methodGuard(request,['GET','POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    if (request.method === 'GET') {
      const alerts = await db.select().from(sosAlerts).where(eq(sosAlerts.userId,appUser.id)).orderBy(desc(sosAlerts.createdAt)).limit(50)
      const contacts = await db.select().from(emergencyContacts).where(eq(emergencyContacts.userId,appUser.id))
      return json({ alerts, emergencyContacts:contacts })
    }
    const parsed = await readJson(request,sosSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const input = parsed.ok.data
    const [primaryContact] = await db.select().from(emergencyContacts).where(eq(emergencyContacts.userId,appUser.id)).orderBy(desc(emergencyContacts.primary)).limit(1)
    const locationAvailable = Boolean(input.coordinates)
    const [alert] = await db.insert(sosAlerts).values({
      userId:appUser.id, bookingId:input.bookingId ?? null, tripId:input.tripId ?? null,
      emergencyContactId:primaryContact?.id ?? null,
      coordinates:input.coordinates ?? null, locationAvailable,
      details:input.details ?? null, status:'RAISED',
    }).returning()
    await audit({ actorId:appUser.id, action:'sos.raised', targetType:'sos_alert', targetId:alert.id, after:{ status:'RAISED', locationAvailable }, request })
    return json({
      alert,
      message:locationAvailable ? 'SOS recorded. Emergency response workflow engaged.' : 'SOS recorded. Live location is unavailable — your emergency contact and support team have been notified in-app.',
    },{ status:201 })
  } catch (error) { return serverError('sos',error) }
}

export const config:Config = { path:'/api/sos' }