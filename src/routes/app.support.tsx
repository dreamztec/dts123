import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/app/support')({ component: () => <GenericWorkspace kind="customer" title="Support centre" subtitle="Bookings, payments, lost items and safety support"/> })
