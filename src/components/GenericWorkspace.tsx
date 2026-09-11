import { AppShell } from './AppShell'
import { EmptyState } from './EmptyState'
import { CalendarX2 } from 'lucide-react'

export function GenericWorkspace({ kind, title, subtitle }: { kind:'customer'|'driver'|'fleet'|'corporate'|'admin'; title:string; subtitle:string }) {
  return <AppShell kind={kind} title={title} subtitle={subtitle}><section className="panel"><div className="panel-head"><h3>{title}</h3></div><EmptyState icon={CalendarX2} title="No records yet." body="Records load from the FASTRIDES database. Empty states stay explicit until real data is recorded — nothing is invented." /></section></AppShell>
}
