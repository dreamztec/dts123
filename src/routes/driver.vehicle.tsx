import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/driver/vehicle')({ component: () => <GenericWorkspace kind="driver" title="Assigned vehicle" subtitle="Documents, status and operational checks"/> })
