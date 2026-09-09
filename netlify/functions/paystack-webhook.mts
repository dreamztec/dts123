import type { Config } from '@netlify/functions'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { paymentTransactions, payments } from '../../db/schema.js'

function validSignature(body:string,signature:string,secret:string) { const expected=createHmac('sha512',secret).update(body).digest('hex'); const a=Buffer.from(expected); const b=Buffer.from(signature); return a.length===b.length && timingSafeEqual(a,b) }
export default async (request:Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed',{status:405})
  const secret=Netlify.env.get('PAYSTACK_SECRET_KEY'); if (!secret) return Response.json({error:'Payment integration not connected'},{status:503})
  const body=await request.text(); const signature=request.headers.get('x-paystack-signature') ?? ''
  if (!validSignature(body,signature,secret)) return Response.json({error:'Invalid signature'},{status:401})
  const event=JSON.parse(body) as { event:string; data?:{ reference?:string; id?:number; amount?:number; currency?:string; status?:string } }
  const reference=event.data?.reference; if (!reference) return Response.json({received:true})
  const [payment]=await db.select().from(payments).where(and(eq(payments.provider,'PAYSTACK'),eq(payments.providerReference,reference))).limit(1)
  if (!payment) return Response.json({received:true})
  await db.transaction(async (transaction) => {
    await transaction.insert(paymentTransactions).values({ paymentId:payment.id, eventType:event.event, providerEventId:event.data?.id?.toString(), signatureVerified:true, payload:event })
    if (event.event==='charge.success' && event.data?.status==='success' && event.data.amount === Math.round(Number(payment.amount)*100) && event.data.currency === payment.currency) await transaction.update(payments).set({status:'SUCCEEDED',verifiedAt:new Date(),updatedAt:new Date(),rawResponse:event.data}).where(eq(payments.id,payment.id))
  })
  return Response.json({received:true})
}
export const config:Config = { path:'/api/webhooks/paystack' }
