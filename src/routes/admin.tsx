import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboard } from '@/components/DashboardViews'
export const Route = createFileRoute('/admin')({ component: AdminDashboard })
