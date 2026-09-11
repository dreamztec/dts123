import type { Config } from '@netlify/functions'
import { asc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { airports, cities, driverLevels, membershipBenefits, membershipPlans, routinePackages, services, vehicleClasses } from '../../db/schema.js'
import { json, methodGuard, serverError } from './_lib/api.mts'
import { savingsFromAnnual } from '../../src/lib/membership'
import { signupQuestionnaires } from '../../src/lib/questionnaires'
import { Netlify } from './_lib/env.mts'

export default async (request:Request) => {
  const guard = methodGuard(request,['GET'])
  if (guard) return guard
  try {
    const [cityRows, classRows, serviceRows, planRows, benefitRows, packageRows, airportRows, levelRows] = await Promise.all([
      db.select({ id:cities.id, name:cities.name, state:cities.state, country:cities.country, active:cities.active }).from(cities).orderBy(asc(cities.name)),
      db.select().from(vehicleClasses).orderBy(asc(vehicleClasses.code)),
      db.select().from(services).orderBy(asc(services.displayOrder)),
      db.select().from(membershipPlans).orderBy(asc(membershipPlans.displayOrder)),
      db.select().from(membershipBenefits),
      db.select().from(routinePackages).orderBy(asc(routinePackages.code)),
      db.select().from(airports).orderBy(asc(airports.name)),
      db.select().from(driverLevels).orderBy(asc(driverLevels.displayOrder)),
    ])
    const plans = planRows.filter((plan) => plan.active).map((plan) => {
      const benefits = benefitRows.filter((benefit) => benefit.planId === plan.id && benefit.active).map((benefit) => ({ key:benefit.benefitKey, label:benefit.label, value:benefit.value }))
      const monthly = plan.monthlyPrice != null ? Number(plan.monthlyPrice) : null
      const annualConfigured = plan.annualPrice != null
      const annual = annualConfigured ? Number(plan.annualPrice) : (monthly != null ? Math.round(monthly*12*100)/100 : null)
      return { ...plan, monthlyConfigured:monthly != null, monthlyPrice:monthly, annualConfigured, annualPrice:annual, annualSavings:savingsFromAnnual(monthly,annual) }
    })
    return json({
      cities:cityRows,
      vehicleClasses:classRows,
      services:serviceRows.filter((service) => service.active),
      membershipPlans:plans,
      routinePackages:packageRows.map((row) => ({ ...row, packagePrice:row.packagePrice != null ? Number(row.packagePrice) : null, discountPercent:row.discountPercent != null ? Number(row.discountPercent) : null })),
      airports:airportRows,
      driverLevels:levelRows,
      questionnaires:signupQuestionnaires,
      integrations:{ routing:Boolean(Netlify.env.get('GOOGLE_MAPS_ROUTES_API_KEY')), payments:Boolean(Netlify.env.get('PAYSTACK_SECRET_KEY')), flightStatus:false },
    })
  } catch (error) { return serverError('public-config',error,true) }
}

export const config:Config = { path:'/api/config' }