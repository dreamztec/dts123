export type UserRole = 'customer' | 'driver' | 'fleet_manager' | 'admin' | 'corporate_admin' | 'corporate_rider' | 'super_admin'

export const membershipPlans = [
  { name: 'Dreamz Access', short: 'ACCESS', summary: 'Reliable everyday mobility with member priority.', highlights: ['Priority booking', 'Member support', 'Eligible shared mobility'] },
  { name: 'Dreamz Executive', short: 'EXECUTIVE', summary: 'Better access for frequent professionals and travellers.', highlights: ['Higher allocation priority', 'Configurable ride credits', 'Airport benefits'] },
  { name: 'Dreamz Signature', short: 'SIGNATURE', summary: 'Premium support and stronger travel preferences.', highlights: ['Concierge-style support', 'Chauffeur preference', 'Selected upgrade benefits'] },
  { name: 'Dreamz Royale', short: 'ROYALE', summary: 'Personalised managed mobility for VIP requirements.', highlights: ['Relationship management', 'Luxury vehicle priority', 'Bespoke mobility arrangements'] },
] as const

export const vehicleClasses = [
  { code: 'CITY', name: 'DTS Economy / City', description: 'Smart, comfortable everyday movement.', passengers: 3, luggage: 2 },
  { code: 'PREMIUM', name: 'DTS Premium Sedan', description: 'Extra comfort for work and airport days.', passengers: 3, luggage: 3 },
  { code: 'SUV', name: 'DTS Executive SUV', description: 'Space for families and executive movement.', passengers: 5, luggage: 4 },
  { code: 'LUXURY', name: 'DTS Luxury', description: 'Refined vehicles for distinguished journeys.', passengers: 3, luggage: 3 },
  { code: 'BUS', name: 'DTS Executive Bus', description: 'Managed group movement and event transport.', passengers: 14, luggage: 10 },
  { code: 'EV', name: 'Future EV', description: 'Electric mobility where operationally available.', passengers: 4, luggage: 3 },
] as const

export const bookingStatuses = ['DRAFT','PENDING_PAYMENT','CONFIRMED','SEARCHING_DRIVER','DRIVER_ASSIGNED','DRIVER_EN_ROUTE','DRIVER_ARRIVED','PASSENGER_ONBOARD','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW','INCIDENT','REFUNDED'] as const

export const sharedRideStatuses = ['AVAILABLE','MATCHING','MATCHED','PICKUP_PENDING','PICKING_UP','IN_TRANSIT','DROPPING_OFF','COMPLETED','CANCELLED'] as const

export const validTripTransitions: Record<string, readonly string[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED'], PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'CANCELLED'], SEARCHING_DRIVER: ['DRIVER_ASSIGNED', 'CANCELLED'], DRIVER_ASSIGNED: ['DRIVER_EN_ROUTE', 'CANCELLED'], DRIVER_EN_ROUTE: ['DRIVER_ARRIVED', 'CANCELLED', 'INCIDENT'], DRIVER_ARRIVED: ['PASSENGER_ONBOARD', 'NO_SHOW', 'CANCELLED'], PASSENGER_ONBOARD: ['IN_PROGRESS', 'INCIDENT'], IN_PROGRESS: ['COMPLETED', 'INCIDENT'], INCIDENT: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'], COMPLETED: ['REFUNDED'], CANCELLED: ['REFUNDED'], NO_SHOW: [], REFUNDED: [],
}
