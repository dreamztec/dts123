import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
import { PublicPage } from '@/components/PublicPage'
import { Settings } from 'lucide-react'

export const Route = createFileRoute('/$')({ component: CatchAllModule })
function CatchAllModule() {
  const pathname=useRouterState({select:(state)=>state.location.pathname}); const title=pathname.split('/').filter(Boolean).pop()?.replaceAll('-',' ') ?? 'Page'
  if (pathname.startsWith('/app/')) return <GenericWorkspace kind="customer" title={title} subtitle="This FASTRIDES screen is being finalised."/>
  if (pathname.startsWith('/driver/')) return <GenericWorkspace kind="driver" title={title} subtitle="This chauffeur screen is being finalised."/>
  if (pathname.startsWith('/fleet/')) return <GenericWorkspace kind="fleet" title={title} subtitle="This fleet screen is being finalised."/>
  if (pathname.startsWith('/corporate/')) return <GenericWorkspace kind="corporate" title={title} subtitle="This corporate screen is being finalised."/>
  if (pathname.startsWith('/admin/')) return <GenericWorkspace kind="admin" title={title} subtitle="This operations screen is being finalised."/>
  return <PublicPage eyebrow="FASTRIDES" title={title} intro="This FASTRIDES page is coming soon. In the meantime, book a ride, explore membership or contact our team." icon={Settings} cards={[{title:'On-demand rides',text:'Book an immediate, professionally managed journey in minutes.'},{title:'Membership',text:'Priority, credits and personalised support for frequent travellers.'},{title:'Human support',text:'Real people help with bookings, payments and safety.'}]}/>
}