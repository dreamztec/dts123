import { db } from './index.js'
import { cities, declineReasons, driverLevels, loyaltyRules, membershipBenefits, membershipPlans, referralConfig, routinePackages, services, vehicleClasses } from './schema.js'

export async function seed() {
  const cityRows = await db.select({ id:cities.id, name:cities.name }).from(cities)
  if (!cityRows.some((row) => row.name === 'Abuja')) {
    await db.insert(cities).values([
      { name:'Abuja', state:'FCT', country:'Nigeria', active:true, settings:{ country:'Nigeria' } },
      { name:'Lagos', state:'Lagos', country:'Nigeria', active:true, settings:{ country:'Nigeria' } },
      { name:'Kaduna', state:'Kaduna', country:'Nigeria', active:false, settings:{ country:'Nigeria', interstatePartnerCity:true } },
    ])
  }

  const classRows = await db.select({ id:vehicleClasses.id, code:vehicleClasses.code }).from(vehicleClasses)
  if (!classRows.some((row) => row.code === 'CITY')) {
    await db.insert(vehicleClasses).values([
      { code:'CITY', name:'FASTRIDES City', description:'Smart, comfortable everyday movement.', passengerCapacity:3, luggageCapacity:2, sharedRideEligible:true, attributes:{ tintFamily:'oxblood' } },
      { code:'PREMIUM', name:'FASTRIDES Premium Sedan', description:'Extra comfort for work and airport days.', passengerCapacity:3, luggageCapacity:3, sharedRideEligible:true, attributes:{} },
      { code:'SUV', name:'FASTRIDES Executive SUV', description:'Space for families and executive movement.', passengerCapacity:5, luggageCapacity:4, attributes:{} },
      { code:'LUXURY', name:'FASTRIDES Luxury', description:'Refined vehicles for distinguished journeys.', passengerCapacity:3, luggageCapacity:3, attributes:{} },
      { code:'BUS', name:'FASTRIDES Executive Bus', description:'Managed group movement and event transport.', passengerCapacity:14, luggageCapacity:10, attributes:{} },
    ])
  }

  const serviceRows = await db.select({ id:services.id, code:services.code }).from(services)
  if (!serviceRows.some((row) => row.code === 'FAST_RIDE')) {
    await db.insert(services).values([
      { code:'FAST_RIDE', name:'Fast Ride', description:'Immediate, managed ride-hailing.', displayOrder:1 },
      { code:'PREMIUM', name:'Premium', description:'Higher-comfort sedans with priority allocation.', displayOrder:2 },
      { code:'CHAUFFEUR', name:'Chauffeur', description:'By-the-hour professional chauffeur service.', requiresScheduledTime:true, displayOrder:3 },
      { code:'AIRPORT', name:'Airport', description:'Arrival and departure transfers with flight-aware planning.', requiresRoute:true, requiresScheduledTime:true, displayOrder:4 },
      { code:'CORPORATE', name:'Corporate', description:'Policy-governed business travel.', requiresRoute:true, displayOrder:5 },
      { code:'EVENTS', name:'Events', description:'Multi-vehicle movement for occasions and delegations.', requiresScheduledTime:true, displayOrder:6 },
      { code:'ROUTINE', name:'Routine', description:'Recurring commuter and corporate movement.', requiresRoute:true, displayOrder:7 },
      { code:'SHARE', name:'Share', description:'Controlled member shared mobility.', allowSharedRide:true, displayOrder:8 },
      { code:'INTERSTATE', name:'Interstate', description:'Pre-booked intercity journeys on configured routes.', requiresRoute:true, requiresScheduledTime:true, displayOrder:9 },
      { code:'EXECUTIVE_BUS', name:'Executive Bus', description:'Managed group service on the Executive Bus class.', displayOrder:10 },
    ])
  }

  const planRows = await db.select({ id:membershipPlans.id, code:membershipPlans.code }).from(membershipPlans)
  if (!planRows.some((row) => row.code === 'FASTRIDES_ACCESS')) {
    const plans = await db.insert(membershipPlans).values([
      { code:'FASTRIDES_ACCESS', name:'FASTRIDES Access', description:'Reliable everyday mobility with member priority.', displayOrder:1, active:true },
      { code:'FASTRIDES_EXECUTIVE', name:'FASTRIDES Executive', description:'Better access for frequent professionals and travellers.', displayOrder:2, active:true },
      { code:'FASTRIDES_SIGNATURE', name:'FASTRIDES Signature', description:'Premium support and stronger travel preferences.', displayOrder:3, active:true },
      { code:'FASTRIDES_ROYALE', name:'FASTRIDES Royale', description:'Personalised managed mobility for VIP requirements.', displayOrder:4, active:true },
    ]).returning()
    await db.insert(membershipBenefits).values(plans.flatMap((plan) => [
      { planId:plan.id, benefitKey:'booking_priority', label:'Booking priority', value:{ level:plan.displayOrder } },
      { planId:plan.id, benefitKey:'member_support', label:'Member support', value:{ enabled:true } },
    ]))
  }

  if (!(await db.select({ id:driverLevels.id }).from(driverLevels)).some((row: any) => row.code === 'STARTER')) {
    await db.insert(driverLevels).values([
      { code:'STARTER', name:'Starter', displayOrder:1, requirements:{ completedTrips:0, rating:0, safetyScore:0 }, benefits:['Standard assignment access'] },
      { code:'PROFESSIONAL', name:'Professional', displayOrder:2, requirements:{ completedTrips:50, rating:4.2, safetyScore:75 }, benefits:['Priority assignments','Eligible for productivity bonus'] },
      { code:'EXECUTIVE', name:'Executive', displayOrder:3, requirements:{ completedTrips:250, rating:4.5, safetyScore:85 }, benefits:['Chauffeur service eligibility','Higher bonus ceilings'] },
      { code:'ELITE', name:'Elite', displayOrder:4, requirements:{ completedTrips:750, rating:4.7, safetyScore:90 }, benefits:['Elite assignments','Special assignment bonus eligibility','Priority support'] },
    ])
  }

  if (!(await db.select({ id:declineReasons.id }).from(declineReasons)).some((row: any) => row.code === 'VEHICLE_ISSUE')) {
    await db.insert(declineReasons).values([
      { code:'VEHICLE_ISSUE', label:'Vehicle issue' },
      { code:'REST_PERIOD', label:'Legitimate rest period' },
      { code:'EMERGENCY', label:'Personal emergency' },
      { code:'OUTSIDE_HOURS', label:'Outside contracted hours' },
      { code:'LICENCE_OR_DOCUMENT', label:'Licence or document matter' },
      { code:'OTHER', label:'Other (reviewed by operations)', legitimate:false },
    ])
  }

  if (!(await db.select({ id:routinePackages.id }).from(routinePackages)).some((row: any) => row.code === 'ROUTINE_10')) {
    await db.insert(routinePackages).values([
      { code:'ROUTINE_10', name:'FASTRIDES Routine — 10 rides', rideCount:10, validityDays:30, audienceType:'INDIVIDUAL' },
      { code:'ROUTINE_20', name:'FASTRIDES Routine — 20 rides', rideCount:20, validityDays:60, audienceType:'INDIVIDUAL' },
      { code:'ROUTINE_MONTHLY', name:'FASTRIDES Routine — Monthly', rideCount:null, validityDays:30, audienceType:'INDIVIDUAL' },
      { code:'ROUTINE_CORPORATE', name:'FASTRIDES Routine — Corporate', rideCount:null, validityDays:30, audienceType:'CORPORATE' },
      { code:'ROUTINE_FAMILY', name:'FASTRIDES Routine — Family', rideCount:null, validityDays:30, audienceType:'FAMILY' },
    ])
  }

  if (!(await db.select({ id:loyaltyRules.id }).from(loyaltyRules)).some((row: any) => row.ruleKey === 'completed_trip')) {
    await db.insert(loyaltyRules).values([
      { ruleKey:'completed_trip', name:'Completed trip', ruleType:'EARN', points:0, conditions:{ perTrip:true }, tierMultipliers:{}, expiryDays:null, active:false },
      { ruleKey:'referral_qualified', name:'Qualified referral', ruleType:'EARN', points:0, conditions:{}, tierMultipliers:{}, expiryDays:null, active:false },
      { ruleKey:'trip_feedback', name:'Trip feedback submitted', ruleType:'EARN', points:0, conditions:{ oncePerTrip:true }, tierMultipliers:{}, expiryDays:null, active:false },
    ])
  }

  if (!(await db.select({ id:referralConfig.id }).from(referralConfig)).some(() => true)) {
    await db.insert(referralConfig).values({ qualifyingEvent:'FIRST_COMPLETED_TRIP', referrerRewardType:'RIDE_CREDIT', referrerRewardValue:{}, refereeRewardType:'RIDE_CREDIT', refereeRewardValue:{}, expiryDays:90, active:true })
  }
}