// Browser-only Google Maps loader. Uses the public browser key exclusively; the server
// routing key is never referenced here and is not available to client bundles.
export const browserMapsKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY as string | undefined

let loadPromise: Promise<void> | null = null

export function googleMapsConfigured() { return Boolean(browserMapsKey) }

/** Injects the Google Maps JS API once and resolves when `google.maps` is ready. */
export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Google Maps is browser only'))
  if (!browserMapsKey) return Promise.reject(new Error('Google Maps browser key is not configured'))
  if ((window as any).google?.maps?.importLibrary) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const params = new URLSearchParams({ key: browserMapsKey, v: 'weekly', loading: 'async', libraries: 'places', language: 'en', region: 'NG' })
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => { loadPromise = null; reject(new Error('Google Maps failed to load')) }
    document.head.appendChild(script)
  })
  return loadPromise
}

export type PlaceSuggestion = { placeId: string; primary: string; secondary: string; full: string }

/** Places API (New) autocomplete, biased to Nigeria. */
export async function fetchPlaceSuggestions(query: string, sessionToken?: unknown): Promise<PlaceSuggestion[]> {
  await loadGoogleMaps()
  const places = await (window as any).google.maps.importLibrary('places')
  const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: query,
    includedRegionCodes: ['ng'],
    language: 'en',
    sessionToken,
  })
  return (suggestions ?? [])
    .map((suggestion: any) => suggestion.placePrediction)
    .filter(Boolean)
    .map((prediction: any) => ({
      placeId: prediction.placeId,
      primary: prediction.mainText?.toString?.() ?? prediction.text?.toString?.() ?? '',
      secondary: prediction.secondaryText?.toString?.() ?? '',
      full: prediction.text?.toString?.() ?? '',
    }))
    .filter((item: PlaceSuggestion) => item.placeId && item.full)
}

/** A fresh session token groups keystrokes into one billable autocomplete session. */
export async function createSessionToken() {
  await loadGoogleMaps()
  const places = await (window as any).google.maps.importLibrary('places')
  return new places.AutocompleteSessionToken()
}
