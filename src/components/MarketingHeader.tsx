import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { BrandMark } from './BrandMark'

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  return <header className="marketing-header"><div className="container header-inner"><BrandMark /><nav className={open ? 'open' : ''} aria-label="Primary navigation"><Link to="/services">Services</Link><Link to="/membership">Membership</Link><Link to="/corporate">Corporate</Link><Link to="/safety">Safety</Link><Link to="/about">About</Link></nav><div className="header-actions"><Link to="/login" className="login-link">Log in</Link><Link to="/app/book" className="button button-small">Book a ride</Link><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button></div></div></header>
}
