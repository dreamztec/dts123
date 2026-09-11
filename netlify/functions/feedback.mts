import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { feedback } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, json, methodGuard, readJson, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { tripRatingSchema } from '../../src/lib/rewards'

const submissionSchema = z.object({
  kind:z.enum(['TRIP_RATING','FEEDBACK','COMPLAINT','SUGGESTION','BUG','FEATURE_REQUEST']).default('TRIP_RATING'),
  bookingId:z.string().uuid().optional(),
  tripId:z.string().uuid().optional(),
  rating:z.number().int().min(1).max(5).optional(),
  categories:z.record(z.string(),z.number().int().min(1).max(5)).optional(),
  npsScore:z.number().int().min(0).max(10).optional(),
  comment:z.string().max(1000).optional(),
})

export default async (request:Request) => {
  const guard = methodGuard(request,['GET','POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    if (request.method === 'GET') {
      const rows = await db.select().from(feedback).where(eq(feedback.userId,appUser.id)).orderBy(desc(feedback.createdAt)).limit(50)
      return json({ feedback:rows })
    }
    const parsed = await readJson(request,submissionSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const input = parsed.ok.data
    if (input.kind === 'TRIP_RATING' && !input.rating) return badRequest('A 1–5 rating is required for trip feedback')
    if (!input.rating && !input.comment && input.npsScore === undefined) return badRequest('Add a rating, a comment or an NPS score')
    const [record] = await db.insert(feedback).values({
      userId:appUser.id, bookingId:input.bookingId ?? null, tripId:input.tripId ?? null,
      kind:input.kind, rating:input.rating ?? null, categories:input.categories ?? {},
      comment:input.comment ?? null, npsScore:input.npsScore ?? null, status:'UNRESOLVED',
    }).returning()
    await audit({ actorId:appUser.id, action:'feedback.submit', targetType:'feedback', targetId:record.id, after:{ kind:record.kind, rating:record.rating }, request })
    return json({ feedback:record },{ status:201 })
  } catch (error) { return serverError('feedback',error) }
}

export const config:Config = { path:'/api/feedback' }