import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/fleet/vehicles')({ component: () => <GenericWorkspace kind="fleet" title="Vehicles" subtitle="Classes, assignments, compliance and profitability"/> })
