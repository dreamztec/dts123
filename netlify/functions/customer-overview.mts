import type { Config } from '@netlify/functions'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { bookings, membershipPlans, subscriptions } from '../../db/schema.js'
import { appUserForIdentity, json, methodGuard, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { isActiveSubscription } from '../../src/lib/membership'

const upcomingStates = ['DRAFT','PENDING_PAYMENT','CONFIRMED','SEARCHING_DRIVER','DRIVER_ASSIGNED'] as const

export default async (request:Request) => {
  const guard = methodGuard(request,['GET'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    const [active] = await db.select({ subscription:subscriptions, plan:membershipPlans }).from(subscriptions).innerJoin(membershipPlans,eq(subscriptions.planId,membershipPlans.id)).where(eq(subscriptions.userId,appUser.id)).orderBy(asc(subscriptions.createdAt)).limit(20)
    const activeRow = active && isActiveSubscription({ status:active.subscription.status, expiresAt:active.subscription.expiresAt }) ? { planName:active.plan.name } : null
    const upcoming = await db.select({ id:bookings.id, reference:bookings.reference, status:bookings.status, pickup:bookings.pickup, destination:bookings.destination }).from(bookings).where(and(eq(bookings.bookerId,appUser.id),inArray(bookings.status,[...upcomingStates]))).orderBy(asc(bookings.scheduledAt)).limit(5)
    return json({ active:activeRow ?? null, upcoming })
  } catch (error) { return serverError('customer-overview',error) }
}

export const config:Config = { path:'/api/customer/overview' }