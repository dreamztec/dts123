import { IntegrationNotConnectedError } from '../../../src/services/adapters'

export type RouteMeasure = { distanceKm:number; durationMinutes:number; source:'GOOGLE_ROUTES'; measuredAt:string }

const apiKey = () => Netlify.env.get('GOOGLE_MAPS_ROUTES_API_KEY')

export function routingConfigured() { return Boolean(apiKey()) }

export async function measureRoute(origin:{ latitude:number; longitude:number }, destination:{ latitude:number; longitude:number }): Promise<RouteMeasure> {
  const key = apiKey()
  if (!key) throw new IntegrationNotConnectedError('Google Routes')
  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{
    method:'POST',
    headers:{ 'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.distanceMeters,routes.duration' },
    body:JSON.stringify({ origin:{ location:{ latLng:{ latitude:origin.latitude, longitude:origin.longitude } } }, destination:{ location:{ latLng:{ latitude:destination.latitude, longitude:destination.longitude } } }, travelMode:'DRIVE', routingPreference:'TRAFFIC_AWARE' }),
  })
  if (!response.ok) throw new Error(`Route measurement failed (${response.status})`)
  const payload = await response.json() as { routes?:Array<{ distanceMeters?:number; duration?:string }> }
  const route = payload.routes?.[0]
  if (!route?.distanceMeters || !route.duration) throw new Error('Route measurement returned no usable route')
  return { distanceKm:Math.round(route.distanceMeters/100) / 10, durationMinutes:Math.round(Number(route.duration.replace('s',''))/60), source:'GOOGLE_ROUTES', measuredAt:new Date().toISOString() }
}

export async function geocodeAddress(query:string): Promise<Array<{ label:string; address:string; latitude:number; longitude:number }>> {
  const key = apiKey()
  if (!key) throw new IntegrationNotConnectedError('Google Maps geocoding')
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`)
  if (!response.ok) throw new Error('Geocoding request failed')
  const payload = await response.json() as { results?:Array<{ formatted_address:string; geometry:{ location:{ lat:number; lng:number } } }> }
  return (payload.results ?? []).slice(0,5).map((result) => ({ label:result.formatted_address, address:result.formatted_address, latitude:result.geometry.location.lat, longitude:result.geometry.location.lng }))
}