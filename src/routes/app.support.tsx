import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { useApi } from '@/lib/api-client'
import { CircleHelp, LifeBuoy } from 'lucide-react'

export const Route = createFileRoute('/app/support')({ component: SupportCentre })

type FeedbackPayload = { feedback: Array<{ id:string; kind:string; rating:number|null; comment:string|null; status:string; createdAt:string }> }

const supportCategories = [
  { kind:'FEEDBACK' as const, label:'Feedback or a question' },
  { kind:'COMPLAINT' as const, label:'A complaint' },
]

function SupportCentre() {
  const { data, loading } = useApi<FeedbackPayload>('/api/feedback')
  const [kind, setKind] = useState<'FEEDBACK' | 'COMPLAINT'>('FEEDBACK')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true); setStatus('')
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ kind, comment: comment.trim() || undefined, rating: rating || undefined }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Could not submit your message')
      setStatus('Received. Our support team reviews every message and responds in this thread.')
      setComment(''); setRating(0)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not submit your message')
    } finally { setSubmitting(false) }
  }

  const history = data?.feedback ?? []
  return <AppShell kind="customer" title="Support centre" subtitle="Bookings, payments, lost items and safety support">
    <div className="content-grid">
      <section className="panel"><div className="panel-head"><h3>Send us a message</h3></div>
        <form className="account-form" onSubmit={submit}>
          <div className="field"><label htmlFor="support-kind">What is this about?</label>
            <select id="support-kind" value={kind} onChange={(event) => setKind(event.target.value as 'FEEDBACK' | 'COMPLAINT')}>
              {supportCategories.map((category) => <option key={category.kind} value={category.kind}>{category.label}</option>)}
            </select></div>
          {kind === 'FEEDBACK' && <div className="field"><label>Rate your experience</label>
            <div className="rating-row" role="radiogroup" aria-label="Rating">
              {[1,2,3,4,5].map((value) => <button type="button" key={value} className={rating >= value ? 'on' : ''} onClick={() => setRating(value)} aria-label={`${value} star${value > 1 ? 's' : ''}`}>★</button>)}
            </div></div>}
          <div className="field"><label htmlFor="support-comment">Tell us more</label><textarea id="support-comment" rows={5} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Describe what happened, including the trip reference if you have it." /></div>
          {status && <p className="notice" role="status">{status}</p>}
          <button className="button button-primary" disabled={submitting || (!comment.trim() && !rating)}>{submitting ? 'Sending…' : 'Send message'}</button>
        </form>
      </section>
      <section className="panel"><div className="panel-head"><h3>Your messages</h3></div>
        {loading ? <p className="notice" style={{ padding:20 }}>Loading your messages…</p>
          : history.length === 0
            ? <EmptyState icon={LifeBuoy} title="No messages yet." body="Ratings, questions and complaints you send appear here with their status."/>
            : history.map((item) => <div className="trip-row" key={item.id}><span className="trip-icon"><CircleHelp size={15}/></span><div><strong>{item.kind === 'COMPLAINT' ? 'Complaint' : item.kind === 'TRIP_RATING' ? 'Trip rating' : 'Feedback'}{item.rating ? ` · ${item.rating}★` : ''}</strong><small>{item.comment ?? 'No comment'} · {new Date(item.createdAt).toLocaleString('en-NG')}</small></div><span>{item.status}</span></div>)}
      </section>
    </div>
    <section className="panel" style={{ marginTop:20 }}><div className="panel-head"><h3>Other ways to get help</h3></div>
      <div className="trip-row"><span className="trip-icon"><CircleHelp size={15}/></span><div><strong>Safety emergencies</strong><small>If you are in immediate danger, contact emergency services first, then raise an SOS from the Safety page.</small></div><Link to="/safety" style={{ color:'#651F2B', fontWeight:700, fontSize:10 }}>Safety</Link></div>
      <div className="trip-row"><span className="trip-icon"><CircleHelp size={15}/></span><div><strong>Public contact page</strong><small>Reach the right FASTRIDES team for customer, corporate or safety support.</small></div><Link to="/contact" style={{ color:'#651F2B', fontWeight:700, fontSize:10 }}>Contact</Link></div>
    </section>
  </AppShell>
}