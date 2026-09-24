import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { emergencyContacts, incidents, sosAlerts } from '../../db/schema.js'
import { json, methodGuard, requireRoles, serverError } from './_lib/api.mts'

export default async (request: Request) => {
  const guard = methodGuard(request, ['GET'])
  if (guard) return guard
  const auth = await requireRoles(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  try {
    const [incidentRows, sosRows] = await Promise.all([
      db.select().from(incidents).orderBy(desc(incidents.createdAt)).limit(100),
      db.select({ alert:sosAlerts, contactName:emergencyContacts.name, contactPhone:emergencyContacts.phone }).from(sosAlerts).leftJoin(emergencyContacts, eq(sosAlerts.emergencyContactId, emergencyContacts.id)).orderBy(desc(sosAlerts.createdAt)).limit(100),
    ])
    return json({
      incidents:incidentRows,
      sos:sosRows.map((row) => ({ ...row.alert, contactName:row.contactName, contactPhone:row.contactPhone })),
    })
  } catch (error) { return serverError('admin-incidents', error) }
}

export const config: Config = { path: '/api/admin/incidents' }