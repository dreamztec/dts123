import type { Config } from '@netlify/functions'
import { getUser } from '@netlify/identity'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { pricingRules } from '../../db/schema.js'
import { calculateFare, pricingInputSchema, type PricingRule } from '../../src/lib/pricing-engine.js'

const headers = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }
export default async (request:Request) => {
  if (request.method !== 'POST') return Response.json({error:'Method not allowed'},{status:405,headers})
  const user = await getUser()
  if (!user) return Response.json({error:'Authentication required'},{status:401,headers})
  try {
    const input = pricingInputSchema.parse(await request.json())
    const records = await db.select().from(pricingRules).where(eq(pricingRules.active,true))
    const mapped:PricingRule[] = records.map((record) => ({ id:record.id, priority:record.priority, ...(record.calculation as Omit<PricingRule,'id'|'priority'>), conditions:record.conditions as PricingRule['conditions'] }))
    return Response.json(calculateFare(input,mapped),{headers})
  } catch (error) { return Response.json({error:error instanceof Error ? error.message : 'Invalid request'},{status:400,headers}) }
}
export const config:Config = { path:'/api/bookings/estimate' }
