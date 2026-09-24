import type { Config } from '@netlify/functions'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { bookings, users } from '../../db/schema.js'
import { json, methodGuard, requireRoles, serverError } from './_lib/api.mts'

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET'])
  if (guard) return guard
  const auth = await requireRoles(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  try {
    const rows = await db.select({
      user:users,
      completedBookings:sql<number>`count(${bookings.id}) filter (where ${bookings.status} = 'COMPLETED')::int`,
    }).from(users).leftJoin(bookings, eq(bookings.bookerId, users.id)).orderBy(desc(users.createdAt)).limit(200)
    return json({ customers: rows.map((row) => ({ id:row.user.id, fullName:row.user.fullName, email:row.user.email, phone:row.user.phone, status:row.user.status, createdAt:row.user.createdAt, completedBookings:Number(row.completedBookings) })) })
  } catch (error) { return serverError('admin-customers', error) }
}

export const config: Config = { path: '/api/admin/customers' }