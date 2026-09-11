import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarClock, CarFront, MapPin, Plane, Users, Sparkles } from 'lucide-react'
import { AppShell } from './AppShell'
import { EmptyState } from './EmptyState'
import { useApi } from '@/lib/api-client'

type Overview = { active:{ planName:string } | null; upcoming:Array<{ id:string; reference:string; status:string; pickup:{label:string}; destination:{label:string} }> }

export function CustomerDashboard() {
  const [available, setAvailable] = useState(false)
  const [locationState, setLocationState] = useState('Not included in matching')
  const { data } = useApi<Overview>('/api/customer/overview')
  const membershipName = data?.active?.planName ?? 'Not subscribed yet'
  const upcoming = data?.upcoming ?? []
  function toggleAvailability() {
    if (available) { setAvailable(false); setLocationState('Not included in matching'); return }
    if (!navigator.geolocation) { setLocationState('Location is not supported on this device'); return }
    setLocationState('Requesting location permission…')
    navigator.geolocation.getCurrentPosition(() => { setAvailable(true); setLocationState('Permission granted · awaiting eligible zone and route lookup') },() => setLocationState('Location permission was not granted'),{enableHighAccuracy:true,maximumAge:15_000,timeout:10_000})
  }
  return <AppShell kind="customer" title="My mobility" subtitle="FASTRIDES · Your dream destination...on time.">
    <div className="dashboard-hero"><section className="welcome-card"><p>Welcome</p><h2>Where can we take you today?</h2><p>Book now, schedule ahead or arrange a journey for someone else.</p><Link to="/app/book" className="button button-primary">Book a ride <ArrowRight size={16}/></Link></section><section className="membership-summary"><p className="overline">Current membership</p><h3>{membershipName}</h3><p>{data?.active ? 'Renewal details appear once subscription billing is connected.' : 'Membership pricing is configured by FASTRIDES operations. Requests are recorded once you subscribe.'}</p><div className="credit-row"><span>Ride credits<strong>0 available</strong></span><span>Wallet<strong>₦0.00</strong></span></div></section></div>
    <div className="quick-grid">{[[CalendarClock,'Schedule ride','Plan ahead'],[Plane,'Airport transfer','Flight-ready flow'],[Users,'Book for someone','Family or guest'],[Sparkles,'Chauffeur service','By the hour']].map(([Icon,title,text]) => <Link to="/app/book" className="quick-card" key={String(title)}><Icon size={20}/><strong>{String(title)}</strong><small>{String(text)}</small></Link>)}</div>
    <div className="content-grid"><section className="panel"><div className="panel-head"><h3>Upcoming</h3><Link to="/app/trips">View all</Link></div>{upcoming.length === 0 ? <EmptyState icon={CarFront} title="No upcoming bookings." body="Scheduled and confirmed journeys appear here." action={<Link className="button button-primary" to="/app/book">Book a ride</Link>}/> : upcoming.map((booking) => <div className="trip-row" key={booking.id}><span className="trip-icon"><CarFront size={16}/></span><div><strong>{booking.pickup?.label} → {booking.destination?.label}</strong><small>{booking.reference}</small></div><span>{booking.status}</span></div>)}</section><section className="availability-panel"><Users size={22}/><h3>Availability Mode</h3><p>Join controlled shared-ride matching at supported pickup points. Location is used only with your permission while active.</p><div className="toggle-row"><span>{available ? 'Available for matching' : 'Currently off'}</span><button className={`switch ${available ? 'on' : ''}`} onClick={toggleAvailability} aria-label="Toggle Availability Mode" /></div><div className="integration-state"><MapPin size={13}/>{locationState}</div></section></div>
  </AppShell>
}