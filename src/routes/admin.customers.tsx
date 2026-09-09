import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/admin/customers')({ component: () => <GenericWorkspace kind="admin" title="Customer CRM" subtitle="Profiles, value, preferences, support and segments"/> })
