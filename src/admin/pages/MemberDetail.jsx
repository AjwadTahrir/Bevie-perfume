import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { Card, EmptyState, ErrorState, Kpi, ProgressBar, Skeleton, StatusBadge } from '../components/ui'
import { ColumnChart, fillDays } from '../components/charts'
import { fetchMembers, fetchOrders, fetchTimeseries } from '../lib/api'
import { useQuery } from '../lib/data'
import { displayName, fmtDateTime, fmtDay, rm } from '../lib/format'
import { MEMBER_STATUS, PAYMENT_STATUS } from '../lib/status'

export default function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const members = useQuery(() => fetchMembers(), [])
  const orders = useQuery(() => fetchOrders({ memberId: id }), [id])
  const series = useQuery(() => fetchTimeseries(null, id), [id])
  const m = members.data?.find((x) => x.member_id === id)

  const back = (
    <Link to="/members" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
      <ArrowLeft size={15} /> AJK Performance
    </Link>
  )
  if (members.loading && !members.data) return (<>{back}<Skeleton className="h-40 w-full" /></>) // prettier-ignore
  if (members.error && !members.data) return (<>{back}<ErrorState error={members.error} /></>) // prettier-ignore
  if (!m) return (<>{back}<EmptyState title="Member not found" /></>) // prettier-ignore

  return (
    <>
      {back}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{displayName(m.full_name)}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {m.committee_role} · code <span className="font-mono font-medium text-ink">{m.promo_code}</span>
            {!m.is_active && ' · code inactive'}
          </p>
        </div>
        <StatusBadge map={MEMBER_STATUS} value={m.status} />
      </div>

      <section className="card mb-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm">
            <span className="text-3xl font-semibold tabular-nums">{m.verified_bottles}</span>
            <span className="text-ink-3"> / {m.target} bottles verified</span>
          </p>
          <p className="text-sm text-ink-2">{m.remaining ? `${m.remaining} more to reach the target` : 'Target reached'}</p>
        </div>
        <div className="mt-3">
          <ProgressBar value={m.verified_bottles} max={m.target} size="lg" label="Progress towards the member target" />
        </div>
        <p className="mt-2 text-xs text-ink-3">{m.verified_bottles > 0 ? `Rank ${m.rank} of ${members.data.length}` : 'Not ranked yet'}</p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Pending bottles" value={m.pending_bottles} sub="Awaiting verification" tone="muted" />
        <Kpi label="Attributed revenue" value={rm(m.revenue)} sub={`${m.verified_orders} verified orders`} />
        <Kpi label="Attributed profit" value={rm(m.profit)} sub="RM 10 × verified bottles" />
        <Kpi label="Latest order" value={<span className="text-base">{fmtDateTime(m.last_order_at)}</span>} sub={`${m.total_orders} orders in total`} />
      </div>

      <Card className="mt-4" title="Sales over time" description="Verified bottles per day, by order date">
        {series.loading && !series.data ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <ColumnChart data={fillDays(series.data)} x="day" y="verified_bottles" name="Verified bottles" xFormat={fmtDay} height={200} caption={`Verified bottles per day for ${m.full_name}`} />
        )}
      </Card>

      <Card className="mt-4" title="Orders using this code" bodyClass="p-0">
        {orders.loading && !orders.data ? (
          <div className="p-5">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : !orders.data?.length ? (
          <EmptyState icon={ShoppingBag} title="No orders with this code yet" />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-canvas/60">
                <tr>
                  <th className="th">Reference</th>
                  <th className="th">Date</th>
                  <th className="th">Customer</th>
                  <th className="th text-right">Bottles</th>
                  <th className="th text-right">Amount</th>
                  <th className="th">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.data.map((o) => (
                  <tr key={o.id} tabIndex={0} onClick={() => navigate(`/orders/${o.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${o.id}`)} className="cursor-pointer hover:bg-canvas">
                    <td className="td font-medium tabular-nums">{o.reference}</td>
                    <td className="td text-ink-2">{fmtDateTime(o.created_at)}</td>
                    <td className="td">{o.customer_name}</td>
                    <td className="td text-right tabular-nums">{o.quantity}</td>
                    <td className="td text-right tabular-nums">{rm(o.final_amount)}</td>
                    <td className="td">
                      <StatusBadge map={{ ...PAYMENT_STATUS, cancelled: { label: 'Cancelled', tone: 'bad' } }} value={o.display_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
