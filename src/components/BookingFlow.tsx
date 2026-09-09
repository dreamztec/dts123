import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AppShell } from './AppShell'
import { PlacesAutocomplete, type PlaceValue } from './PlacesAutocomplete'
import { createBooking, formatNaira, requestEstimate, type EstimateSuccess } from '@/lib/estimate-client'
import { ROUTE_UNAVAILABLE_MESSAGE } from '@/lib/route-messages'

const serviceClasses = [
  { code:'CITY', label:'FASTRIDES City' },
  { code:'PREMIUM', label:'FASTRIDES Premium' },
  { code:'SUV', label:'FASTRIDES Executive SUV' },
  { code:'LUXURY', label:'FASTRIDES Luxury' },
  { code:'BUS', label:'FASTRIDES Executive Bus' },
  { code:'CHAUFFEUR', label:'Chauffeur' },
] as const

const emptyPlace: PlaceValue = { text:'', placeId:null }

function formatDuration(minutes:number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes/60)
  const rest = minutes%60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

export function BookingFlow() {
  const navigate = useNavigate()
  const [origin, setOrigin] = useState<PlaceValue>(emptyPlace)
  const [destination, setDestination] = useState<PlaceValue>(emptyPlace)
  const [cityName, setCityName] = useState('Abuja')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [vehicleClassCode, setVehicleClassCode] = useState<string>('CITY')
  const [estimate, setEstimate] = useState<EstimateSuccess | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

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
      cityName,
      vehicleClassCode,
      passengerCount: passengers,
      scheduledAt: scheduledAtIso(),
    })
    setLoading(false)
    if (result.available) setEstimate(result)
    else setError(result.error || ROUTE_UNAVAILABLE_MESSAGE)
  }

  async function bookNow() {
    if (!estimate) { setError('Get a fare estimate first so you can see the route and price before booking.'); return }
    setBookingLoading(true)
    setError('')
    const journey = {
      origin: origin.placeId ? { placeId:origin.placeId } : { address:origin.text.trim() },
      destination: destination.placeId ? { placeId:destination.placeId } : { address:destination.text.trim() },
      cityName,
      vehicleClassCode,
      passengerCount: passengers,
      scheduledAt: scheduledAtIso(),
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
  return <AppShell kind="customer" title="Book a ride" subtitle="Your dream destination...on time.">
    <div className="booking-layout">
      <form className="booking-card" onSubmit={getEstimate}>
        <h2>Plan your journey</h2>
        <p>Choose your pickup and destination and we will measure the road route before quoting a fare.</p>
        <div className="form-grid">
          <PlacesAutocomplete label="From" value={origin} onChange={updateOrigin} placeholder="Enter pickup address" required />
          <PlacesAutocomplete label="To" value={destination} onChange={updateDestination} placeholder="Enter destination address" required />
          <div className="field"><label htmlFor="city">City</label>
            <select id="city" value={cityName} onChange={(event) => { setCityName(event.target.value); setEstimate(null) }}>
              <option value="Abuja">Abuja</option><option value="Lagos">Lagos</option>
            </select></div>
          <div className="field"><label htmlFor="vehicle">Vehicle / service</label>
            <select id="vehicle" value={vehicleClassCode} onChange={(event) => { setVehicleClassCode(event.target.value); setEstimate(null) }}>
              {serviceClasses.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select></div>
          <div className="field"><label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setEstimate(null) }} /></div>
          <div className="field"><label htmlFor="time">Time</label>
            <input id="time" type="time" value={time} onChange={(event) => { setTime(event.target.value); setEstimate(null) }} /></div>
          <div className="field"><label htmlFor="passengers">Passengers</label>
            <input id="passengers" type="number" min="1" max="14" value={passengers}
              onChange={(event) => { setPassengers(Math.max(1, Number(event.target.value) || 1)); setEstimate(null) }} /></div>
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
          <div className="summary-row"><span>Vehicle</span><strong>{estimate.vehicleClass.name}</strong></div>
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
