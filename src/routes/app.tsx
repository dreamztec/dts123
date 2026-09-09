import { createFileRoute } from '@tanstack/react-router'
import { CustomerDashboard } from '@/components/DashboardViews'
export const Route = createFileRoute('/app')({ component: CustomerDashboard })
