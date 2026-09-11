import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
import { PublicPage } from '@/components/PublicPage'
import { Settings } from 'lucide-react'

export const Route = createFileRoute('/$')({ component: CatchAllModule })
function CatchAllModule() {
  const pathname=useRouterState({select:(state)=>state.location.pathname}); const title=pathname.split('/').filter(Boolean).pop()?.replaceAll('-',' ') ?? 'Page'
  if (pathname.startsWith('/app/')) return <GenericWorkspace kind="customer" title={title} subtitle="Customer mobility module"/>
  if (pathname.startsWith('/driver/')) return <GenericWorkspace kind="driver" title={title} subtitle="Chauffeur operations module"/>
  if (pathname.startsWith('/fleet/')) return <GenericWorkspace kind="fleet" title={title} subtitle="Fleet management module"/>
  if (pathname.startsWith('/corporate/')) return <GenericWorkspace kind="corporate" title={title} subtitle="Corporate mobility module"/>
  if (pathname.startsWith('/admin/')) return <GenericWorkspace kind="admin" title={title} subtitle="Configuration is permission-controlled and audit logged"/>
  return <PublicPage eyebrow="FASTRIDES" title={title} intro="This FASTRIDES page is part of the production route architecture and is ready for approved operational content." icon={Settings} cards={[{title:'Managed mobility',text:'Built around controlled service availability.'},{title:'Clear configuration',text:'Business rules remain editable without code.'},{title:'Human support',text:'Operational help stays part of the service.'}]}/>
}
