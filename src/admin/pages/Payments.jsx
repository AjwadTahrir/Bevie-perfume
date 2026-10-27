import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, CreditCard, Image } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, StatusBadge, TableScroll, TableSkeleton, Toolbar, usePaged } from '../components/ui'
import ConfirmDialog from '../components/ConfirmDialog'
import ReceiptDialog from '../components/ReceiptDialog'
import { useToast } from '../components/Toasts'
import { actions, fetchOrders } from '../lib/api'
import { useLiveData, useQuery } from '../lib/data'
import { displayName, fmtClock, fmtDate, fmtDateTime, n, rm } from '../lib/format'
import { PAYMENT_STATUS } from '../lib/status'

const TABS = [
  { key: 'submitted', label: 'Needs review', hint: 'Receipt uploaded', match: (o) => o.display_status === 'submitted' },
  { key: 'duplicates', label: 'Duplicate references', hint: 'Same bank reference twice', match: (o) => o.duplicate_transfer_reference && o.order_status !== 'cancelled' },
  { key: 'awaiting', label: 'Awaiting payment', hint: 'No receipt yet', match: (o) => o.display_status === 'awaiting_payment' },
  { key: 'verified', label: 'Verified', hint: 'Counted in sales', match: (o) => o.display_status === 'verified' },
  { key: 'rejected', label: 'Rejected', hint: 'Customer to resubmit', match: (o) => o.display_status === 'rejected' },
]

export default function Payments() {
  const navigate = useNavigate()
  const toast = useToast()
  const { refresh } = useLiveData()
  const orders = useQuery(() => fetchOrders(), [])
  const [tab, setTab] = useState('submitted')
  const [q, setQ] = useState('')
  const [verifying, setVerifying] = useState(null)
  const [receipt, setReceipt] = useState(null)

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, (orders.data || []).filter(t.match).length])), [orders.data])
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const rows = (orders.data || [])
      .filter(TABS.find((t) => t.key === tab).match)
      .filter((o) => !term || [o.reference, o.customer_name, o.transfer_reference, o.promo_code, o.customer_phone].some((v) => v?.toLowerCase().includes(term)))
    return tab === 'submitted' ? rows.sort((a, b) => new Date(a.submission_at) - new Date(b.submission_at)) : rows
  }, [orders.data, tab, q])
  const { rows, pager } = usePaged(filtered, 20)
  const current = TABS.find((t) => t.key === tab)

  const actionsFor = (o, size = 'h-8 px-2.5 text-xs', compact = true) => (
    <>
      {o.proof_path && (
        <button
          type="button"
          className={`btn btn-secondary ${size} ${compact ? 'w-8 px-0' : ''}`}
          onClick={() => setReceipt(o)}
          aria-label={`View receipt for ${o.reference}`}
          title="View receipt"
        >
          <Image size={14} aria-hidden="true" />
          {!compact && 'Receipt'}
        </button>
      )}
      <button type="button" className={`btn btn-secondary ${size}`} onClick={() => navigate(`/orders/${o.id}`)}>
        Review
      </button>
      {o.payment_status === 'submitted' && (
        <button type="button" className={`btn btn-good ${size}`} onClick={() => setVerifying(o)}>
          Verify
        </button>
      )}
    </>
  )

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Payments"
        description="Check each transfer against the bank account before verifying. A screenshot alone does not prove the money arrived."
      />

      {/* Queues: each tab shows its count, so the workload is visible before opening it */}
      <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="grid min-w-[44rem] grid-cols-5 gap-2" role="tablist" aria-label="Payment queues">
          {TABS.map((t) => {
            const selected = tab === t.key
            const alert = (t.key === 'submitted' || t.key === 'duplicates') && counts[t.key] > 0
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.key)}
                className={`relative rounded-lg border px-4 py-3 text-left transition-colors duration-150 ${
                  selected ? 'border-brand/50 bg-surface shadow-[0_1px_0_rgba(63,41,37,0.04)]' : 'border-line bg-surface/50 hover:border-line-strong hover:bg-surface'
                }`}
              >
                {selected && <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-brand" aria-hidden="true" />}
                <span className={`block text-xs font-medium ${selected ? 'text-ink' : 'text-ink-2'}`}>{t.label}</span>
                <span className={`display mt-1 block text-2xl leading-none ${alert ? (t.key === 'duplicates' ? 'text-warn' : 'text-brand-deep') : 'text-ink'}`}>{n(counts[t.key] ?? 0)}</span>
                <span className="mt-1 block text-[0.6875rem] text-ink-3">{t.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Reference, customer, bank ref or code" label="Search payments" />
        <p className="text-xs text-ink-3 sm:ml-auto" aria-live="polite">
          {n(filtered.length)} in {current.label.toLowerCase()}
          {tab === 'submitted' && filtered.length > 1 && ' · oldest first'}
        </p>
      </Toolbar>

      {orders.error && !orders.data && <ErrorState error={orders.error} />}
      <Card bodyClass="p-0">
        {orders.loading && !orders.data ? (
          <TableSkeleton cols={6} />
        ) : !filtered.length ? (
          <EmptyState icon={tab === 'submitted' && !q ? CheckCircle2 : CreditCard} title={q ? 'No payments match your search' : tab === 'submitted' ? 'Nothing to review' : 'No payments here'}>
            {q ? 'Try a different reference or name.' : tab === 'submitted' ? 'New payment submissions will appear here automatically.' : null}
          </EmptyState>
        ) : (
          <>
            {/* Phones: one compact card per payment, actions within thumb reach */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((o) => (
                <li key={o.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/orders/${o.id}`} className="font-medium tabular-nums">
                        {o.reference}
                      </Link>
                      <p className="truncate text-sm text-ink-2">{o.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="display text-lg leading-tight">{rm(o.final_amount)}</p>
                      <p className="text-xs text-ink-3">{o.quantity} bottles</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                    <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
                    {o.transfer_reference && <span className="font-mono text-ink-2">{o.transfer_reference}</span>}
                    {o.duplicate_transfer_reference && (
                      <Badge tone="warn" icon={AlertTriangle}>
                        Used on another order
                      </Badge>
                    )}
                  </div>
                  {o.submission_at && <p className="mt-1.5 text-xs text-ink-3">Submitted {fmtDateTime(o.submission_at)}</p>}
                  <div className="mt-3 grid auto-cols-fr grid-flow-col gap-2">{actionsFor(o, 'h-10 px-3 text-sm', false)}</div>
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <TableScroll>
                <table className="w-full text-sm">
                  <thead className="table-head">
                    <tr>
                      <th className="th">Order</th>
                      <th className="th">Customer</th>
                      <th className="th">Bank reference · submitted</th>
                      <th className="th text-right">Amount · status</th>
                      <th className="th">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((o) => (
                      <tr key={o.id} className={`transition-colors duration-150 hover:bg-tint/60 ${o.duplicate_transfer_reference ? 'bg-warn-soft/35' : ''}`}>
                        <td className="td">
                          <Link to={`/orders/${o.id}`} className="font-medium tabular-nums hover:text-brand-deep hover:underline">
                            {o.reference}
                          </Link>
                          <span className="block text-xs text-ink-3">
                            {o.quantity} bottles{o.promo_code ? ` · ${displayName(o.member_name || o.ajk_member_name)}` : ''}
                          </span>
                        </td>
                        <td className="td">
                          <span className="block">{o.customer_name}</span>
                          <span className="text-xs text-ink-3">{o.customer_phone}</span>
                        </td>
                        <td className="td">
                          {o.transfer_reference ? <span className="block font-mono text-xs">{o.transfer_reference}</span> : <span className="block text-xs text-ink-3">No reference given</span>}
                          {o.duplicate_transfer_reference && (
                            <span className="mt-1 block">
                              <Badge tone="warn" icon={AlertTriangle}>
                                Used on another order
                              </Badge>
                            </span>
                          )}
                          {o.submission_at && (
                            <span className="mt-1 block text-xs text-ink-3">
                              Submitted {fmtDate(o.submission_at)}, {fmtClock(o.submission_at)}
                            </span>
                          )}
                        </td>
                        <td className="td text-right">
                          <span className="block font-medium tabular-nums">{rm(o.final_amount)}</span>
                          <span className="mt-1 inline-block">
                            <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
                          </span>
                        </td>
                        <td className="td text-right">
                          <div className="flex justify-end gap-1.5">{actionsFor(o)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </div>
            <Pagination {...pager} />
          </>
        )}
      </Card>

      <ReceiptDialog
        order={receipt}
        onClose={() => setReceipt(null)}
        onReview={() => {
          const id = receipt.id
          setReceipt(null)
          navigate(`/orders/${id}`)
        }}
      />
      <ConfirmDialog
        open={!!verifying}
        title={`Verify ${verifying?.reference}?`}
        body={
          <>
            <p>
              Confirm that {rm(verifying?.final_amount)} for order {verifying?.reference}
              {verifying?.transfer_reference ? ` (bank reference "${verifying.transfer_reference}")` : ''} is in the bank account. The {verifying?.quantity} bottles will count
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
