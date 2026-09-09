import { createFileRoute } from '@tanstack/react-router'
import { FleetDashboard } from '@/components/DashboardViews'
export const Route = createFileRoute('/fleet')({ component: FleetDashboard })
