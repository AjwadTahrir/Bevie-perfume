import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, PageHeader, Pagination, StatusBadge, TableSkeleton, usePaged } from '../components/ui'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toasts'
import { actions, fetchOrders } from '../lib/api'
import { useLiveData, useQuery } from '../lib/data'
import { displayName, fmtDate, fmtDateTime, rm } from '../lib/format'
import { PAYMENT_STATUS } from '../lib/status'

const TABS = [
  { key: 'submitted', label: 'Needs review', match: (o) => o.display_status === 'submitted' },
  { key: 'duplicates', label: 'Duplicate references', match: (o) => o.duplicate_transfer_reference && o.order_status !== 'cancelled' },
  { key: 'awaiting', label: 'Awaiting payment', match: (o) => o.display_status === 'awaiting_payment' },
  { key: 'verified', label: 'Verified', match: (o) => o.display_status === 'verified' },
  { key: 'rejected', label: 'Rejected', match: (o) => o.display_status === 'rejected' },
]

export default function Payments() {
  const navigate = useNavigate()
  const toast = useToast()
  const { refresh } = useLiveData()
  const orders = useQuery(() => fetchOrders(), [])
  const [tab, setTab] = useState('submitted')
  const [verifying, setVerifying] = useState(null)

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, (orders.data || []).filter(t.match).length])), [orders.data])
  const filtered = useMemo(() => {
    const rows = (orders.data || []).filter(TABS.find((t) => t.key === tab).match)
    return tab === 'submitted' ? rows.sort((a, b) => new Date(a.submission_at) - new Date(b.submission_at)) : rows
  }, [orders.data, tab])
  const { rows, pager } = usePaged(filtered, 20)

  return (
    <>
      <PageHeader
        title="Payments"
        description="Check each transfer against the bank account before verifying. A screenshot alone does not prove the money arrived."
      />
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label="Payment queues">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap ${tab === t.key ? 'border-navy font-medium text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}
          >
            {t.label}
            <span className="rounded-full bg-canvas px-1.5 text-xs text-ink-3 ring-1 ring-line tabular-nums">{counts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {orders.error && !orders.data && <ErrorState error={orders.error} />}
      <Card bodyClass="p-0">
        {orders.loading && !orders.data ? (
          <TableSkeleton cols={6} />
        ) : !filtered.length ? (
          <EmptyState icon={tab === 'submitted' ? CheckCircle2 : CreditCard} title={tab === 'submitted' ? 'Nothing to review' : 'No payments here'}>
            {tab === 'submitted' ? 'New payment submissions will appear here automatically.' : null}
          </EmptyState>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-canvas/60">
                  <tr>
                    <th className="th">Order</th>
                    <th className="th">Customer</th>
                    <th className="th">Transfer reference</th>
                    <th className="th">Paid on</th>
                    <th className="th">Submitted</th>
                    <th className="th text-right">Amount</th>
                    <th className="th">Status</th>
                    <th className="th">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((o) => (
                    <tr key={o.id} className="hover:bg-canvas">
                      <td className="td">
                        <Link to={`/orders/${o.id}`} className="font-medium tabular-nums hover:underline">
                          {o.reference}
                        </Link>
                        <span className="block text-xs text-ink-3">
                          {o.quantity} bottles{o.promo_code ? ` · ${displayName(o.member_name || o.ajk_member_name)}` : ''}
                        </span>
                      </td>
                      <td className="td">{o.customer_name}</td>
                      <td className="td">
                        {o.transfer_reference ? <span className="font-mono text-xs">{o.transfer_reference}</span> : <span className="text-ink-3">—</span>}
                        {o.duplicate_transfer_reference && (
                          <span className="mt-1 block">
                            <Badge tone="warn" icon={AlertTriangle}>
                              Used on another order
                            </Badge>
                          </span>
                        )}
                      </td>
                      <td className="td text-ink-2">{fmtDate(o.paid_on)}</td>
                      <td className="td text-ink-2">{fmtDateTime(o.submission_at)}</td>
                      <td className="td text-right font-medium tabular-nums">{rm(o.final_amount)}</td>
                      <td className="td">
                        <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
                      </td>
                      <td className="td text-right">
                        <div className="flex justify-end gap-1">
                          <button type="button" className="btn btn-secondary h-8 px-2.5 text-xs" onClick={() => navigate(`/orders/${o.id}`)}>
                            Review
                          </button>
                          {o.payment_status === 'submitted' && (
                            <button type="button" className="btn btn-good h-8 px-2.5 text-xs" onClick={() => setVerifying(o)}>
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pager} />
          </>
        )}
      </Card>
      <ConfirmDialog
        open={!!verifying}
        title={`Verify ${verifying?.reference}?`}
        body={
          <>
            <p>
              Confirm that {rm(verifying?.final_amount)} for order {verifying?.reference}{verifying?.transfer_reference ? ` (bank reference "${verifying.transfer_reference}")` : ''} is in the bank account. The {verifying?.quantity} bottles will count
              towards sales and targets.
            </p>
            {verifying?.duplicate_transfer_reference && <p className="mt-2 font-medium text-warn">This transfer reference was also used on another order.</p>}
          </>
        }
        confirmLabel="Verify payment"
        tone="good"
        onConfirm={async () => {
          try {
            await actions.verify(verifying.id)
            toast(`${verifying.reference} verified.`)
          } finally {
            refresh()
          }
        }}
        onClose={() => setVerifying(null)}
      />
    </>
  )
}
