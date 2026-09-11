import type { Config } from '@netlify/functions'
import { gte, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { bookings, corporateAccounts, customerProfiles, driverProfiles, feedback, incidents, notifications, vehicles } from '../../db/schema.js'
import { getAuth, json, methodGuard, serverError } from './_lib/api.mts'

export default async (request:Request) => {
  const guard = methodGuard(request,['GET'])
  if (guard) return guard
  const auth = await getAuth(request)
  if (!auth || !(auth.roles.includes('admin') || auth.roles.includes('super_admin'))) return json({ error:'Administrator role required' },403)
  try {
    const dayAgo = new Date(Date.now() - 86_400_000)
    const [customers] = await db.select({ count:sql<number>`count(*)::int` }).from(customerProfiles)
    const [drivers] = await db.select({ count:sql<number>`count(*)::int` }).from(driverProfiles)
    const [vehicleRows] = await db.select({ count:sql<number>`count(*)::int` }).from(vehicles)
    const [bookingRows] = await db.select({ total:sql<number>`count(*)::int`, active:sql<number>`count(*) filter (where status in ('CONFIRMED','SEARCHING_DRIVER','DRIVER_ASSIGNED','DRIVER_EN_ROUTE','DRIVER_ARRIVED','PASSENGER_ONBOARD','IN_PROGRESS'))::int` }).from(bookings)
    const [corporates] = await db.select({ count:sql<number>`count(*)::int` }).from(corporateAccounts)
    const [openIncidents] = await db.select({ count:sql<number>`count(*) filter (where status = 'OPEN')::int` }).from(incidents)
    const [unresolvedFeedback] = await db.select({ count:sql<number>`count(*) filter (where status = 'UNRESOLVED')::int` }).from(feedback)
    const [newNotifications] = await db.select({ count:sql<number>`count(*)::int` }).from(notifications).where(gte(notifications.createdAt,dayAgo))
    return json({
      metrics:{ customers:Number(customers.count), drivers:Number(drivers.count), vehicles:Number(vehicleRows.count), bookings:Number(bookingRows.total), activeBookings:Number(bookingRows.active), corporates:Number(corporates.count), openIncidents:Number(openIncidents.count), unresolvedFeedback:Number(unresolvedFeedback.count), notificationsLast24h:Number(newNotifications.count) },
      source:'database',
    })
  } catch (error) { return serverError('admin-overview',error,true) }
}

export const config:Config = { path:'/api/admin/overview' }