import type { Config } from '@netlify/functions'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { routinePackages, routineRides, routineSubscriptions, vehicleClasses } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, json, methodGuard, readJson, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { routineSubscriptionSchema, validateRoutineWindow, nextRoutineDate } from '../../src/lib/routine'

export default async (request:Request) => {
  const guard = methodGuard(request,['GET','POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    if (request.method === 'GET') {
      const rows = await db.select({ subscription:routineSubscriptions, package:routinePackages, className:vehicleClasses.name }).from(routineSubscriptions).leftJoin(routinePackages,eq(routineSubscriptions.packageId,routinePackages.id)).leftJoin(vehicleClasses,eq(routineSubscriptions.vehicleClassId,vehicleClasses.id)).where(eq(routineSubscriptions.userId,appUser.id)).orderBy(desc(routineSubscriptions.createdAt)).limit(50)
      const rides = rows.length ? await db.select().from(routineRides).where(eq(routineRides.routineSubscriptionId,rows[0].subscription.id)).orderBy(routineRides.scheduledFor).limit(20) : []
      return json({ subscriptions:rows.map((row) => ({ ...row.subscription, packageName:row.package?.name ?? null, vehicleClassName:row.className ?? null })), upcomingRides:rides })
    }
    const parsed = await readJson(request,routineSubscriptionSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const input = parsed.ok.data
    try { validateRoutineWindow(input.startDate,input.endDate) } catch (error) { return badRequest(error instanceof Error ? error.message : 'Invalid routine window') }
    let packageId:string|null = null
    if (input.packageCode) {
      const [routinePackage] = await db.select().from(routinePackages).where(and(eq(routinePackages.code,input.packageCode),eq(routinePackages.active,true))).limit(1)
      if (!routinePackage) return badRequest('Routine package is not available')
      packageId = routinePackage.id
    }
    const [vehicleClass] = await db.select().from(vehicleClasses).where(eq(vehicleClasses.code,input.vehicleClassCode)).limit(1)
    const nextRun = nextRoutineDate(input.days,input.pickupTime,new Date(`${input.startDate}T00:00:00`))
    const [subscription] = await db.insert(routineSubscriptions).values({
      userId:appUser.id, packageId, origin:input.origin, destination:input.destination,
      days:input.days, pickupTime:input.pickupTime, returnTime:input.returnTime ?? null,
      passengers:input.passengers, vehicleClassId:vehicleClass?.id ?? null, serviceType:input.serviceType,
      startDate:input.startDate, endDate:input.endDate ?? null, status:'ACTIVE',
      nextRunAt:nextRun, routeEstimate:{ calculable:false, reason:'Route price cannot yet be calculated — routing configuration is required for this origin and destination.' },
    }).returning()
    await audit({ actorId:appUser.id, action:'routine.create', targetType:'routine_subscription', targetId:subscription.id, after:{ days:input.days, pickupTime:input.pickupTime }, request })
    return json({
      subscription,
      message:'Routine recorded. Ride pricing is calculated server-side once route measurement is available for this journey.',
    },{ status:201 })
  } catch (error) { return serverError('routine',error) }
}

export const config:Config = { path:'/api/routine' }