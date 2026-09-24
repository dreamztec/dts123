import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { maintenanceRecords, vehicles } from '../../db/schema.js'
import { json, methodGuard, requireRoles, serverError } from './_lib/api.mts'

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET'])
  if (guard) return guard
  const auth = await requireRoles(request, ['admin', 'super_admin', 'fleet_manager'])
  if ('error' in auth) return auth.error
  try {
    const rows = await db.select({ record:maintenanceRecords, vehicleCode:vehicles.vehicleCode }).from(maintenanceRecords).leftJoin(vehicles, eq(maintenanceRecords.vehicleId, vehicles.id)).orderBy(desc(maintenanceRecords.serviceDate)).limit(200)
    return json({ records: rows.map((row) => ({ ...row.record, vehicleCode: row.vehicleCode ?? 'Unknown vehicle' })) })
  } catch (error) { return serverError('fleet-maintenance', error) }
}

export const config: Config = { path: '/api/fleet/maintenance' }