import { db } from '../../../db/index.js'
import { notificationIntents, notifications } from '../../../db/schema.js'
import { eq } from 'drizzle-orm'

type NotificationInput = { userId?:string|null; channel:'IN_APP'|'SMS'|'EMAIL'|'WHATSAPP'|'PUSH'; templateKey:string; subject?:string; payload?:Record<string,unknown>; recipient?:string|null; bookingId?:string|null }

export async function recordNotification(input:NotificationInput) {
  const [inApp] = input.channel === 'IN_APP' && input.userId ? await db.insert(notifications).values({ userId:input.userId, channel:'IN_APP', templateKey:input.templateKey, subject:input.subject ?? null, content:input.payload ?? {} }).returning() : []
  const [intent] = await db.insert(notificationIntents).values({ userId:input.userId ?? null, channel:input.channel, templateKey:input.templateKey, subject:input.subject ?? null, payload:input.payload ?? {}, recipient:input.recipient ?? null, bookingId:input.bookingId ?? null, status: input.channel === 'IN_APP' ? 'DELIVERED' : 'INTENT_RECORDED' }).returning()
  return { inApp:inApp ?? null, intent:intent_shape(intent) }
}

function intent_shape(intent:typeof notificationIntents.$inferSelect) { return intent }

export async function markNotificationDelivered(intentId:string, provider:string, providerMessageId:string) {
  await db.update(notificationIntents).set({ status:'DELIVERED', provider, providerMessageId, deliveredAt:new Date(), updatedAt:new Date() }).where(eqId(intentId))
}

function eqId(id:string) { return eq(notificationIntents.id,id) }

export function template(key:string, variables:Record<string,string>) {
  const templates: Record<string, { subject:string; body:string }> = {
    'booking.confirmed': { subject:'Your FASTRIDES booking is confirmed', body:`Booking ${variables.reference} is confirmed for ${variables.when}.` },
    'booking.cancelled': { subject:'Your FASTRIDES booking was cancelled', body:`Booking ${variables.reference} was cancelled.` },
    'driver.assigned': { subject:'Your chauffeur is assigned', body:`${variables.driverName} will arrive in ${variables.vehicle}.` },
    'membership.requested': { subject:'Membership request received', body:`Your ${variables.plan} membership request is pending configuration.` },
    'sos.raised': { subject:'SOS alert raised', body:'An SOS alert was raised. Response workflow engaged.' },
    'account.updated': { subject:'Your account was updated', body:'Your profile details were updated.' },
  }
  const found = templates[key] ?? { subject:key, body:'' }
  return { subject:found.subject, body:found.body }
}