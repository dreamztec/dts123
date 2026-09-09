import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/corporate/bookings')({ component: () => <GenericWorkspace kind="corporate" title="Corporate bookings" subtitle="Approvals, recurring transport and executive journeys"/> })
