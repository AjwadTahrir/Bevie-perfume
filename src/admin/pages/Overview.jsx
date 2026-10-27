import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock, Copy, Trophy } from 'lucide-react'
import { Card, EmptyState, ErrorState, Kpi, PageHeader, ProgressBar, Skeleton, StatusBadge } from '../components/ui'
import { ColumnChart, fillDays } from '../components/charts'
import { fetchDashboard, fetchMembers, fetchOrders, fetchTimeseries } from '../lib/api'
import { useQuery } from '../lib/data'
import { displayName, fmtDateTime, fmtDay, n, pct, rm } from '../lib/format'
import { resolveRange } from '../lib/dateRange'
import { PAYMENT_STATUS } from '../lib/status'

export const DEFINITIONS = {
  verifiedBottles: 'Bottles in orders whose payment an admin has verified. Pending, rejected, cancelled and refunded orders are excluded.',
  gross: 'Verified bottles at the full selling price (quantity × selling price at the time of each order), before promo discounts.',
  discounts: 'Promo-code discounts granted on verified orders (RM 5 per bottle with a valid AJK code).',
  net: 'Money actually collected on verified orders: gross sales minus discounts.',
  profit: 'Campaign profit on verified orders using the agreed rule of RM 10 per bottle. Discounts are not subtracted again.',
  pending: 'Orders awaiting payment or with a payment submitted but not yet verified. Not counted as sales.',
}

export default function Overview() {
  const navigate = useNavigate()
  const dash = useQuery(() => fetchDashboard(), [])
  const members = useQuery(() => fetchMembers(), [])
  const review = useQuery(() => fetchOrders().then((rows) => rows.filter((o) => o.display_status === 'submitted')), [])
  const last30 = resolveRange({ preset: '30d' })
  const series = useQuery(() => fetchTimeseries(last30), [])

  const d = dash.data
  const loading = dash.loading && !d
  const target = d?.target
  const verified = d?.verified

  return (
    <>
      <PageHeader title="Overview" description={d ? d.settings.campaign_name : 'Campaign performance at a glance'} />
      {dash.error && !d && <ErrorState error={dash.error} />}

      {/* Campaign progress */}
      <section className="card p-5 sm:p-6" aria-labelledby="progress-h">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="progress-h" className="text-xs font-medium text-ink-2">
              Campaign progress · verified bottles
            </h2>
            {loading ? (
              <Skeleton className="mt-2 h-10 w-48" />
            ) : (
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">{n(verified.bottles)}</span>
                <span className="text-base text-ink-3">/ {n(target.campaign_target)} bottles</span>
              </p>
            )}
          </div>
          {!loading && (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-ink-3">Completion</dt>
                <dd className="font-semibold tabular-nums">{pct(target.completion_pct)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">Remaining</dt>
                <dd className="font-semibold tabular-nums">{n(target.remaining)} bottles</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">AJK at target</dt>
                <dd className="font-semibold tabular-nums">
                  {d.members.reached} / {d.members.total}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">Below target</dt>
                <dd className="font-semibold tabular-nums">{d.members.total - d.members.reached}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="mt-5">
          {loading ? <Skeleton className="h-3 w-full" /> : <ProgressBar value={verified.bottles} max={target.campaign_target} size="lg" label="Campaign target completion" />}
        </div>
        {!loading && d.pending.bottles > 0 && (
          <p className="mt-2 text-xs text-ink-3">
            + {n(d.pending.bottles)} bottles pending verification (not counted)
          </p>
        )}
      </section>

      {/* Financial KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi loading={loading} label="Gross sales" info={DEFINITIONS.gross} value={verified && rm(verified.gross)} sub="Before discounts" />
        <Kpi loading={loading} label="Discounts" info={DEFINITIONS.discounts} value={verified && rm(verified.discounts)} sub={verified && `${n(verified.promo_bottles)} promo bottles`} />
        <Kpi loading={loading} label="Net sales collected" info={DEFINITIONS.net} value={verified && rm(verified.net)} sub="Verified payments" />
        <Kpi loading={loading} label="Campaign profit" info={DEFINITIONS.profit} value={verified && rm(verified.profit)} sub="RM 10 × verified bottles" />
        <Kpi loading={loading} label="Paid orders" info={DEFINITIONS.verifiedBottles} value={verified && n(verified.orders)} sub={verified && `${n(verified.direct_orders)} without a code`} />
        <Kpi
          loading={loading}
          label="Pending payments"
          info={DEFINITIONS.pending}
          tone="muted"
          value={d && rm(d.pending.amount)}
          sub={d && `${n(d.pending.orders)} orders · ${n(d.pending.submitted_orders)} to review`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Card
          className="xl:col-span-3"
          title="Daily verified bottles"
          description="Last 30 days, by order date"
          actions={
            <Link to="/reports" className="btn btn-ghost h-8 px-2 text-xs">
              Reports <ArrowRight size={14} />
            </Link>
          }
        >
          {series.loading && !series.data ? (
            <Skeleton className="h-60 w-full" />
          ) : series.error && !series.data ? (
            <ErrorState error={series.error} />
          ) : (
            <ColumnChart
              data={fillDays(series.data, last30.from, last30.to)}
              x="day"
              y="verified_bottles"
              name="Verified bottles"
              xFormat={fmtDay}
              caption="Verified bottles sold per day over the last 30 days"
              tooltipRows={(r) => (r.pending_bottles ? <p className="text-ink-3">Pending: {r.pending_bottles}</p> : null)}
            />
          )}
        </Card>

        <Card
          className="xl:col-span-2"
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
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !members.data?.some((m) => m.verified_bottles > 0) ? (
            <EmptyState icon={Trophy} title="No verified sales yet">
              Rankings appear once the first payment is verified.
            </EmptyState>
          ) : (
            <ol className="divide-y divide-line">
              {members.data.slice(0, 5).map((m) => (
                <li key={m.member_id}>
                  <button type="button" onClick={() => navigate(`/members/${m.member_id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-canvas">
                    <span className="w-6 text-sm font-semibold text-ink-3 tabular-nums">{m.rank}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{displayName(m.full_name)}</span>
                      <span className="mt-1 block">
                        <ProgressBar value={m.verified_bottles} max={m.target} size="sm" label={`${displayName(m.full_name)} target progress`} />
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{m.verified_bottles}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card
        className="mt-4"
        title="Payments to review"
        description="Submitted by customers, waiting for an admin to check the transfer"
        bodyClass="p-0"
        actions={
          <Link to="/payments" className="btn btn-ghost h-8 px-2 text-xs">
            All payments <ArrowRight size={14} />
          </Link>
        }
      >
        {review.loading && !review.data ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : !review.data?.length ? (
          <EmptyState icon={CheckCircle2} title="All caught up">
            No payments are waiting for review.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {review.data.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-canvas">
                  <Clock size={15} className="text-info" aria-hidden="true" />
                  <span className="font-medium tabular-nums">{o.reference}</span>
                  <span className="text-ink-2">{o.customer_name}</span>
                  <span className="text-ink-3">{fmtDateTime(o.submission_at)}</span>
                  {o.duplicate_transfer_reference && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-warn">
                      <Copy size={12} /> Duplicate reference
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-3">
                    <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
                    <span className="font-semibold tabular-nums">{rm(o.final_amount)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
