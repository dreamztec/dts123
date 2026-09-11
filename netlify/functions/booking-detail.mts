import type { Config } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { bookingEvents, bookingPassengers, bookings, cities, vehicleClasses } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, forbidden, json, methodGuard, notFound, readJson, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { assertBookingTransition, canCancelBooking } from '../../src/lib/booking-domain'
import { recordNotification } from './_lib/notify.mts'

const transitionSchema = z.object({ action:z.enum(['submit','cancel']), reason:z.string().max(300).optional() })

export default async (request:Request) => {
  const guard = methodGuard(request,['GET','POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    const reference = new URL(request.url).pathname.split('/').filter(Boolean).pop() ?? ''
    if (!reference.startsWith('FR-') || reference.length < 8) return badRequest('Invalid booking reference')
    const [booking] = await db.select().from(bookings).where(eq(bookings.reference,reference)).limit(1)
    if (!booking) return notFound('Booking not found')
    const isOwner = booking.bookerId === appUser.id
    const isAdmin = auth.auth.roles.includes('admin') || auth.auth.roles.includes('super_admin')
    if (!isOwner && !isAdmin) return forbidden()

    if (request.method === 'GET') {
      const [city] = await db.select().from(cities).where(eq(cities.id,booking.cityId)).limit(1)
      const [vehicleClass] = booking.vehicleClassId ? await db.select().from(vehicleClasses).where(eq(vehicleClasses.id,booking.vehicleClassId)).limit(1) : []
      const passengers = await db.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId,booking.id))
      const events = await db.select().from(bookingEvents).where(eq(bookingEvents.bookingId,booking.id)).orderBy(bookingEvents.createdAt)
      return json({ booking, cityName:city?.name ?? null, vehicleClassName:vehicleClass?.name ?? null, passengers, events })
    }

    const parsed = await readJson(request,transitionSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const { action, reason } = parsed.ok.data

    if (action === 'submit') {
      const next = 'PENDING_PAYMENT' as const
      if (booking.status !== 'DRAFT') return badRequest(`Only draft bookings can be submitted (current status: ${booking.status})`)
      assertBookingTransition(booking.status,next)
      await db.update(bookings).set({ status:next, updatedAt:new Date() }).where(eq(bookings.id,booking.id))
      await db.insert(bookingEvents).values({ bookingId:booking.id, fromStatus:booking.status, toStatus:next, actorId:appUser.id, note:'Submitted by customer' })
      await audit({ actorId:appUser.id, action:'booking.submit', targetType:'booking', targetId:booking.id, before:{ status:booking.status }, after:{ status:next }, request })
      return json({ status:next })
    }

    const verdict = canCancelBooking(booking.status,booking.scheduledAt)
    if (!verdict.allowed) return badRequest(verdict.reason)
    await db.update(bookings).set({ status:'CANCELLED' as const, cancellationReason:reason ?? 'Customer requested cancellation', cancelledAt:new Date(), updatedAt:new Date() }).where(eq(bookings.id,booking.id))
    await db.insert(bookingEvents).values({ bookingId:booking.id, fromStatus:booking.status, toStatus:'CANCELLED', actorId:appUser.id, note:verdict.late ? 'Cancelled within the late window' : 'Cancelled' })
    await audit({ actorId:appUser.id, action:'booking.cancel', targetType:'booking', targetId:booking.id, before:{ status:booking.status }, after:{ status:'CANCELLED' }, request })
    await recordNotification({ userId:appUser.id, channel:'IN_APP', templateKey:'booking.cancelled', subject:'Booking cancelled', payload:{ reference:booking.reference } })
    return json({ status:'CANCELLED', late:verdict.late })
  } catch (error) { return serverError('booking-detail',error) }
}

export const config:Config = { path:'/api/bookings/:reference' }