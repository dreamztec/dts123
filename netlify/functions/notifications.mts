import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { notificationIntents, notifications } from '../../db/schema.js'
import { appUserForIdentity, json, methodGuard, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'

export default async (request:Request) => {
  const guard = methodGuard(request,['GET'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    const inApp = await db.select().from(notifications).where(eq(notifications.userId,appUser.id)).orderBy(desc(notifications.createdAt)).limit(50)
    const intents = await db.select({ id:notificationIntents.id, channel:notificationIntents.channel, templateKey:notificationIntents.templateKey, subject:notificationIntents.subject, status:notificationIntents.status, createdAt:notificationIntents.createdAt }).from(notificationIntents).where(eq(notificationIntents.userId,appUser.id)).orderBy(desc(notificationIntents.createdAt)).limit(50)
    return json({ notifications:inApp, deliveryIntents:intents, note:'In-app notifications are delivered directly. SMS, email, WhatsApp and push delivery starts once those providers are connected.' })
  } catch (error) { return serverError('notifications',error) }
}

export const config:Config = { path:'/api/notifications' }