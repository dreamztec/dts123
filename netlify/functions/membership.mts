import type { Config } from '@netlify/functions'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { membershipPlans, subscriptions } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, json, methodGuard, readJson, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { membershipRequestSchema, isActiveSubscription } from '../../src/lib/membership'

export default async (request:Request) => {
  const guard = methodGuard(request,['GET','POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    if (request.method === 'GET') {
      const rows = await db.select({ subscription:subscriptions, plan:membershipPlans }).from(subscriptions).innerJoin(membershipPlans,eq(subscriptions.planId,membershipPlans.id)).where(eq(subscriptions.userId,appUser.id)).orderBy(desc(subscriptions.createdAt))
      const active = rows.find((row) => isActiveSubscription({ status:row.subscription.status, expiresAt:row.subscription.expiresAt })) ?? null
      return json({
        subscriptions:rows.map((row) => ({ ...row.subscription, planCode:row.plan.code, planName:row.plan.name })),
        active:active ? { ...active.subscription, planCode:active.plan.code, planName:active.plan.name } : null,
      })
    }
    const parsed = await readJson(request,membershipRequestSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const { planCode, billingCycle } = parsed.ok.data
    const [plan] = await db.select().from(membershipPlans).where(and(eq(membershipPlans.code,planCode),eq(membershipPlans.active,true))).limit(1)
    if (!plan) return badRequest('Membership plan is not available')
    const price = billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice
    const [subscription] = await db.insert(subscriptions).values({
      userId:appUser.id, planId:plan.id, status:'PENDING', billingCycle,
      benefitSnapshot:{ planCode:plan.code, requestedAt:new Date().toISOString(), priceConfigured:price != null },
    }).returning()
    await audit({ actorId:appUser.id, action:'membership.request', targetType:'subscription', targetId:subscription.id, after:{ planCode:plan.code, billingCycle }, request })
    return json({
      subscription,
      plan:{ code:plan.code, name:plan.name },
      priceConfigured:price != null,
      message:price != null ? 'Membership request recorded. Payment activates once the payment provider is connected.' : 'Membership request recorded. Price to be configured.',
    },{ status:201 })
  } catch (error) { return serverError('membership',error) }
}

export const config:Config = { path:'/api/membership' }