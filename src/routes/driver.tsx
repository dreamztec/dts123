import { createFileRoute } from '@tanstack/react-router'
import { DriverDashboard } from '@/components/DashboardViews'
export const Route = createFileRoute('/driver')({ component: DriverDashboard })