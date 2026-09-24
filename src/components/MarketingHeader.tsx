import { useState, useEffect } from 'react'
import { useRouterState, Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { BrandMark } from './BrandMark'

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  useEffect(() => { setOpen(false) }, [pathname])
  return <header className="marketing-header"><div className="container header-inner"><BrandMark /><nav className={open ? 'open' : ''} aria-label="Primary navigation">
    <Link to="/services">Services</Link>
    <Link to="/membership">Membership</Link>
    <Link to="/corporate">Corporate</Link>
    <Link to="/safety">Safety</Link>
    <Link to="/about">About</Link>
    <Link to="/contact" className="nav-mobile-only">Contact</Link>
    <Link to="/login" className="nav-mobile-only">Log in</Link>
  </nav><div className="header-actions"><Link to="/login" className="login-link">Log in</Link><Link to="/app/book" className="button button-small">Book a ride</Link><button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button></div></div></header>
}