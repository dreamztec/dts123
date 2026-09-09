import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/driver/trips')({ component: () => <GenericWorkspace kind="driver" title="Assigned trips" subtitle="Today’s managed chauffeur assignments"/> })
