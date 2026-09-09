import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/corporate/policies')({ component: () => <GenericWorkspace kind="corporate" title="Travel policies" subtitle="Budgets, classes, approvals and route rules"/> })
