import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, Download, ShoppingBag } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, Select, SortTh, StatusBadge, TableScroll, TableSkeleton, Toolbar, sortRows, usePaged } from '../components/ui'
import DateRangeFilter from '../components/DateRangeFilter'
import { fetchMembers, fetchOrders } from '../lib/api'
import { useQuery } from '../lib/data'
import { DEFAULT_RANGE, resolveRange } from '../lib/dateRange'
import { displayName, fmtClock, fmtDate, n, rm } from '../lib/format'
import { ORDER_STATUS, PAYMENT_STATUS } from '../lib/status'
import { downloadCsv, stamp } from '../lib/csv'

export const ORDER_CSV = [
  { label: 'Reference', value: (o) => o.reference },
  { label: 'Created at', value: (o) => o.created_at },
  { label: 'Customer', value: (o) => o.customer_name },
  { label: 'Phone', value: (o) => o.customer_phone },
  { label: 'Email', value: (o) => o.customer_email },
  { label: 'Address', value: (o) => o.delivery_address },
  { label: 'Items', value: (o) => o.items_summary },
  { label: 'Bottles', value: (o) => o.quantity },
  { label: 'Promo code', value: (o) => o.promo_code },
  { label: 'AJK member', value: (o) => o.member_name || o.ajk_member_name },
  { label: 'Unit price', value: (o) => o.original_unit_price },
  { label: 'Original subtotal', value: (o) => o.original_subtotal },
  { label: 'Discount', value: (o) => o.discount_total },
  { label: 'Final amount', value: (o) => o.final_amount },
  { label: 'Campaign profit', value: (o) => (o.is_verified ? o.profit_amount : 0) },
  { label: 'Payment status', value: (o) => o.payment_status },
  { label: 'Order status', value: (o) => o.order_status },
  { label: 'Counted as verified sale', value: (o) => (o.is_verified ? 'yes' : 'no') },
  { label: 'Transfer reference', value: (o) => o.transfer_reference },
  { label: 'Duplicate transfer reference', value: (o) => (o.duplicate_transfer_reference ? 'yes' : '') },
  { label: 'Verified at', value: (o) => o.verified_at },
]

const opts = (map, all) => [{ value: '', label: all }, ...Object.entries(map).map(([value, s]) => ({ value, label: s.label }))]

export default function Orders() {
  const navigate = useNavigate()
  const [range, setRange] = useState(DEFAULT_RANGE)
  // ?q= comes from the search box in the top bar.
  const [params] = useSearchParams()
  const [q, setQ] = useState(() => params.get('q') ?? '')
  useEffect(() => {
    if (params.has('q')) setQ(params.get('q'))
  }, [params])
  const [pay, setPay] = useState('')
  const [status, setStatus] = useState('')
  const [member, setMember] = useState('')
  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' })
  const r = resolveRange(range)

  const orders = useQuery(() => fetchOrders(r), [r.from, r.to])
  const members = useQuery(() => fetchMembers(), [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const rows = (orders.data || []).filter(
      (o) =>
        (!term || [o.reference, o.customer_name, o.promo_code, o.customer_phone].some((v) => v?.toLowerCase().includes(term))) &&
        (!pay || o.payment_status === pay) &&
        (!status || o.order_status === status) &&
        (!member || (member === 'none' ? !o.ajk_member_id : o.ajk_member_id === member)),
    )
    return sortRows(rows, sort, { created_at: (o) => new Date(o.created_at).getTime(), final_amount: (o) => Number(o.final_amount) })
  }, [orders.data, q, pay, status, member, sort])

  const { rows, pager } = usePaged(filtered, 20)
  const memberOptions = [
    { value: '', label: 'All AJK members' },
    { value: 'none', label: 'No promo code' },
    ...(members.data || []).slice().sort((a, b) => a.full_name.localeCompare(b.full_name)).map((m) => ({ value: m.member_id, label: displayName(m.full_name) })),
  ]

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Orders"
        description="Every customer order, newest first. Click a row for details and actions."
        actions={
          <button type="button" className="btn btn-secondary" disabled={!filtered.length} onClick={() => downloadCsv(`jetha-orders-${stamp()}.csv`, ORDER_CSV, filtered)}>
            <Download size={15} /> Export CSV
          </button>
        }
      />

      <div className="mb-3">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Reference, customer, phone or code" label="Search orders" />
        <Select label="Payment status" value={pay} onChange={setPay} options={opts(PAYMENT_STATUS, 'All payment statuses')} className="w-full sm:w-48" />
        <Select label="Order status" value={status} onChange={setStatus} options={opts(ORDER_STATUS, 'All order statuses')} className="w-full sm:w-44" />
        <Select label="AJK member" value={member} onChange={setMember} options={memberOptions} className="w-full sm:w-60" />
        {orders.data && (
          <p className="text-xs text-ink-3 sm:ml-auto" aria-live="polite">
            {n(filtered.length)} of {n(orders.data.length)} orders
          </p>
        )}
      </Toolbar>

      {orders.error && !orders.data && <ErrorState error={orders.error} />}
      <Card bodyClass="p-0">
        {orders.loading && !orders.data ? (
          <TableSkeleton cols={7} />
        ) : !filtered.length ? (
          <EmptyState icon={ShoppingBag} title={orders.data?.length ? 'No orders match these filters' : 'No orders yet'}>
            {orders.data?.length ? 'Try clearing a filter or widening the date range.' : 'Orders placed on the website will appear here automatically.'}
          </EmptyState>
        ) : (
          <>
            {/* Phones: one card per order with every figure; tap to open */}
            <ul className="divide-y divide-line sm:hidden">
              {rows.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => navigate(`/orders/${o.id}`)} className="row-link block w-full px-4 py-4 text-left">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-medium tabular-nums">
                          {o.reference}
                          {o.duplicate_transfer_reference && <Copy size={12} className="ml-1.5 inline text-warn" aria-label="Duplicate transfer reference" role="img" />}
                        </span>
                        <span className="block truncate text-sm text-ink-2">{o.customer_name}</span>
                        <span className="text-xs text-ink-3">
                          {fmtDate(o.created_at)}, {fmtClock(o.created_at)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="display block text-lg leading-tight">{rm(o.final_amount)}</span>
                        <span className="text-xs text-ink-3 tabular-nums">
                          {o.quantity} {o.quantity === 1 ? 'bottle' : 'bottles'}{Number(o.discount_total) ? ` · − ${rm(o.discount_total)}` : ''}
                        </span>
                      </span>
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
                      <StatusBadge map={ORDER_STATUS} value={o.order_status} />
                      {o.promo_code && (
                        <span className="text-xs text-ink-3">
                          <span className="font-mono text-ink-2">{o.promo_code}</span> · {displayName(o.member_name || o.ajk_member_name)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden sm:block">
            <TableScroll label="Orders table">
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="th sticky left-0 z-10 bg-tint">Reference</th>
                    <SortTh label="Date" k="created_at" sort={sort} setSort={setSort} />
                    <th className="th">Customer</th>
                    <SortTh label="Bottles" k="quantity" sort={sort} setSort={setSort} className="text-right" />
                    <th className="th">Promo · AJK</th>
                    <th className="th text-right">Subtotal</th>
                    <SortTh label="Final" k="final_amount" sort={sort} setSort={setSort} className="text-right" />
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((o) => (
                    <tr
                      key={o.id}
                      tabIndex={0}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${o.id}`)}
                      className="row-link group"
                    >
                      <td className="td sticky left-0 z-10 bg-surface font-medium tabular-nums transition-colors duration-150 group-hover:bg-tint">
                        {o.reference}
                        {o.duplicate_transfer_reference && <Copy size={12} className="ml-1.5 inline text-warn" aria-label="Duplicate transfer reference" role="img" />}
                      </td>
                      <td className="td text-ink-2">
                        <span className="block">{fmtDate(o.created_at)}</span>
                        <span className="text-xs text-ink-3">{fmtClock(o.created_at)}</span>
                      </td>
                      <td className="td">
                        <span className="block">{o.customer_name}</span>
                        <span className="text-xs text-ink-3">{o.customer_phone}</span>
                      </td>
                      <td className="td text-right tabular-nums">{o.quantity}</td>
                      <td className="td max-w-[9.5rem] truncate" title={o.promo_code ? displayName(o.member_name || o.ajk_member_name) : undefined}>
                        {o.promo_code ? (
                          <>
                            <span className="block font-mono text-xs">{o.promo_code}</span>
                            <span className="text-xs text-ink-3">{displayName(o.member_name || o.ajk_member_name)}</span>
                          </>
                        ) : (
                          <span className="text-ink-3">—</span>
                        )}
                      </td>
                      <td className="td text-right tabular-nums">
                        <span className="block text-ink-2">{rm(o.original_subtotal)}</span>
                        <span className="text-xs text-ink-3">{Number(o.discount_total) ? `− ${rm(o.discount_total)}` : 'No discount'}</span>
                      </td>
                      <td className="td text-right font-medium tabular-nums">{rm(o.final_amount)}</td>
                      <td className="td">
                        <span className="flex flex-col items-start gap-1">
                          <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
                          <StatusBadge map={ORDER_STATUS} value={o.order_status} />
                        </span>
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
    </>
  )
}
