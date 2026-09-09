import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/admin/vehicles')({ component: () => <GenericWorkspace kind="admin" title="Vehicles" subtitle="Fleet status, assignment and compliance"/> })
