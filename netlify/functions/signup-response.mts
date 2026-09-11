import type { Config } from '@netlify/functions'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { signupResponses, users } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, json, methodGuard, readJson, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { validateQuestionnaireResponse, type AudienceType } from '../../src/lib/questionnaires'

const submissionSchema = z.object({ audienceType:z.enum(['INDIVIDUAL','DRIVER','COMPANY']), selectedOption:z.string().nullable().optional(), otherText:z.string().max(500).nullable().optional() })

export default async (request:Request) => {
  const guard = methodGuard(request,['GET','POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    if (request.method === 'GET') {
      const responses = await db.select().from(signupResponses).where(eqUserId(appUser.id))
      return json({ responses })
    }
    const parsed = await readJson(request,submissionSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const { audienceType, selectedOption, otherText } = parsed.ok.data
    let validated
    try { validated = validateQuestionnaireResponse(audienceType as AudienceType, selectedOption ?? null, otherText ?? null) }
    catch (error) { return badRequest(error instanceof Error ? error.message : 'Invalid questionnaire response') }
    const [record] = await db.insert(signupResponses).values({ userId:appUser.id, audienceType, ...validated }).returning()
    await audit({ actorId:appUser.id, action:'signup_response.submit', targetType:'signup_response', targetId:record.id, after:validated, request })
    return json({ recorded:true, response:record },{ status:201 })
  } catch (error) { return serverError('signup-response',error) }
}

import { eq } from 'drizzle-orm'
function eqUserId(id:string) { return eq(signupResponses.userId,id) }

export const config:Config = { path:'/api/signup-response' }