import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/admin/corporates')({ component: () => <GenericWorkspace kind="admin" title="Corporate accounts" subtitle="Contracts, credit, pricing and service rules"/> })
