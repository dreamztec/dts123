import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/fleet/reports')({ component: () => <GenericWorkspace kind="fleet" title="Fleet reports" subtitle="Utilisation, cost and estimated contribution"/> })
