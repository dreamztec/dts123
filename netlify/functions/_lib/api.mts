import { getUser } from '@netlify/identity'
import { eq } from 'drizzle-orm'
import { db } from '../../../db/index.js'
import { auditLogs, corporateMembers, corporateAccounts, driverProfiles, users } from '../../../db/schema.js'
import type { UserRole } from '../../../src/lib/domain'

export const jsonHeaders = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }

export function json(data:unknown, status=200, extraHeaders:Record<string,string>={}) { return Response.json(data,{ status, headers:{ ...jsonHeaders, ...extraHeaders } }) }
export function badRequest(message:string) { return json({ error:message },400) }
export function unauthorised(message='Authentication required') { return json({ error:message },401) }
export function forbidden(message='You do not have permission to perform this action') { return json({ error:message },403) }
export function notFound(message='Not found') { return json({ error:message },404) }
export function serverError(context:string, error:unknown, includeDetail=false) {
  if (includeDetail) console.error(`[api] ${context}`, error)
  return json({ error:'Something went wrong. Please try again shortly.' },500)
}
export function integrationUnavailable(provider:string) { return json({ error:`${provider} integration is not connected yet.`, configured:false },503) }

export type AuthContext = { identityId:string; email:string; roles:string[] } | null

export async function getAuth(_request:Request): Promise<AuthContext> {
  const identity = await getUser()
  if (!identity || !identity.id) return null
  const roles = identity.roles ?? []
  return { identityId:String(identity.id), email:identity.email ?? '', roles }
}

export function hasAnyRole(auth:AuthContext, allowed:UserRole[]) {
  if (!auth) return false
  return allowed.some((role) => auth.roles.includes(role))
}

export async function requireRoles(request:Request, allowed:UserRole[]) {
  const auth = await getAuth(request)
  if (!auth) return { error:unauthorised() as Response }
  if (!hasAnyRole(auth,allowed)) return { error:forbidden() as Response }
  return { auth }
}

export async function requireAdmin(request:Request) {
  return requireRoles(request,['admin','super_admin'])
}

export async function requireAuthenticated(request:Request) {
  const auth = await getAuth(request)
  if (!auth) return { error:unauthorised() as Response }
  return { auth }
}

export async function appUserForIdentity(identityId:string) {
  const [user] = await db.select().from(users).where(eq(users.identityId,identityId)).limit(1)
  return user ?? null
}

export async function driverProfileForUser(userId:string) {
  const [profile] = await db.select().from(driverProfiles).where(eq(driverProfiles.userId,userId)).limit(1)
  return profile ?? null
}

export async function corporateMembershipForUser(userId:string) {
  const [membership] = await db.select({ membership:corporateMembers, account:corporateAccounts }).from(corporateMembers).innerJoin(corporateAccounts,eq(corporateMembers.corporateAccountId,corporateAccounts.id)).where(eq(corporateMembers.userId,userId)).limit(1)
  return membership ?? null
}

export async function audit(params:{ actorId?:string|null; action:string; targetType:string; targetId:string; before?:unknown; after?:unknown; request?:Request }) {
  try {
    const ip = params.request?.headers.get('x-nf-client-connection-ip') ?? params.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    await db.insert(auditLogs).values({ actorId:params.actorId ?? null, action:params.action, targetType:params.targetType, targetId:params.targetId, before:params.before ?? null, after:params.after ?? null, ipAddress:ip })
  } catch (error) { console.error('[audit] failed to record audit entry', error) }
}

export async function readJson<T>(request:Request, parse:(value:unknown)=>T): Promise<{ ok:T } | { error:Response }> {
  let raw:unknown
  try { raw = await request.json() } catch { return { error:badRequest('Request body must be valid JSON') } }
  try { return { ok:parse(raw) } } catch (error) { return { error:badRequest(error instanceof Error ? error.message : 'Invalid request payload') } }
}

export function methodGuard(request:Request, allowed:string[]) {
  if (!allowed.includes(request.method)) return json({ error:'Method not allowed' },405)
  return null
}