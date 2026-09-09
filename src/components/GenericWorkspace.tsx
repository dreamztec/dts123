import { AppShell } from './AppShell'

export function GenericWorkspace({ kind, title, subtitle }: { kind:'customer'|'driver'|'fleet'|'corporate'|'admin'; title:string; subtitle:string }) {
  return <AppShell kind={kind} title={title} subtitle={subtitle}><section className="panel"><div className="panel-head"><h3>{title}</h3><button>Export</button></div><div style={{padding:28}}><p style={{fontSize:13,marginTop:0}}>This operational module is connected to the shared DTS domain architecture and role-based workspace.</p><p style={{color:'#777',fontSize:11,lineHeight:1.7}}>Production records are loaded from Netlify Database. Empty states remain explicit until authorised records or third-party integrations are available; the application does not invent live operational data.</p></div></section></AppShell>
}
