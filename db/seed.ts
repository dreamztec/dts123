import { db } from './index.js'
import { cities, membershipBenefits, membershipPlans, pricingRules, vehicleClasses, vehicles } from './schema.js'

if (process.env.DTS_DEMO_MODE !== 'true') throw new Error('Refusing to seed unless DTS_DEMO_MODE=true')

const [abuja,lagos] = await db.insert(cities).values([
  {name:'Abuja',state:'FCT',active:true,settings:{demo:true}}, {name:'Lagos',state:'Lagos',active:true,settings:{demo:true}}, {name:'Kaduna',state:'Kaduna',active:false,settings:{demo:true}},
]).returning()
const classes = await db.insert(vehicleClasses).values([
  {code:'CITY',name:'DTS Economy / City',description:'Demo class',passengerCapacity:3,sharedRideEligible:true,attributes:{demo:true}},
  {code:'PREMIUM',name:'DTS Premium Sedan',description:'Demo class',passengerCapacity:3,sharedRideEligible:true,attributes:{demo:true}},
  {code:'SUV',name:'DTS Executive SUV',description:'Demo class',passengerCapacity:5,attributes:{demo:true}},
  {code:'LUXURY',name:'DTS Luxury',description:'Demo class',passengerCapacity:3,attributes:{demo:true}},
  {code:'BUS',name:'DTS Executive Bus',description:'Demo class',passengerCapacity:14,attributes:{demo:true}},
]).returning()
await db.insert(vehicles).values([
  {vehicleCode:'DTS-DEMO-001',vehicleClassId:classes[0].id,cityId:abuja.id,make:'Toyota',model:'Corolla',year:2022,plateNumber:'DEMO-001',fuelType:'PETROL'},
  {vehicleCode:'DTS-DEMO-002',vehicleClassId:classes[1].id,cityId:abuja.id,make:'Toyota',model:'Camry',year:2023,plateNumber:'DEMO-002',fuelType:'PETROL'},
  {vehicleCode:'DTS-DEMO-003',vehicleClassId:classes[2].id,cityId:lagos.id,make:'Toyota',model:'Highlander',year:2022,plateNumber:'DEMO-003',fuelType:'PETROL'},
  {vehicleCode:'DTS-DEMO-004',vehicleClassId:classes[3].id,cityId:lagos.id,make:'Lexus',model:'RX',year:2023,plateNumber:'DEMO-004',fuelType:'HYBRID'},
  {vehicleCode:'DTS-DEMO-005',vehicleClassId:classes[4].id,cityId:abuja.id,make:'Toyota',model:'Hiace',year:2021,plateNumber:'DEMO-005',fuelType:'DIESEL'},
])
const plans=await db.insert(membershipPlans).values(['ACCESS','EXECUTIVE','SIGNATURE','ROYALE'].map((code,index) => ({code,name:`Dreamz ${code[0]+code.slice(1).toLowerCase()}`,description:'Demo configuration — replace before production',displayOrder:index}))).returning()
await db.insert(membershipBenefits).values(plans.map((plan) => ({planId:plan.id,benefitKey:'priority_level',label:'Booking priority',value:{level:plan.displayOrder+1,demo:true}})))

// Metered pricing rules per city and vehicle class. Without these the estimate endpoint can
// resolve a route but finds no configured fare, so journeys would show "pricing not available".
const classId = Object.fromEntries(classes.map((item) => [item.code, item.id]))
const cityId = Object.fromEntries([[abuja.name, abuja.id], [lagos.name, lagos.id]])
const metered = (baseFare:number, perKm:number, perMinute:number, minimumFare:number) => ({ baseFare, perKm, perMinute, minimumFare })
await db.insert(pricingRules).values([
  { name:'Abuja CITY metered', cityId:cityId['Abuja'], vehicleClassId:classId.CITY, pricingType:'METERED', priority:10, calculation:metered(1500, 280, 25, 2500), conditions:{ serviceType:'IMMEDIATE' } },
  { name:'Abuja PREMIUM metered', cityId:cityId['Abuja'], vehicleClassId:classId.PREMIUM, pricingType:'METERED', priority:10, calculation:metered(2200, 340, 30, 3500), conditions:{ serviceType:'IMMEDIATE' } },
  { name:'Abuja SUV metered', cityId:cityId['Abuja'], vehicleClassId:classId.SUV, pricingType:'METERED', priority:10, calculation:metered(3000, 420, 35, 5000), conditions:{ serviceType:'IMMEDIATE' } },
  { name:'Abuja LUXURY metered', cityId:cityId['Abuja'], vehicleClassId:classId.LUXURY, pricingType:'METERED', priority:10, calculation:metered(4500, 550, 45, 7000), conditions:{ serviceType:'IMMEDIATE' } },
  { name:'Abuja BUS metered', cityId:cityId['Abuja'], vehicleClassId:classId.BUS, pricingType:'METERED', priority:10, calculation:metered(6000, 650, 50, 9000), conditions:{ serviceType:'IMMEDIATE' } },
  { name:'Lagos CITY metered', cityId:cityId['Lagos'], vehicleClassId:classId.CITY, pricingType:'METERED', priority:10, calculation:metered(1800, 300, 30, 3000), conditions:{ serviceType:'IMMEDIATE' } },
  { name:'Lagos PREMIUM metered', cityId:cityId['Lagos'], vehicleClassId:classId.PREMIUM, pricingType:'METERED', priority:10, calculation:metered(2500, 380, 35, 4000), conditions:{ serviceType:'IMMEDIATE' } },
  { name:'Lagos SUV metered', cityId:cityId['Lagos'], vehicleClassId:classId.SUV, pricingType:'METERED', priority:10, calculation:metered(3300, 460, 40, 5500), conditions:{ serviceType:'IMMEDIATE' } },
  { name:'Lagos LUXURY metered', cityId:cityId['Lagos'], vehicleClassId:classId.LUXURY, pricingType:'METERED', priority:10, calculation:metered(4800, 600, 50, 7500), conditions:{ serviceType:'IMMEDIATE' } },
  { name:'Lagos BUS metered', cityId:cityId['Lagos'], vehicleClassId:classId.BUS, pricingType:'METERED', priority:10, calculation:metered(6500, 700, 55, 9500), conditions:{ serviceType:'IMMEDIATE' } },
])
console.log('DTS demo seed completed. All inserted records are explicitly marked as demo where supported.')
