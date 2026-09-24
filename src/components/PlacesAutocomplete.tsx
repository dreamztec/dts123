import { useEffect, useId, useRef, useState } from 'react'
import { createSessionToken, fetchPlaceSuggestions, googleMapsConfigured, type PlaceSuggestion } from '@/services/google-maps-browser'

export type PlaceValue = { text: string; placeId: string | null }

/**
 * FROM / TO field backed by Google Places API (New). The selected place's ID is retained so the
 * server can verify its coordinates, rather than relying on the typed text alone.
 */
export function PlacesAutocomplete({ label, value, onChange, placeholder, required }: {
  label: string
  value: PlaceValue
  onChange: (next: PlaceValue) => void
  placeholder: string
  required?: boolean
}) {
  const inputId = useId()
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [lookupFailed, setLookupFailed] = useState(false)
  const sessionToken = useRef<unknown>(null)
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [])

  useEffect(() => {
    const query = value.text.trim()
    // A confirmed selection needs no further lookup.
    if (value.placeId || query.length < 3 || !googleMapsConfigured()) { setSuggestions([]); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        sessionToken.current ??= await createSessionToken()
        const results = await fetchPlaceSuggestions(query, sessionToken.current)
        if (cancelled) return
        setSuggestions(results)
        setOpen(results.length > 0)
        setLookupFailed(false)
      } catch {
        if (cancelled) return
        setSuggestions([])
        setLookupFailed(true)
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [value.text, value.placeId])

  function select(suggestion: PlaceSuggestion) {
    onChange({ text: suggestion.full, placeId: suggestion.placeId })
    setSuggestions([])
    setOpen(false)
    sessionToken.current = null
  }

  return <div className="field full places-field" ref={wrapper}>
    <label htmlFor={inputId}>{label}</label>
    <input
      id={inputId}
      value={value.text}
      required={required}
      placeholder={placeholder}
      autoComplete="off"
      onChange={(event) => onChange({ text: event.target.value, placeId: null })}
      onFocus={() => setOpen(suggestions.length > 0)}
      onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}
    />
    {open && suggestions.length > 0 && <ul className="places-list" role="listbox">
      {suggestions.map((suggestion) => <li key={suggestion.placeId}>
        <button type="button" onClick={() => select(suggestion)}>
          <strong>{suggestion.primary}</strong>
          {suggestion.secondary && <span>{suggestion.secondary}</span>}
        </button>
      </li>)}
    </ul>}
    {lookupFailed && <small className="places-hint">Address suggestions are unavailable right now. Type the full address and we will look it up.</small>}
    {!googleMapsConfigured() && <small className="places-hint">Type the full address and we will look it up.</small>}
  </div>
}
