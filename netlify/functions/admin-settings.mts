import type { Config } from '@netlify/functions'
import { getUser } from '@netlify/identity'
import { requireRole } from '../../src/lib/rbac.js'

export default async (request:Request) => {
  try { requireRole(await getUser(),['admin','super_admin']) } catch { return Response.json({error:'Administrator role required'},{status:403}) }
  if (request.method==='GET') return Response.json({sections:['General','Company','Cities','Vehicles','Vehicle Classes','Drivers','Customers','Membership','Pricing','Corporate','Rewards','Referrals','Promotions','Payments','Maps','Notifications','Safety','Airport','Events','Interstate Routes','Support','Documents','Security','Audit Logs']})
  return Response.json({error:'Method not allowed'},{status:405})
}
export const config:Config={path:'/api/admin/settings'}
