import { createFileRoute } from '@tanstack/react-router'
import { useApi } from '@/lib/api-client'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { WalletCards } from 'lucide-react'

export const Route = createFileRoute('/corporate/invoices')({ component: CorporateInvoices })

type AccountPayload = { user: { role:string } }
type InvoicesPayload = { invoices: Array<{ id:string; invoiceNumber:string; periodStart:string; periodEnd:string; subtotal:string; total:string; dueDate:string; status:string }> }

const statusStyles: Record<string,string> = { PAID:'', OVERDUE:'amber', CANCELLED:'gray', DRAFT:'gray', ISSUED:'' }

function CorporateInvoices() {
  const { data: account } = useApi<AccountPayload>('/api/account')
  const isCorporate = account?.user?.role === 'corporate_admin' || account?.user?.role === 'corporate_rider'
  const { data, loading, error } = useApi<InvoicesPayload>(isCorporate ? '/api/corporate/invoices' : null)
  const invoices = data?.invoices ?? []
  return <AppShell kind="corporate" title="Invoices" subtitle="Prepaid, postpaid and monthly statements">
    {error && <p className="notice" role="alert">{error}</p>}
    {loading ? <p className="notice">Loading invoices…</p>
      : !isCorporate
        ? <section className="panel"><EmptyState icon={WalletCards} title="Corporate workspace is for corporate accounts." body="Log in with your company account to view invoices."/></section>
        : invoices.length === 0
          ? <section className="panel"><EmptyState icon={WalletCards} title="No invoices yet." body="Monthly statements appear here once billing cycles close for your account."/></section>
          : <section className="panel table-panel"><div className="panel-head"><h3>Invoices</h3></div>
            <table className="data-table"><thead><tr><th>Invoice</th><th>Period</th><th>Subtotal</th><th>Total</th><th>Due</th><th>Status</th></tr></thead><tbody>
              {invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.invoiceNumber}</strong></td><td>{invoice.periodStart} → {invoice.periodEnd}</td><td>₦{Number(invoice.subtotal).toLocaleString('en-NG')}</td><td>₦{Number(invoice.total).toLocaleString('en-NG')}</td><td>{invoice.dueDate}</td><td><span className={`status-badge ${statusStyles[invoice.status] ?? ''}`}>{invoice.status}</span></td></tr>)}
            </tbody></table>
          </section>}
  </AppShell>
}