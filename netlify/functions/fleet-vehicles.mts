import type { Config } from '@netlify/functions'
import { asc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { vehicleClasses, vehicles } from '../../db/schema.js'
import { json, methodGuard, requireRoles, serverError } from './_lib/api.mts'

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET'])
  if (guard) return guard
  const auth = await requireRoles(request, ['admin', 'super_admin', 'fleet_manager'])
  if ('error' in auth) return auth.error
  try {
    const [vehicleRows, classRows] = await Promise.all([
      db.select().from(vehicles).orderBy(asc(vehicles.vehicleCode)).limit(200),
      db.select({ id:vehicleClasses.id, code:vehicleClasses.code, name:vehicleClasses.name, active:vehicleClasses.active, passengerCapacity:vehicleClasses.passengerCapacity }).from(vehicleClasses).orderBy(asc(vehicleClasses.code)),
    ])
    return json({ vehicles:vehicleRows, classes:classRows })
  } catch (error) { return serverError('fleet-vehicles', error) }
}

export const config: Config = { path: '/api/fleet/vehicles' }