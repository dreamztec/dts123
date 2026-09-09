import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/driver/safety')({ component: () => <GenericWorkspace kind="driver" title="Safety & SOS" subtitle="Incident and emergency escalation workflows"/> })
