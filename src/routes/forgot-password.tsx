import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/components/AuthPage'
export const Route = createFileRoute('/forgot-password')({ component: () => <AuthPage mode="forgot"/> })
