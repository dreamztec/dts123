export type UserRole = 'customer' | 'driver' | 'fleet_manager' | 'admin' | 'corporate_admin' | 'corporate_rider' | 'super_admin'

export const SERVICE_TYPES = ['FAST_RIDE','PREMIUM','CHAUFFEUR','AIRPORT','CORPORATE','EVENTS','ROUTINE','SHARE','INTERSTATE','EXECUTIVE_BUS'] as const
export type ServiceType = typeof SERVICE_TYPES[number]

export const VEHICLE_CLASS_CODES = ['CITY','PREMIUM','SUV','LUXURY','BUS'] as const
export type VehicleClassCode = typeof VEHICLE_CLASS_CODES[number]

export const MEMBERSHIP_PLAN_CODES = ['FASTRIDES_ACCESS','FASTRIDES_EXECUTIVE','FASTRIDES_SIGNATURE','FASTRIDES_ROYALE'] as const
export type MembershipPlanCode = typeof MEMBERSHIP_PLAN_CODES[number]

export const DRIVER_LEVEL_CODES = ['STARTER','PROFESSIONAL','EXECUTIVE','ELITE'] as const
export type DriverLevelCode = typeof DRIVER_LEVEL_CODES[number]

export const DRIVER_STATUSES = ['offline','available','assigned','arriving','arrived','on_trip','paused','unavailable'] as const
export type DriverStatus = typeof DRIVER_STATUSES[number]
export const DRIVER_ACTIVE_STATUSES: readonly DriverStatus[] = ['available','assigned','arriving','arrived','on_trip']

export const FUEL_TYPES = ['PETROL','DIESEL','HYBRID','ELECTRIC'] as const
export type FuelType = typeof FUEL_TYPES[number]

export const bookingStatuses = ['DRAFT','PENDING_PAYMENT','CONFIRMED','SEARCHING_DRIVER','DRIVER_ASSIGNED','DRIVER_EN_ROUTE','DRIVER_ARRIVED','PASSENGER_ONBOARD','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW','INCIDENT','REFUNDED'] as const

export const sharedRideStatuses = ['AVAILABLE','MATCHING','MATCHED','PICKUP_PENDING','PICKING_UP','IN_TRANSIT','DROPPING_OFF','COMPLETED','CANCELLED'] as const

export const validTripTransitions: Record<string, readonly string[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED'], PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'CANCELLED'], SEARCHING_DRIVER: ['DRIVER_ASSIGNED', 'CANCELLED'], DRIVER_ASSIGNED: ['DRIVER_EN_ROUTE', 'CANCELLED'], DRIVER_EN_ROUTE: ['DRIVER_ARRIVED', 'CANCELLED', 'INCIDENT'], DRIVER_ARRIVED: ['PASSENGER_ONBOARD', 'NO_SHOW', 'CANCELLED'], PASSENGER_ONBOARD: ['IN_PROGRESS', 'INCIDENT'], IN_PROGRESS: ['COMPLETED', 'INCIDENT'], INCIDENT: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'], COMPLETED: ['REFUNDED'], CANCELLED: ['REFUNDED'], NO_SHOW: [], REFUNDED: [],
}

export const driverAssignmentStatuses = ['OFFERED','ACCEPTED','DECLINED','EXPIRED','CANCELLED'] as const
export type DriverAssignmentStatus = typeof driverAssignmentStatuses[number]

export const bookingRelationships = ['SELF','FRIEND','FAMILY','EMPLOYEE','GUEST','CLIENT'] as const
export type BookingRelationship = typeof bookingRelationships[number]

export const eventTypes = ['WEDDING','CONFERENCE','CORPORATE_EVENT','POLITICAL_EVENT','PRIVATE_EVENT','GROUP_AIRPORT','DELEGATION'] as const
export type EventType = typeof eventTypes[number]

export const feedbackCategories = ['driver','vehicle','booking','price','app','pickup','route','safety','support'] as const
export type FeedbackCategory = typeof feedbackCategories[number]

export const feedbackKinds = ['TRIP_RATING','FEEDBACK','COMPLAINT','SUGGESTION','BUG','FEATURE_REQUEST'] as const
export type FeedbackKind = typeof feedbackKinds[number]

export const walletBalanceTypes = ['CASH','PROMOTIONAL','MEMBERSHIP_CREDIT','REWARD_CREDIT'] as const
export type WalletBalanceType = typeof walletBalanceTypes[number]
export const walletEntryTypes = ['CREDIT','DEBIT','ADJUSTMENT','REFUND'] as const
export type WalletEntryType = typeof walletEntryTypes[number]

export const interstateEventTypes = ['DEPARTURE'] as const
export const corporateApprovalLevels = ['NONE','MANAGER','FINANCE','EXECUTIVE'] as const
export type CorporateApprovalLevel = typeof corporateApprovalLevels[number]

export const recurringDays = ['MON','TUE','WED','THU','FRI','SAT','SUN'] as const
export type RecurringDay = typeof recurringDays[number]

export const membershipBillingCycles = ['MONTHLY','ANNUAL'] as const
export type MembershipBillingCycle = typeof membershipBillingCycles[number]

export const invoiceStatuses = ['DRAFT','ISSUED','PAID','OVERDUE','CANCELLED'] as const
export type InvoiceStatus = typeof invoiceStatuses[number]

export const notificationChannels = ['IN_APP','SMS','EMAIL','WHATSAPP','PUSH'] as const
export type NotificationChannel = typeof notificationChannels[number]
export const notificationStatuses = ['INTENT_RECORDED','QUEUED','SENT','DELIVERED','FAILED','SKIPPED_NO_PROVIDER'] as const

export const PERFORMANCE_COMPONENTS = ['punctuality','acceptanceCompletion','ratingScore','safety','utilisation','vehicleCare','complaints'] as const
export type PerformanceComponent = typeof PERFORMANCE_COMPONENTS[number]

export const DEFAULT_PERFORMANCE_WEIGHTS: Record<PerformanceComponent, number> = {
  punctuality: 20, acceptanceCompletion: 15, ratingScore: 20, safety: 20, utilisation: 10, vehicleCare: 10, complaints: 5,
}

export const vehicleClasses = [
  { code: 'CITY', name: 'FASTRIDES City', description: 'Smart, comfortable everyday movement.', passengers: 3, luggage: 2 },
  { code: 'PREMIUM', name: 'FASTRIDES Premium Sedan', description: 'Extra comfort for work and airport days.', passengers: 3, luggage: 3 },
  { code: 'SUV', name: 'FASTRIDES Executive SUV', description: 'Space for families and executive movement.', passengers: 5, luggage: 4 },
  { code: 'LUXURY', name: 'FASTRIDES Luxury', description: 'Refined vehicles for distinguished journeys.', passengers: 3, luggage: 3 },
  { code: 'BUS', name: 'FASTRIDES Executive Bus', description: 'Managed group movement and event transport.', passengers: 14, luggage: 10 },
  { code: 'EV', name: 'Future EV', description: 'Electric mobility where operationally available.', passengers: 4, luggage: 3 },
] as const

export { MEMBERSHIP_PLANS as membershipPlans } from './membership'