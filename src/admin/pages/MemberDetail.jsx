import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { Card, EmptyState, ErrorState, Kpi, ProgressBar, Skeleton, StatusBadge, TableScroll } from '../components/ui'
import { ColumnChart, fillDays } from '../components/charts'
import { fetchMembers, fetchOrders, fetchTimeseries } from '../lib/api'
import { useQuery } from '../lib/data'
import { displayName, fmtDateTime, fmtDay, pct, rm } from '../lib/format'
import { DISPLAY_STATUS, MEMBER_STATUS } from '../lib/status'

export default function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const members = useQuery(() => fetchMembers(), [])
  const orders = useQuery(() => fetchOrders({ memberId: id }), [id])
  const series = useQuery(() => fetchTimeseries(null, id), [id])
  const m = members.data?.find((x) => x.member_id === id)
  const totalBottles = (members.data || []).reduce((s, x) => s + x.verified_bottles, 0)

  const back = (
    <Link to="/members" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-brand-deep">
      <ArrowLeft size={15} /> AJK Performance
    </Link>
  )
  if (members.loading && !members.data) return (<>{back}<Skeleton className="h-40 w-full" /></>) // prettier-ignore
  if (members.error && !members.data) return (<>{back}<ErrorState error={members.error} /></>) // prettier-ignore
  if (!m) return (<>{back}<EmptyState title="Member not found" /></>) // prettier-ignore

  return (
    <>
      {back}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0">
          <p className="eyebrow">{m.committee_role}</p>
          <h1 className="display mt-2 text-[1.875rem] leading-tight sm:text-[2.25rem]">{displayName(m.full_name)}</h1>
          <p className="mt-1.5 text-sm text-ink-2">
            Promo code <span className="font-mono font-medium text-ink">{m.promo_code}</span>
            {!m.is_active && <span className="text-bad"> · code inactive</span>}
          </p>
        </div>
        <StatusBadge map={MEMBER_STATUS} value={m.status} />
      </header>

      <section className="card mb-4 grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-end" aria-label="Target progress">
        <div>
          <p className="eyebrow">Verified bottles</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="display text-[3rem] leading-none">{m.verified_bottles}</span>
            <span className="display text-xl text-ink-3">/ {m.target}</span>
          </p>
          <div className="mt-4 max-w-xl">
            <ProgressBar value={m.verified_bottles} max={m.target} size="lg" label="Progress towards the member target" />
          </div>
          <p className="mt-2 text-sm text-ink-2">{m.remaining ? `${m.remaining} more to reach the target` : 'Target reached'}</p>
        </div>
        <dl className="flex gap-8 md:flex-col md:gap-4 md:border-l md:border-line md:pl-8">
          <div>
            <dt className="eyebrow">Rank</dt>
            <dd className="display mt-1 text-2xl">{m.verified_bottles > 0 ? `${m.rank} of ${members.data.length}` : 'Not ranked yet'}</dd>
          </div>
          <div>
            <dt className="eyebrow">Share of campaign</dt>
            <dd className="display mt-1 text-2xl">{pct(totalBottles ? (m.verified_bottles / totalBottles) * 100 : 0)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Pending bottles" value={m.pending_bottles} sub="Awaiting verification" tone="muted" />
        <Kpi label="Attributed revenue" value={rm(m.revenue)} sub={`${m.verified_orders} verified orders`} />
        <Kpi label="Attributed profit" value={rm(m.profit)} sub="Profit per bottle × verified bottles" />
        <Kpi label="Latest order" value={<span className="text-lg">{fmtDateTime(m.last_order_at)}</span>} sub={`${m.total_orders} orders in total`} />
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
          <TableScroll label="Orders using this code">
            <table className="w-full text-sm">
              <thead className="table-head">
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
                  <tr key={o.id} tabIndex={0} onClick={() => navigate(`/orders/${o.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${o.id}`)} className="row-link">
                    <td className="td font-medium tabular-nums">{o.reference}</td>
                    <td className="td text-ink-2">{fmtDateTime(o.created_at)}</td>
                    <td className="td">{o.customer_name}</td>
                    <td className="td text-right tabular-nums">{o.quantity}</td>
                    <td className="td text-right tabular-nums">{rm(o.final_amount)}</td>
                    <td className="td">
                      <StatusBadge map={DISPLAY_STATUS} value={o.display_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Card>
    </>
  )
}
