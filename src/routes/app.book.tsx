import { createFileRoute } from '@tanstack/react-router'
import { BookingFlow } from '@/components/BookingFlow'
export const Route = createFileRoute('/app/book')({ component: BookingFlow })
