import { createFileRoute } from '@tanstack/react-router'
import { GenericWorkspace } from '@/components/GenericWorkspace'
export const Route = createFileRoute('/corporate/invoices')({ component: () => <GenericWorkspace kind="corporate" title="Invoices" subtitle="Prepaid, postpaid and monthly statements"/> })
