import { Link } from '@tanstack/react-router'

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="FASTRIDES home"><img src="/logo-192.png" alt="FASTRIDES logo" width={compact ? 30 : 40} height={30} className="brand-logo" />{!compact && <span className="brand-copy"><strong>FASTRIDES</strong><small>Your dream destination...on time.</small></span>}</Link>
}