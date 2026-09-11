import type { Config } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { customerProfiles, savedLocations, users } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, forbidden, json, methodGuard, notFound, readJson, requireAuthenticated, serverError } from './_lib/api.mts'
import { z } from 'zod'

const profileSchema = z.object({
  fullName:z.string().min(2).max(120).optional(),
  phone:z.string().min(7).max(20).optional(),
  dateOfBirth:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  profilePhotoUrl:z.string().url().max(500).nullable().optional(),
  preferredPickup:z.object({ label:z.string().max(200), address:z.string().max(300) }).nullable().optional(),
  emergencyContactName:z.string().max(120).nullable().optional(),
  emergencyContactPhone:z.string().max(20).nullable().optional(),
})

const savedLocationSchema = z.object({ label:z.string().min(1).max(80), address:z.string().min(2).max(300), latitude:z.number().optional(), longitude:z.number().optional() })

export default async (request:Request) => {
  const guard = methodGuard(request,['GET','PATCH','POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return notFound('Your account record has not been provisioned yet')
    if (request.method === 'GET') {
      const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId,appUser.id)).limit(1)
      const locations = await db.select().from(savedLocations).where(eq(savedLocations.userId,appUser.id))
      return json({ user:{ id:appUser.id, fullName:appUser.fullName, email:appUser.email, phone:appUser.phone, role:appUser.role, status:appUser.status, createdAt:appUser.createdAt }, profile:profile ?? null, savedLocations:locations })
    }
    if (request.method === 'PATCH') {
      const parsed = await readJson(request,profileSchema.safeParse)
      if ('error' in parsed) return parsed.error
      if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
      const values = parsed.ok.data
      if (values.fullName || values.phone) {
        await db.update(users).set({ ...(values.fullName ? { fullName:values.fullName } : {}), ...(values.phone !== undefined ? { phone:values.phone } : {}), updatedAt:new Date() }).where(eq(users.id,appUser.id))
      }
      const [existing] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId,appUser.id)).limit(1)
      const profileValues = { dateOfBirth:values.dateOfBirth ?? undefined, profilePhotoUrl:values.profilePhotoUrl ?? undefined, preferredPickup:values.preferredPickup === undefined ? undefined : values.preferredPickup ?? null, emergencyContactName:values.emergencyContactName ?? undefined, emergencyContactPhone:values.emergencyContactPhone ?? undefined, updatedAt:new Date() }
      if (existing) await db.update(customerProfiles).set(profileValues).where(eq(customerProfiles.id,existing.id))
      else await db.insert(customerProfiles).values({ userId:appUser.id, ...profileValues })
      await audit({ actorId:appUser.id, action:'customer.profile.update', targetType:'customer_profile', targetId:appUser.id, request })
      return json({ updated:true })
    }
    const parsed = await readJson(request,savedLocationSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const [location] = await db.insert(savedLocations).values({ userId:appUser.id, label:parsed.ok.data.label, address:parsed.ok.data.address, location:{ latitude:parsed.ok.data.latitude ?? null, longitude:parsed.ok.data.longitude ?? null } }).returning()
    return json({ savedLocation:location },{ status:201 })
  } catch (error) { return serverError('account',error) }
}

export const config:Config = { path:'/api/account' }