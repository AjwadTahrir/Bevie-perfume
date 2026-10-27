import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, ArrowUpRight, CheckCircle2, ShoppingBag, Trophy } from 'lucide-react'
import { Card, EmptyState, ErrorState, InfoTip, Kpi, PageHeader, ProgressBar, Skeleton, StatusBadge } from '../components/ui'
import { ColumnChart, fillDays } from '../components/charts'
import { fetchDashboard, fetchMembers, fetchOrders, fetchTimeseries } from '../lib/api'
import { useQuery } from '../lib/data'
import { displayName, fmtDateTime, fmtDay, n, pct, rm } from '../lib/format'
import { resolveRange } from '../lib/dateRange'
import { DISPLAY_STATUS } from '../lib/status'

export const DEFINITIONS = {
  verifiedBottles: 'Bottles in orders whose payment an admin has verified. Pending, rejected, cancelled and refunded orders are excluded.',
  gross: 'Verified bottles at the full selling price (quantity × selling price at the time of each order), before promo discounts.',
  discounts: 'Promo-code discounts granted on verified orders (RM 5 per bottle with a valid AJK code).',
  net: 'Money actually collected on verified orders: gross sales minus discounts.',
  profit: 'Campaign profit on verified orders: the profit per bottle set in Settings × verified bottles. Discounts are not subtracted again.',
  pending: 'Orders awaiting payment or with a payment submitted but not yet verified. Not counted as sales.',
}

const CHART_RANGES = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
]

/** One figure in the campaign band: label over a Playfair value. */
function BandStat({ label, value, sub }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="display mt-1.5 text-2xl leading-none text-ink">{value}</dd>
      {sub && <dd className="mt-1.5 text-xs text-ink-3">{sub}</dd>}
    </div>
  )
}

export default function Overview() {
  const navigate = useNavigate()
  const [chartRange, setChartRange] = useState('30d')
  const range = resolveRange({ preset: chartRange })
  const dash = useQuery(() => fetchDashboard(), [])
  const members = useQuery(() => fetchMembers(), [])
  const orders = useQuery(() => fetchOrders(), [])
  const series = useQuery(() => fetchTimeseries(range), [range.from, range.to])

  const d = dash.data
  const loading = dash.loading && !d
  const target = d?.target
  const verified = d?.verified
  const toReview = d?.pending.submitted_orders ?? 0
  const review = (orders.data || []).filter((o) => o.display_status === 'submitted').sort((a, b) => new Date(a.submission_at) - new Date(b.submission_at))
  const recent = (orders.data || []).slice(0, 6)
  const profitEach = d ? rm(d.settings.profit_per_bottle) : ''

  return (
    <>
      <PageHeader
        eyebrow={d ? d.settings.campaign_name : 'Campaign'}
        title="Campaign Overview"
        description="Sales, profit and progress from verified payments only. Updates live as orders and payments arrive."
        actions={
          toReview > 0 ? (
            <Link to="/payments" className="btn btn-primary">
              Review {toReview} {toReview === 1 ? 'payment' : 'payments'} <ArrowRight size={15} />
            </Link>
          ) : (
            <Link to="/payments" className="btn btn-secondary">
              Payments <ArrowRight size={15} />
            </Link>
          )
        }
      />
      {dash.error && !d && <ErrorState error={dash.error} />}

      {/* Campaign band: the one number that matters, with its context */}
      <section className="card overflow-hidden" aria-labelledby="progress-h">
        <div className="grid lg:grid-cols-12">
          <div className="p-5 sm:p-7 lg:col-span-7">
            <h2 id="progress-h" className="eyebrow flex items-center gap-1.5">
              Bottles sold · verified
              <InfoTip text={DEFINITIONS.verifiedBottles} />
            </h2>
            {loading ? (
              <Skeleton className="mt-4 h-14 w-56" />
            ) : (
              <p className="mt-3 flex items-baseline gap-3">
                <span className="display text-[3.5rem] leading-none text-ink sm:text-[4.25rem]">{n(verified.bottles)}</span>
                <span className="display text-xl text-ink-3 sm:text-2xl">/ {n(target.campaign_target)}</span>
              </p>
            )}
            <div className="mt-6">
              {loading ? <Skeleton className="h-2.5 w-full" /> : <ProgressBar value={verified.bottles} max={target.campaign_target} size="lg" label="Campaign target completion" />}
            </div>
            {!loading && (
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                <span>
                  <strong className="font-semibold text-ink tabular-nums">{pct(target.completion_pct)}</strong> of target
                </span>
                <span>{target.remaining ? <><strong className="font-semibold text-ink tabular-nums">{n(target.remaining)}</strong> bottles to go</> : <strong className="font-semibold text-good">Target reached</strong>}</span>
                {d.pending.bottles > 0 && <span className="text-ink-3">+ {n(d.pending.bottles)} pending verification, not counted</span>}
              </p>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line bg-tint/40 p-5 sm:grid-cols-3 sm:p-7 lg:col-span-5 lg:grid-cols-2 lg:content-center lg:border-t-0 lg:border-l">
            {loading ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)
            ) : (
              <>
                <BandStat label="AJK at target" value={`${d.members.reached} / ${d.members.total}`} sub={`${d.members.in_progress} in progress`} />
                <BandStat label="Paid orders" value={n(verified.orders)} sub={`${n(verified.direct_orders)} without a code`} />
                <BandStat label="Promo bottles" value={n(verified.promo_bottles)} sub={`of ${n(verified.bottles)} verified`} />
                <BandStat label="Gross sales" value={rm(verified.gross)} sub={`Before ${rm(verified.discounts)} discounts`} />
              </>
            )}
          </dl>
        </div>
      </section>

      {/* Money and the work waiting */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi accent loading={loading} label="Net sales collected" info={DEFINITIONS.net} value={verified && rm(verified.net)} sub="Verified payments, after discounts" />
        <Kpi loading={loading} label="Campaign profit" info={DEFINITIONS.profit} value={verified && rm(verified.profit)} sub={d && `${profitEach} × verified bottles`} />
        <Kpi loading={loading} label="Pending payments" info={DEFINITIONS.pending} tone="muted" value={d && rm(d.pending.amount)} sub={d && `${n(d.pending.orders)} orders not yet counted`} />
        <Link to="/payments" className="group rounded-lg focus-visible:outline-offset-4">
          <Kpi
            className={`h-full transition-colors duration-150 group-hover:border-brand/40 ${toReview ? 'border-brand/30' : ''}`}
            loading={loading}
            label="Payments to check"
            value={
              <span className="flex items-center justify-between">
                <span className={toReview ? 'text-brand-deep' : ''}>{n(toReview)}</span>
                <ArrowUpRight size={18} className="text-ink-3 transition-colors group-hover:text-brand" aria-hidden="true" />
              </span>
            }
            sub={d && (toReview ? 'Receipts waiting for an admin' : 'Nothing waiting · all caught up')}
          />
        </Link>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <Card
          className="xl:col-span-8"
          title="Daily verified bottles"
          description="By order date. Hover a bar for pending bottles that day."
          actions={
            <div className="segmented" role="group" aria-label="Chart period">
              {CHART_RANGES.map((r) => (
                <button key={r.key} type="button" className="segment" aria-pressed={chartRange === r.key} onClick={() => setChartRange(r.key)}>
                  {r.label}
                </button>
              ))}
            </div>
          }
        >
          {series.loading && !series.data ? (
            <Skeleton className="h-60 w-full" />
          ) : series.error && !series.data ? (
            <ErrorState error={series.error} />
          ) : (
            <ColumnChart
              data={fillDays(series.data, range.from, range.to)}
              x="day"
              y="verified_bottles"
              name="Verified bottles"
              xFormat={fmtDay}
              caption={`Verified bottles sold per day, ${CHART_RANGES.find((r) => r.key === chartRange).label.toLowerCase()}`}
              tooltipRows={(r) => (r.pending_bottles ? <p className="text-ink-3">Pending: {r.pending_bottles}</p> : null)}
            />
          )}
        </Card>

        <Card
          className="xl:col-span-4"
          title="Top sellers"
          description="Ranked by verified bottles"
          bodyClass="p-0"
          actions={
            <Link to="/leaderboard" className="btn btn-ghost h-8 px-2 text-xs">
              Leaderboard <ArrowRight size={14} />
            </Link>
          }
        >
          {members.loading && !members.data ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : !members.data?.some((m) => m.verified_bottles > 0) ? (
            <EmptyState icon={Trophy} title="No verified sales yet">
              Rankings appear once the first payment is verified.
            </EmptyState>
          ) : (
            <ol className="divide-y divide-line">
              {members.data
                .filter((m) => m.verified_bottles > 0)
                .slice(0, 5)
                .map((m) => (
                  <li key={m.member_id}>
                    <button type="button" onClick={() => navigate(`/members/${m.member_id}`)} className="row-link flex w-full items-center gap-4 px-5 py-3 text-left">
                      <span className={`display w-5 text-lg ${m.rank <= 3 ? 'text-brand-deep' : 'text-ink-3'}`}>{m.rank}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{displayName(m.full_name)}</span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <ProgressBar value={m.verified_bottles} max={m.target} size="sm" label={`${displayName(m.full_name)} target progress`} />
                          <span className="text-[0.6875rem] whitespace-nowrap text-ink-3 tabular-nums">
                            {m.verified_bottles}/{m.target}
                          </span>
                        </span>
                      </span>
                      <span className="display text-xl tabular-nums">{m.verified_bottles}</span>
                    </button>
                  </li>
                ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-12">
        <Card
          className="xl:col-span-7"
          title="Payments to review"
          description="Oldest first. Check each transfer against the bank account before verifying."
          bodyClass="p-0"
          actions={
            <Link to="/payments" className="btn btn-ghost h-8 px-2 text-xs">
              All payments <ArrowRight size={14} />
            </Link>
          }
        >
          {orders.loading && !orders.data ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : !review.length ? (
            <EmptyState icon={CheckCircle2} title="All caught up">
              No payments are waiting for review.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {review.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="row-link flex items-center gap-4 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2">
                        <span className="font-medium tabular-nums">{o.reference}</span>
                        <span className="truncate text-ink-2">{o.customer_name}</span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-3">
                        <span>Submitted {fmtDateTime(o.submission_at)}</span>
                        {o.duplicate_transfer_reference && (
                          <span className="inline-flex items-center gap-1 font-medium text-warn">
                            <AlertTriangle size={12} aria-hidden="true" /> Duplicate reference
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold tabular-nums">{rm(o.final_amount)}</span>
                      <span className="text-xs text-ink-3 tabular-nums">{o.quantity} bottles</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {review.length > 6 && <p className="border-t border-line px-5 py-3 text-xs text-ink-3">+ {review.length - 6} more in the payments queue</p>}
        </Card>

        <Card
          className="xl:col-span-5"
          title="Recent orders"
          description="Newest first, any status"
          bodyClass="p-0"
          actions={
            <Link to="/orders" className="btn btn-ghost h-8 px-2 text-xs">
              All orders <ArrowRight size={14} />
            </Link>
          }
        >
          {orders.loading && !orders.data ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : !recent.length ? (
            <EmptyState icon={ShoppingBag} title="No orders yet">
              Orders placed on the website appear here automatically.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="row-link flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        <span className="font-medium tabular-nums">{o.reference}</span> <span className="text-ink-2">· {o.customer_name}</span>
                      </span>
                      <span className="text-xs text-ink-3">{fmtDateTime(o.created_at)}</span>
                    </span>
                    <StatusBadge map={DISPLAY_STATUS} value={o.display_status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
