import { useState, type FormEvent } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { AppShell } from './AppShell'
import { PlacesAutocomplete, type PlaceValue } from './PlacesAutocomplete'
import { createBooking, formatNaira, requestEstimate, type EstimateSuccess } from '@/lib/estimate-client'
import { ROUTE_UNAVAILABLE_MESSAGE } from '@/lib/route-messages'
import { useApi } from '@/lib/api-client'

type ConfigPayload = {
  cities: Array<{ id:string; name:string; active:boolean }>
  vehicleClasses: Array<{ id:string; code:string; name:string; passengerCapacity:number; active:boolean }>
}

const emptyPlace: PlaceValue = { text:'', placeId:null }

function formatDuration(minutes:number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes/60)
  const rest = minutes%60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

const relationships = [
  { value:'SELF', label:'Myself' },
  { value:'FAMILY', label:'Family member' },
  { value:'FRIEND', label:'Friend' },
  { value:'GUEST', label:'Guest' },
  { value:'CLIENT', label:'Client' },
  { value:'EMPLOYEE', label:'Colleague / employee' },
] as const

export function BookingFlow() {
  const navigate = useNavigate()
  const search = useRouterState({ select: (state) => (state.location.search ?? {}) as Record<string, string | undefined> })
  const { data: config } = useApi<ConfigPayload>('/api/config')
  const cities = (config?.cities ?? []).filter((city) => city.active)
  const classes = (config?.vehicleClasses ?? []).filter((entry) => entry.active && entry.code !== 'EV')
  const forSomeone = search.for === '1'

  const [origin, setOrigin] = useState<PlaceValue>(emptyPlace)
  const [destination, setDestination] = useState<PlaceValue>(emptyPlace)
  const [cityName, setCityName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [vehicleClassCode, setVehicleClassCode] = useState('')
  const [relationship, setRelationship] = useState<typeof relationships[number]['value']>(forSomeone ? 'FAMILY' : 'SELF')
  const [passengerName, setPassengerName] = useState('')
  const [passengerPhone, setPassengerPhone] = useState('')
  const [estimate, setEstimate] = useState<EstimateSuccess | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  const effectiveCity = cityName || cities[0]?.name || 'Abuja'
  const effectiveClass = vehicleClassCode || classes[0]?.code || 'CITY'

  // Any change to the journey invalidates a previously measured route.
  function updateOrigin(next:PlaceValue) { setOrigin(next); setEstimate(null) }
  function updateDestination(next:PlaceValue) { setDestination(next); setEstimate(null) }

  function scheduledAtIso() {
    if (!date) return undefined
    const composed = new Date(`${date}T${time || '00:00'}`)
    return Number.isNaN(composed.getTime()) ? undefined : composed.toISOString()
  }

  async function getEstimate(event?:FormEvent) {
    event?.preventDefault()
    setError('')
    if (!origin.text.trim() || !destination.text.trim()) { setError('Enter both a pickup and a destination.'); return }
    setLoading(true)
    setEstimate(null)
    const result = await requestEstimate({
      origin: origin.placeId ? { placeId:origin.placeId } : { address:origin.text.trim() },
      destination: destination.placeId ? { placeId:destination.placeId } : { address:destination.text.trim() },
      cityName: effectiveCity,
      vehicleClassCode: effectiveClass,
      passengerCount: passengers,
      scheduledAt: scheduledAtIso(),
    })
    setLoading(false)
    if (result.available) setEstimate(result)
    else setError(result.error || ROUTE_UNAVAILABLE_MESSAGE)
  }

  async function bookNow() {
    if (!estimate) { setError('Get a fare estimate first so you can see the route and price before booking.'); return }
    if (relationship !== 'SELF' && (passengerName.trim().length < 2 || passengerPhone.trim().length < 7)) {
      setError('Add the passenger\u2019s name and phone number so we know who to pick up.'); return
    }
    setBookingLoading(true)
    setError('')
    const journey = {
      origin: origin.placeId ? { placeId:origin.placeId } : { address:origin.text.trim() },
      destination: destination.placeId ? { placeId:destination.placeId } : { address:destination.text.trim() },
      cityName: effectiveCity,
      vehicleClassCode: effectiveClass,
      passengerCount: passengers,
      scheduledAt: scheduledAtIso(),
      relationship,
      ...(relationship !== 'SELF' ? { passengerName:passengerName.trim(), passengerPhone:passengerPhone.trim() } : {}),
    }
    const result = await createBooking(journey)
    setBookingLoading(false)
    if (!result.ok) { setError(result.error); return }
    // Keep a local copy of the confirmed journey for the confirmation screen.
    sessionStorage.setItem('fastrides.lastBooking', JSON.stringify({
      reference: result.booking.reference,
      status: result.booking.status,
      route: estimate.route, pricing: estimate.pricing, vehicleClass: estimate.vehicleClass,
      origin: estimate.origin, destination: estimate.destination,
      scheduledAt: result.booking.scheduledAt, createdAt: result.booking.createdAt,
      passengers,
    }))
    navigate({ to:'/app/trips' })
  }

  const fare = estimate?.pricing
  const vehicleName = estimate?.vehicleClass.name ?? classes.find((entry) => entry.code === effectiveClass)?.name ?? 'Selected class'
  return <AppShell kind="customer" title="Book a ride" subtitle="Your dream destination...on time.">
    <div className="booking-layout">
      <form className="booking-card" onSubmit={getEstimate}>
        <h2>Plan your journey</h2>
        <p>Choose your pickup and destination and we will measure the real road route before quoting a fare.</p>
        <div className="form-grid">
          <PlacesAutocomplete label="From" value={origin} onChange={updateOrigin} placeholder="Enter pickup address" required />
          <PlacesAutocomplete label="To" value={destination} onChange={updateDestination} placeholder="Enter destination address" required />
          <div className="field"><label htmlFor="city">City</label>
            <select id="city" value={effectiveCity} onChange={(event) => { setCityName(event.target.value); setEstimate(null) }}>
              {cities.length === 0 && <option value="Abuja">Abuja</option>}
              {cities.map((city) => <option key={city.id} value={city.name}>{city.name}</option>)}
            </select></div>
          <div className="field"><label htmlFor="vehicle">Vehicle / service</label>
            <select id="vehicle" value={effectiveClass} onChange={(event) => { setVehicleClassCode(event.target.value); setEstimate(null) }}>
              {classes.map((entry) => <option key={entry.id} value={entry.code}>{entry.name}</option>)}
            </select></div>
          <div className="field"><label htmlFor="date">Date (optional — leave blank for now)</label>
            <input id="date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setEstimate(null) }} /></div>
          <div className="field"><label htmlFor="time">Time</label>
            <input id="time" type="time" value={time} onChange={(event) => { setTime(event.target.value); setEstimate(null) }} /></div>
          <div className="field"><label htmlFor="passengers">Passengers</label>
            <input id="passengers" type="number" min="1" max="14" value={passengers}
              onChange={(event) => { setPassengers(Math.max(1, Number(event.target.value) || 1)); setEstimate(null) }} /></div>
          <div className="field"><label htmlFor="relationship">Who is travelling?</label>
            <select id="relationship" value={relationship} onChange={(event) => { setRelationship(event.target.value as typeof relationship); setEstimate(null) }}>
              {relationships.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
            </select></div>
          {relationship !== 'SELF' && <>
            <div className="field"><label htmlFor="passengerName">Passenger name</label>
              <input id="passengerName" value={passengerName} onChange={(event) => setPassengerName(event.target.value)} placeholder="Who are we picking up?" /></div>
            <div className="field"><label htmlFor="passengerPhone">Passenger phone</label>
              <input id="passengerPhone" value={passengerPhone} onChange={(event) => setPassengerPhone(event.target.value)} placeholder="So the chauffeur can reach them" /></div>
          </>}
        </div>
        {error && <p className="notice" role="alert">{error}</p>}
        <div className="hero-actions" style={{marginTop:18}}>
          <button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Measuring route…' : 'Get estimate'}</button>
          <button className="button button-outline" type="button" onClick={bookNow} disabled={loading || bookingLoading}>{bookingLoading ? 'Booking…' : 'Book now'}</button>
        </div>
      </form>

      <aside className="booking-summary">
        <h3>Journey summary</h3>
        {!estimate && <>
          <div className="summary-row"><span>Distance</span><strong>—</strong></div>
          <div className="summary-row"><span>Estimated time</span><strong>—</strong></div>
          <div className="summary-total"><small>Estimated fare</small><strong>Calculated by route</strong></div>
          <p className="notice">Enter your pickup and destination, then choose Get estimate.</p>
        </>}
        {estimate && <>
          <div className="summary-row"><span>Distance</span><strong>{estimate.route.distanceKm} km</strong></div>
          <div className="summary-row"><span>Estimated driving time</span><strong>{formatDuration(estimate.route.durationMinutes)}</strong></div>
          <div className="summary-row"><span>Estimated arrival</span><strong>{new Date(estimate.route.etaIso).toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'})}</strong></div>
          <div className="summary-row"><span>Vehicle</span><strong>{vehicleName}</strong></div>
          {fare?.connected && fare.estimate !== null ? <>
            <ul className="fare-lines">
              {fare.breakdown.map((line, index) => <li key={`${line.label}-${index}`}>
                <span>{line.label}{line.detail && <small>{line.detail}</small>}</span>
                <strong>{formatNaira(line.amount)}</strong>
              </li>)}
            </ul>
            <div className="summary-total"><small>{fare.fixed ? 'Fare' : 'Estimated fare'}</small><strong>{formatNaira(fare.estimate)}</strong></div>
            {fare.disclaimer && <p className="estimate-note">{fare.disclaimer}</p>}
          </> : <p className="notice" role="status">Fare pricing is not available for this journey yet.</p>}
        </>}
      </aside>
    </div>
  </AppShell>
}