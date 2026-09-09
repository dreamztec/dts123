import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/app/wallet')({ component: () => <GenericWorkspace kind="customer" title="Wallet" subtitle="Cash, promotional, membership and reward balances stay separate"/> })
