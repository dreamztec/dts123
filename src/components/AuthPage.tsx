import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AuthError, login, requestPasswordRecovery, signup } from '@netlify/identity'
import { BrandMark } from './BrandMark'

export function AuthPage({ mode }: { mode:'login'|'register'|'forgot' }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setStatus('')
    const data = new FormData(event.currentTarget); const email = String(data.get('email') ?? ''); const password = String(data.get('password') ?? ''); const name = String(data.get('name') ?? '')
    try {
      if (mode === 'login') { await login(email,password); await navigate({ to:'/app' }) }
      if (mode === 'register') { const user = await signup(email,password,{ full_name:name, role:'customer' }); setStatus(user.emailVerified ? 'Account created. Opening your mobility workspace…' : 'Account created. Check your email to verify your address.') }
      if (mode === 'forgot') { await requestPasswordRecovery(email); setStatus('If the account exists, a recovery message has been sent.') }
    } catch (error) { setStatus(error instanceof AuthError ? error.message : 'Authentication is not available in this environment. Deploy to Netlify with Identity enabled.') }
    finally { setLoading(false) }
  }
  const title = mode === 'login' ? 'Welcome back.' : mode === 'register' ? 'Join Dreamz.' : 'Reset your password.'
  return <main className="auth-page"><section className="auth-brand"><BrandMark/><h1>Your mobility service, ready around your life.</h1><p>Professional transport, membership benefits and clear trip management in one secure workspace.</p></section><section className="auth-panel"><div className="auth-card"><p className="eyebrow dark"><span/>DTS secure access</p><h2>{title}</h2><p>Netlify Identity provides the production authentication session. Phone OTP and passkeys use provider adapters when configured.</p><form className="auth-form" onSubmit={submit}>{mode === 'register' && <div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name"/></div>}<div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" required autoComplete="email"/></div>{mode !== 'forgot' && <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" minLength={8} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/></div>}{status && <div className="auth-message" role="status">{status}</div>}<button className="button button-primary button-wide" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Log in securely' : mode === 'register' ? 'Create account' : 'Send recovery email'}</button></form><p className="auth-footer">{mode === 'login' ? <>New to DTS? <Link to="/register">Create an account</Link> · <Link to="/forgot-password">Forgot password?</Link></> : <>Already a member? <Link to="/login">Log in</Link></>}</p></div></section></main>
}
