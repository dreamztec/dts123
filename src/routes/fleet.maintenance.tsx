import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/fleet/maintenance')({ component: () => <GenericWorkspace kind="fleet" title="Maintenance" subtitle="Service, repair, documents and expiry alerts"/> })
