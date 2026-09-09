import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/admin/incidents')({ component: () => <GenericWorkspace kind="admin" title="Safety incidents" subtitle="SOS, review, escalation and audit history"/> })
