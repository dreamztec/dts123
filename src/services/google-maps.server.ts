// Server-only Google Maps integration. This module reads GOOGLE_MAPS_ROUTES_API_KEY
// and must never be imported from browser/client code.
import { ROUTE_UNAVAILABLE_MESSAGE } from '../lib/route-messages.js'
import { IntegrationNotConnectedError, type Coordinates, type MapsProvider, type RouteEstimate } from './adapters.js'

const ROUTES_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const PLACE_DETAILS_ENDPOINT = 'https://places.googleapis.com/v1/places'
const TEXT_SEARCH_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'

export { ROUTE_UNAVAILABLE_MESSAGE }

/** Thrown whenever a road route could not be established. Carries a fixed customer-facing message. */
export class RouteUnavailableError extends Error {
  readonly customerMessage = ROUTE_UNAVAILABLE_MESSAGE
  constructor(readonly reason: string) { super(`Route unavailable: ${reason}`) }
}

function requireApiKey() {
  // Netlify Functions expose site env vars via Netlify.env; process.env covers local/test runtimes.
  const key = (globalThis as any).Netlify?.env?.get?.('GOOGLE_MAPS_ROUTES_API_KEY') ?? process.env.GOOGLE_MAPS_ROUTES_API_KEY
  if (!key) throw new IntegrationNotConnectedError('Google Maps')
  return key
}

/** Logs an upstream failure with enough context to debug, without ever including the API key. */
function logUpstreamFailure(operation: string, status: number, body: unknown) {
  const detail = typeof body === 'string' ? body.slice(0, 400) : JSON.stringify(body)?.slice(0, 400)
  console.error(`[google-maps] ${operation} failed`, { status, detail })
}

/** Google returns durations as protobuf duration strings, e.g. "1284s". */
export function parseDurationSeconds(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const match = /^(\d+(?:\.\d+)?)s$/.exec(value.trim())
  if (!match) return null
  const seconds = Number(match[1])
  return Number.isFinite(seconds) ? seconds : null
}

export function isPlausibleCoordinate(point: unknown): point is Coordinates {
  if (!point || typeof point !== 'object') return false
  const { latitude, longitude } = point as Record<string, unknown>
  return typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180
}

async function googleFetch(url: string, operation: string, init: RequestInit & { fieldMask?: string }) {
  const { fieldMask, ...rest } = init
  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': requireApiKey(),
        ...(fieldMask ? { 'X-Goog-FieldMask': fieldMask } : {}),
        ...(rest.headers ?? {}),
      },
    })
  } catch (error) {
    logUpstreamFailure(operation, 0, error instanceof Error ? error.message : 'network error')
    throw new RouteUnavailableError(`${operation} request failed`)
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    logUpstreamFailure(operation, response.status, payload ?? '(no body)')
    throw new RouteUnavailableError(`${operation} returned ${response.status}`)
  }
  return payload as Record<string, any>
}

/** Resolves a Google place ID to verified coordinates. Coordinates are never taken on trust from the browser. */
export async function resolvePlaceId(placeId: string): Promise<{ coordinates: Coordinates; formattedAddress?: string; placeId: string }> {
  if (!/^[A-Za-z0-9_-]{5,512}$/.test(placeId)) throw new RouteUnavailableError('invalid place id')
  const payload = await googleFetch(`${PLACE_DETAILS_ENDPOINT}/${encodeURIComponent(placeId)}`, 'place details', {
    method: 'GET',
    fieldMask: 'id,location,formattedAddress',
  })
  const location = payload?.location
  const coordinates = { latitude: location?.latitude, longitude: location?.longitude }
  if (!isPlausibleCoordinate(coordinates)) throw new RouteUnavailableError('place has no usable location')
  return { coordinates, formattedAddress: payload?.formattedAddress, placeId: payload?.id ?? placeId }
}

export class GoogleMapsProvider implements MapsProvider {
  /** Text -> coordinates via Places API (New) text search, biased to Nigeria. */
  async geocode(query: string): Promise<Coordinates[]> {
    const trimmed = query.trim()
    if (trimmed.length < 3) throw new RouteUnavailableError('search text too short')
    const payload = await googleFetch(TEXT_SEARCH_ENDPOINT, 'places text search', {
      method: 'POST',
      fieldMask: 'places.id,places.location,places.formattedAddress',
      body: JSON.stringify({ textQuery: trimmed, regionCode: 'NG', languageCode: 'en', maxResultCount: 5 }),
    })
    const places = Array.isArray(payload?.places) ? payload.places : []
    return places
      .map((place: any) => ({ latitude: place?.location?.latitude, longitude: place?.location?.longitude }))
      .filter(isPlausibleCoordinate)
  }

  /** Road-network route via the Google Routes API. Never a straight-line calculation. */
  async route(origin: Coordinates, destination: Coordinates): Promise<RouteEstimate> {
    if (!isPlausibleCoordinate(origin) || !isPlausibleCoordinate(destination)) throw new RouteUnavailableError('invalid coordinates')
    const payload = await googleFetch(ROUTES_ENDPOINT, 'compute routes', {
      method: 'POST',
      fieldMask: 'routes.distanceMeters,routes.duration,routes.staticDuration,routes.polyline.encodedPolyline',
      body: JSON.stringify({
        origin: { location: { latLng: origin } },
        destination: { location: { latLng: destination } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        languageCode: 'en-NG',
        regionCode: 'NG',
        units: 'METRIC',
      }),
    })
    const route = Array.isArray(payload?.routes) ? payload.routes[0] : null
    const distanceMeters = route?.distanceMeters
    const durationSeconds = parseDurationSeconds(route?.duration) ?? parseDurationSeconds(route?.staticDuration)
    if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters) || distanceMeters <= 0) throw new RouteUnavailableError('no drivable route returned')
    if (durationSeconds === null || durationSeconds <= 0) throw new RouteUnavailableError('no duration returned')
    return {
      distanceKm: Math.round((distanceMeters / 1000) * 100) / 100,
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      geometry: route?.polyline?.encodedPolyline,
    }
  }

  async eta(origin: Coordinates, destination: Coordinates): Promise<number> {
    return (await this.route(origin, destination)).durationMinutes
  }
}

export const googleMapsProvider = new GoogleMapsProvider()
