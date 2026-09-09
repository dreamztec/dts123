import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/driver/current-trip')({ component: () => <GenericWorkspace kind="driver" title="Current trip" subtitle="Location starts only during authorised operational states"/> })
