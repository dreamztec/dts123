import { createFileRoute } from '@tanstack/react-router'
import { CustomerDashboard } from '@/components/CustomerOverview'
export const Route = createFileRoute('/app')({ component: CustomerDashboard })
