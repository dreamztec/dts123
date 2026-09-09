import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/fleet/drivers')({ component: () => <GenericWorkspace kind="fleet" title="Chauffeurs" subtitle="Verification, training, availability and performance"/> })
