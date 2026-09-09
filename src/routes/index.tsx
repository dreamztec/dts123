import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CarFront,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Headphones,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { MarketingHeader } from '@/components/MarketingHeader'
import { membershipPlans, vehicleClasses } from '@/lib/domain'

export const Route = createFileRoute('/')({ component: HomePage })

const assurances = [
  ['Managed, not random', 'Every trip is coordinated through a professional mobility operation.'],
  ['Clear before you move', 'See service details, estimates, policies and trip progress in one place.'],
  ['Built around people', 'From everyday commutes to executive delegations, service stays personal.'],
]

const serviceCards = [
  { icon: Clock3, title: 'Fast Ride', text: 'Request an immediate ride from available, managed DTS capacity.' },
  { icon: CalendarClock, title: 'Scheduled journeys', text: 'Reserve ahead for meetings, recurring routes and important days.' },
  { icon: Plane, title: 'Airport transfers', text: 'Purpose-built arrival and departure bookings with luggage details.' },
  { icon: Building2, title: 'Corporate mobility', text: 'Policies, approvals, reporting and invoicing for organised teams.' },
]

function HomePage() {
  return (
    <main className="site-shell">
      <MarketingHeader />
      <section className="hero" id="top">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <div className="hero-copy reveal">
            <div className="eyebrow"><span /> Abuja · Lagos · Managed mobility</div>
            <p className="hero-kicker">DTS — FAST RIDE</p>
            <h1>Your destination deserves <em>better movement.</em></h1>
            <p className="hero-lede">Premium transportation for everyday journeys, executives, families, businesses, airports and special occasions.</p>
            <div className="hero-actions">
              <Link to="/app/book" className="button button-primary">Book a ride <ArrowRight size={18} /></Link>
              <Link to="/membership" className="button button-ghost">Join DTS</Link>
            </div>
            <div className="hero-trust">
              <span><ShieldCheck size={17} /> Professionally managed</span>
              <span><CircleCheck size={17} /> Transparent estimates</span>
              <span><Headphones size={17} /> Human support</span>
            </div>
          </div>

          <div className="hero-visual reveal delay-1" aria-label="DTS ride booking preview">
            <div className="route-card">
              <div className="route-card-top">
                <BrandMark compact />
                <span className="status-pill"><i /> Service ready</span>
              </div>
              <p className="overline">Where are you going?</p>
              <div className="location-row"><span className="location-dot pickup" /><div><small>Pickup</small><strong>Wuse 2, Abuja</strong></div></div>
              <div className="route-line" />
              <div className="location-row"><span className="location-dot destination" /><div><small>Destination</small><strong>Nnamdi Azikiwe Airport</strong></div></div>
              <div className="ride-options">
                <div className="ride-option selected"><CarFront /><span><strong>Premium Sedan</strong><small>Private · up to 3</small></span><b>Estimate</b></div>
                <div className="ride-option"><Users /><span><strong>DTS Shared</strong><small>Members · max 4</small></span><b>Eligible</b></div>
              </div>
              <Link to="/app/book" className="button button-primary button-wide">View ride options <ChevronRight size={18} /></Link>
              <p className="estimate-note">Fares shown during booking are estimates unless confirmed as fixed.</p>
            </div>
            <div className="floating-note"><ShieldCheck size={22} /><span><strong>Safety-led operations</strong>Trip identity, vehicle and status in one view.</span></div>
          </div>
        </div>
        <div className="container hero-footer"><span>YOUR DREAM DESTINATION... ON TIME</span><span className="scroll-line" /></div>
      </section>

      <section className="assurance-strip">
        <div className="container assurance-grid">
          {assurances.map(([title, text], index) => <article key={title}><b>0{index + 1}</b><div><h3>{title}</h3><p>{text}</p></div></article>)}
        </div>
      </section>

      <section className="section light-section" id="why-dreamz">
        <div className="container">
          <div className="section-heading split-heading"><div><p className="eyebrow dark"><span /> Why Dreamz</p><h2>Not just another ride app.</h2></div><p>You should not have to choose between accessible transportation and professional service. DTS combines controlled availability, accountable chauffeurs and thoughtful support.</p></div>
          <div className="service-grid">
            {serviceCards.map(({ icon: Icon, title, text }, index) => <article className="service-card" key={title}><span className="card-number">0{index + 1}</span><Icon size={28} /><h3>{title}</h3><p>{text}</p><Link to="/services">Explore service <ArrowRight size={15} /></Link></article>)}
          </div>
        </div>
      </section>

      <section className="section dark-section" id="membership">
        <div className="container">
          <div className="section-heading"><p className="eyebrow"><span /> Dreamz membership</p><h2>More than discounts.<br />A better way to move.</h2><p>Priority, predictability and personalised support — configured around how often and how importantly you travel.</p></div>
          <div className="membership-grid">
            {membershipPlans.map((plan, index) => <article className={`membership-card ${index === 2 ? 'featured' : ''}`} key={plan.name}>
              <div className="membership-top"><span>{plan.short}</span>{index === 2 && <b>Most considered</b>}</div>
              <h3>{plan.name}</h3><p>{plan.summary}</p>
              <ul>{plan.highlights.map((benefit) => <li key={benefit}><Check size={15} />{benefit}</li>)}</ul>
              <p className="config-note">Pricing and exact benefits are configured by DTS operations.</p>
              <Link to="/membership" className="text-link">Explore membership <ArrowRight size={15} /></Link>
            </article>)}
          </div>
        </div>
      </section>

      <section className="section light-section" id="fleet">
        <div className="container">
          <div className="section-heading split-heading"><div><p className="eyebrow dark"><span /> The right vehicle</p><h2>A class for every kind of day.</h2></div><p>Vehicle classes and city availability are managed dynamically. Your booking only shows options that operations can actually support.</p></div>
          <div className="vehicle-track">
            {vehicleClasses.slice(0, 5).map((vehicle, index) => <article className="vehicle-card" key={vehicle.name}><div className={`vehicle-silhouette vehicle-${index}`}><CarFront size={70} strokeWidth={1.1} /></div><span>{vehicle.code}</span><h3>{vehicle.name}</h3><p>{vehicle.description}</p><div><small>{vehicle.passengers} passengers</small><small>{vehicle.luggage} luggage</small></div></article>)}
          </div>
        </div>
      </section>

      <section className="shared-section" id="shared">
        <div className="container shared-grid">
          <div className="shared-orbit" aria-hidden="true"><div className="orbit-center">4</div>{[0,1,2,3].map((item) => <span className={`person p${item}`} key={item}><Users size={22} /></span>)}</div>
          <div className="shared-copy"><p className="eyebrow"><span /> Controlled member mobility</p><h2>Four people.<br />One sensible route.</h2><p>DTS Shared is not unrestricted public pooling. Eligible members activate Availability Mode at supported points, and the system only proposes matches that respect seats, route compatibility, time and operational rules.</p><div className="shared-rules"><span><Check /> Maximum 4 passengers</span><span><Check /> Controlled pickup zones</span><span><Check /> Privacy-protected manifest</span><span><Check /> Admin-defined eligibility</span></div><Link to="/app" className="button button-light">See Availability Mode <ArrowRight size={17} /></Link></div>
        </div>
      </section>

      <section className="section hospitality-section">
        <div className="container hospitality-grid">
          <div><p className="eyebrow dark"><span /> Made for important movement</p><h2>From a Tuesday commute to a delegation arrival.</h2></div>
          <div className="occasion-list">
            {['Airport arrivals & departures','Executive & chauffeur journeys','Corporate staff transportation','Weddings, conferences & events','Pre-booked interstate travel'].map((item, index) => <Link to="/services" key={item}><span>0{index+1}</span><strong>{item}</strong><ArrowRight /></Link>)}
          </div>
        </div>
      </section>

      <section className="section safety-section" id="safety">
        <div className="container safety-grid">
          <div className="safety-card"><ShieldCheck size={42} /><p className="overline">Operational safety layer</p><h3>Accountability at every stage.</h3><div className="timeline"><span className="done">Booked</span><span className="active">Driver assigned</span><span>Arrived</span><span>In trip</span></div><small>Live data appears only when integrations and authorised trip states are active.</small></div>
          <div className="safety-copy"><p className="eyebrow dark"><span /> Safety, without theatre</p><h2>Built into the operation — not added as a slogan.</h2><p>Identity checks, vehicle records, location permissions, trip timestamps, SOS workflows and incident review create a practical chain of accountability.</p><Link to="/safety" className="text-link dark-link">How DTS approaches safety <ArrowRight size={15} /></Link></div>
        </div>
      </section>

      <section className="cta-section"><div className="container cta-inner"><div><Sparkles size={28} /><p className="eyebrow"><span /> Ready when your day is</p><h2>Move people.<br />Manage mobility.<br /><em>Build trust.</em></h2></div><div><p>Book an individual journey, join the membership club or organise mobility for your entire company.</p><Link to="/app/book" className="button button-light">Book a ride <ArrowRight size={17} /></Link><Link to="/corporate" className="button button-outline">Corporate mobility</Link></div></div></section>

      <footer className="footer"><div className="container footer-grid"><div><BrandMark /><p>Premium managed mobility from Abuja and Lagos.</p><span className="footer-tagline">YOUR DREAM DESTINATION... ON TIME</span></div><div><h4>Services</h4><Link to="/chauffeur">Chauffeur</Link><Link to="/airport-transfers">Airport transfers</Link><Link to="/events">Events</Link><Link to="/interstate">Interstate</Link></div><div><h4>Company</h4><Link to="/about">About</Link><Link to="/safety">Safety</Link><Link to="/membership">Membership</Link><Link to="/contact">Contact</Link></div><div><h4>Legal</h4><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/cancellation-policy">Cancellation</Link><Link to="/faq">FAQ</Link></div></div><div className="container footer-bottom"><span>© 2026 Dreamz Transportz Servicez</span><span>F · Fast &nbsp; A · Available &nbsp; S · Safe &nbsp; T · Transparent</span></div></footer>
    </main>
  )
}
