import { z } from 'zod'

const pointSchema = z.object({ latitude:z.number().min(-90).max(90), longitude:z.number().min(-180).max(180), zoneId:z.string().uuid() })
export const candidateSchema = z.object({ id:z.string().uuid(), userId:z.string().uuid(), cityId:z.string().uuid(), vehicleClassId:z.string().uuid(), seats:z.number().int().min(1).max(4), pickup:pointSchema, destination:pointSchema, availableAt:z.coerce.date(), availabilityMode:z.literal(true), membershipEligible:z.literal(true) })
export type SharedCandidate = z.infer<typeof candidateSchema>
export type MatchingRules = { maxPassengers:4; maxPickupDistanceKm:number; maxDestinationDistanceKm:number; maxWaitMinutes:number; eligibleVehicleClassIds:string[]; enabledPickupZoneIds:string[]; enabledDropoffZoneIds:string[] }

function distanceKm(a:SharedCandidate['pickup'],b:SharedCandidate['pickup']) { const radius=6371; const dLat=(b.latitude-a.latitude)*Math.PI/180; const dLon=(b.longitude-a.longitude)*Math.PI/180; const lat1=a.latitude*Math.PI/180; const lat2=b.latitude*Math.PI/180; const value=Math.sin(dLat/2)**2+Math.sin(dLon/2)**2*Math.cos(lat1)*Math.cos(lat2); return 2*radius*Math.asin(Math.sqrt(value)) }

export function matchSharedRide(seedInput:SharedCandidate,candidateInputs:SharedCandidate[],rules:MatchingRules,now=new Date()) {
  const seed=candidateSchema.parse(seedInput)
  if (!rules.eligibleVehicleClassIds.includes(seed.vehicleClassId) || !rules.enabledPickupZoneIds.includes(seed.pickup.zoneId) || !rules.enabledDropoffZoneIds.includes(seed.destination.zoneId)) return { matched:false,participants:[seed],reason:'Seed journey is outside current shared-ride rules' }
  let seats=seed.seats
  const participants=[seed]
  const ranked=candidateInputs.map((item) => candidateSchema.parse(item)).filter((item) => item.id!==seed.id && item.cityId===seed.cityId && item.vehicleClassId===seed.vehicleClassId && now.getTime()-item.availableAt.getTime() <= rules.maxWaitMinutes*60_000 && rules.enabledPickupZoneIds.includes(item.pickup.zoneId) && rules.enabledDropoffZoneIds.includes(item.destination.zoneId)).map((item) => ({item,pickupDistance:distanceKm(seed.pickup,item.pickup),destinationDistance:distanceKm(seed.destination,item.destination)})).filter(({pickupDistance,destinationDistance}) => pickupDistance<=rules.maxPickupDistanceKm && destinationDistance<=rules.maxDestinationDistanceKm).sort((a,b) => (a.pickupDistance+a.destinationDistance)-(b.pickupDistance+b.destinationDistance))
  for (const {item} of ranked) { if (seats+item.seats>rules.maxPassengers) continue; participants.push(item); seats+=item.seats }
  return { matched:participants.length>1,participants,totalPassengers:seats,remainingSeats:rules.maxPassengers-seats,reason:participants.length>1 ? 'Compatible members matched deterministically' : 'No compatible member currently available' }
}
