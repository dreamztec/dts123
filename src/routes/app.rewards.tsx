import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/app/rewards')({ component: () => <GenericWorkspace kind="customer" title="Dreamz Rewards" subtitle="Earn, track and redeem configured benefits"/> })
