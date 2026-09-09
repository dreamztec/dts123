import { Link } from '@tanstack/react-router'

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="Dreamz Transportz Servicez home"><span className="brand-monogram">D<span>T</span>S</span>{!compact && <span className="brand-copy"><strong>Dreamz Transportz</strong><small>Servicez · Fast Ride</small></span>}</Link>
}
