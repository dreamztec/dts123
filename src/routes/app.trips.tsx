import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/app/trips')({ component: () => <GenericWorkspace kind="customer" title="My trips" subtitle="Upcoming, active and completed journeys"/> })
