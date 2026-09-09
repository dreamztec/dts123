import { createFileRoute } from '@tanstack/react-router'
import { CorporateDashboard } from '@/components/DashboardViews'
export const Route = createFileRoute('/corporate')({ component: CorporateDashboard })
