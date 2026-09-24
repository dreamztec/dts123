import { AppShell } from './AppShell'
import { EmptyState } from './EmptyState'
import { Settings } from 'lucide-react'

export function GenericWorkspace({ kind, title, subtitle }: { kind:'customer'|'driver'|'fleet'|'corporate'|'admin'; title:string; subtitle:string }) {
  return <AppShell kind={kind} title={title} subtitle={subtitle}><section className="panel"><div className="panel-head"><h3>Coming soon</h3></div><EmptyState icon={Settings} title="Not yet available." body={subtitle ? `${subtitle.charAt(0).toUpperCase()}${subtitle.slice(1)} FASTRIDES is building this screen as part of the production roadmap.` : 'FASTRIDES is building this screen as part of the production roadmap.'} /></section></AppShell>
}