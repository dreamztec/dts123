import type { LucideIcon } from 'lucide-react'
import { CalendarX2 } from 'lucide-react'

export function EmptyState({ icon: Icon = CalendarX2, title, body, action }: { icon?: LucideIcon; title: string; body?: string | false; action?: React.ReactNode }) {
  return <div className="empty-state"><Icon size={26} aria-hidden="true"/><strong>{title}</strong>{body ? <p>{body}</p> : null}{action}</div>
}