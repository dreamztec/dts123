import { ROUTE_UNAVAILABLE_MESSAGE } from './route-messages'

export type FareLine = { label: string; amount: number; detail?: string }

export type EstimateSuccess = {
  available: true
  route: { distanceKm: number; durationMinutes: number; etaIso: string; polyline: string | null; source: string }
  origin: { address: string | null; placeId: string | null }
  destination: { address: string | null; placeId: string | null }
  vehicleClass: { code: string; name: string; passengerCapacity: number }
  pricing: { connected: boolean; currency: string; estimate: number | null; fixed?: boolean; breakdown: FareLine[]; disclaimer?: string; message?: string }
}
export type EstimateFailure = { available: false; error: string }
export type EstimateResponse = EstimateSuccess | EstimateFailure

export type EstimateRequest = {
  origin: { placeId?: string; address?: string }
  destination: { placeId?: string; address?: string }
  cityName: string
  vehicleClassCode: string
  serviceType?: string
  passengerCount: number
  scheduledAt?: string
  specialInstructions?: string
}

/**
 * Asks the server for an estimate. Distance and duration are deliberately not sent — the server
 * measures the road route itself and is the only source of truth for both.
 */
export async function requestEstimate(input: EstimateRequest): Promise<EstimateResponse> {
  try {
    const response = await fetch('/api/bookings/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const payload = await response.json().catch(() => null)
    if (!payload || typeof payload !== 'object') return { available: false, error: ROUTE_UNAVAILABLE_MESSAGE }
    if (payload.available === true) return payload as EstimateSuccess
    return { available: false, error: typeof payload.error === 'string' ? payload.error : ROUTE_UNAVAILABLE_MESSAGE }
  } catch {
    return { available: false, error: ROUTE_UNAVAILABLE_MESSAGE }
  }
}

export type BookingSummary = {
  reference: string
  status: string
  tripType: string
  pickup: unknown
  destination: unknown
  scheduledAt: string | null
  passengerCount: number
  createdAt: string
  cityName: string
  vehicleClassCode: string | null
  vehicleClassName: string | null
  estimate: { route?: { distanceKm?: number; durationMinutes?: number }; pricing?: { estimate?: number | null; currency?: string; connected?: boolean } }
}

/** Books the estimated journey. Requires an authenticated customer session. */
export async function createBooking(input: EstimateRequest): Promise<{ ok: true; booking: BookingSummary } | { ok: false; error: string }> {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const payload = await response.json().catch(() => null)
    if (payload && typeof payload === 'object' && payload.ok === true) return payload as { ok: true; booking: BookingSummary }
    return { ok: false, error: payload && typeof payload.error === 'string' ? payload.error : 'Booking could not be completed. Please try again.' }
  } catch {
    return { ok: false, error: 'Booking could not be completed. Please try again.' }
  }
}

/** Loads the authenticated customer's recent bookings for the My Trips workspace. */
export async function fetchMyBookings(): Promise<{ bookings: BookingSummary[] } | { error: string }> {
  try {
    const response = await fetch('/api/bookings')
    if (response.status === 401) return { bookings: [] }
    const payload = await response.json().catch(() => null)
    if (payload && Array.isArray(payload.bookings)) return { bookings: payload.bookings as BookingSummary[] }
    return { error: 'Bookings are unavailable right now.' }
  } catch {
    return { error: 'Bookings are unavailable right now.' }
  }
}

export function formatNaira(amount: number) {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`
}
