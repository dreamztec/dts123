import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/corporate/riders')({ component: () => <GenericWorkspace kind="corporate" title="Riders & departments" subtitle="Employees, roles, limits and authorisations"/> })
