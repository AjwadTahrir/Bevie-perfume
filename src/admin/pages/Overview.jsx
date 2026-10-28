import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCheck, FileText, MoreHorizontal, ShoppingBag, Trophy } from 'lucide-react'
import { EmptyState, ErrorState, InfoTip, Skeleton, StatusBadge } from '../components/ui'
import { MiniBars, Sparkline, TrendChart, fillDays } from '../components/charts'
import { fetchDashboard, fetchMembers, fetchOrders, fetchTimeseries } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/data'
import { displayName, fmtDate, fmtDay, n, pct, rm } from '../lib/format'
import { PERIODS, change, foldDays, periodRange, recentBuckets } from '../lib/periods'
import { DISPLAY_STATUS } from '../lib/status'
import { initials } from '../components/Layout'

export const DEFINITIONS = {
  verifiedBottles: 'Bottles in orders whose payment an admin has verified. Pending, rejected, cancelled and refunded orders are excluded.',
  gross: 'Verified bottles at the full selling price (quantity × selling price at the time of each order), before promo discounts.',
  discounts: 'Promo-code discounts granted on verified orders (RM 5 per bottle with a valid AJK code).',
  net: 'Money actually collected on verified orders: gross sales minus discounts.',
  profit: 'Campaign profit on verified orders: the profit per bottle set in Settings × verified bottles. Discounts are not subtracted again.',
  pending: 'Orders awaiting payment or with a payment submitted but not yet verified. Not counted as sales.',
}

/** Colours for people tiles, picked by name so a person keeps theirs everywhere. */
const TILE = ['bg-[#f59e0b]', 'bg-[#f43f5e]', 'bg-[#2563eb]', 'bg-[#7c5cff]', 'bg-ink', 'bg-[#0ea5a4]']
export const tileFor = (name) => TILE[[...String(name)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TILE.length]

function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-MY', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kuala_Lumpur' }).format(new Date()))
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

/** "RM 3,975" with the sen set smaller, as the reference sets cents. */
function Money({ value, className = '' }) {
  const [whole, sen] = rm(value).split('.')
  return (
    <span className={className}>
      {whole}
      <span className="text-[0.55em] font-medium opacity-60">.{sen}</span>
    </span>
  )
}

function Change({ value, against }) {
  if (value == null) return <span className="text-[0.8125rem] text-ink-3">No sales {against} to compare</span>
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="flex items-center gap-2 text-[0.8125rem] text-ink-3">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'}`}>
        <Icon size={13} strokeWidth={2.25} aria-hidden="true" />
        {pct(Math.abs(value))}
        <span className="sr-only">{up ? 'up' : 'down'}</span>
      </span>
      vs {against}
    </span>
  )
}

export default function Overview() {
  const navigate = useNavigate()
  const { admin } = useAuth()
  const [kind, setKind] = useState('month')
  const period = periodRange(kind)
  const dash = useQuery(() => fetchDashboard(), [])
  const now = useQuery(() => fetchDashboard({ from: period.from, to: period.to }), [period.from])
  const before = useQuery(() => fetchDashboard({ from: period.prevFrom, to: period.prevTo }), [period.prevFrom])
  const members = useQuery(() => fetchMembers(), [])
  const orders = useQuery(() => fetchOrders(), [])
  // Trend: days for week and month, weeks for the quarter.
  const trendFrom = kind === 'quarter' ? recentBuckets('week', 13)[0].start.toISOString() : period.from
  const series = useQuery(() => fetchTimeseries({ from: trendFrom, to: period.to }), [trendFrom, period.to])

  const d = dash.data
  const loading = dash.loading && !d
  const name = displayName(String(admin?.username || '').split('@')[0].replace(/[._-]+/g, ' ')) || 'there'
  const toReview = d?.pending.submitted_orders ?? 0
  const periodBottles = now.data?.verified.bottles ?? 0
  const delta = change(periodBottles, before.data?.verified.bottles ?? 0)
  const daily = fillDays(series.data, period.from, period.to)
  const trend =
    kind === 'quarter'
      ? foldDays(series.data, recentBuckets('week', 13), ['verified_bottles', 'pending_bottles']).map((b) => ({ day: b.label, verified_bottles: b.verified_bottles, pending_bottles: b.pending_bottles }))
      : daily
  const sparkValues = kind === 'quarter' ? trend.map((t) => t.verified_bottles) : daily.map((t) => t.verified_bottles)
  const top = (members.data || []).filter((m) => m.verified_bottles > 0).slice(0, 3)
  const recent = (orders.data || []).slice(0, 6)
  const filled = d ? Math.min(12, Math.round((d.target.completion_pct / 100) * 12)) : 0

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.625rem] leading-tight sm:text-[1.75rem]">
            {greeting()}, {name}
          </h1>
          <p className="mt-1 text-[0.9375rem] text-ink-2">Here's where the {d ? d.settings.campaign_name : 'campaign'} stands today.</p>
        </div>
        <div className="segmented" role="group" aria-label="Period">
          {PERIODS.map((p) => (
            <button key={p.key} type="button" className="segment px-4" aria-pressed={kind === p.key} onClick={() => setKind(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </header>
      {dash.error && !d && <ErrorState error={dash.error} />}

      {/* Top row: the campaign fund, bottles this period, target progress */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr]">
        <section className="relative isolate flex min-h-[11.5rem] flex-col overflow-hidden rounded-2xl bg-espresso p-5 text-white md:col-span-2 xl:col-span-1" aria-labelledby="fund-h">
          <span className="pointer-events-none absolute -right-16 -bottom-24 -z-10 size-72 rounded-full bg-[radial-gradient(circle,rgba(215,242,107,0.45),rgba(215,242,107,0)_65%)]" aria-hidden="true" />
          <h2 id="fund-h" className="flex items-center gap-1.5 text-[0.8125rem] text-white/70">
            Campaign fund · {d ? `${n(d.verified.orders)} verified orders` : 'verified revenue'}
            <InfoTip text={DEFINITIONS.net} />
          </h2>
          {loading ? <div className="mt-3 h-10 w-52 rounded-lg bg-white/10" /> : <Money value={d.verified.net} className="display mt-2 text-[2.25rem] leading-none sm:text-[2.5rem]" />}
          <p className="mt-2 text-[0.8125rem] text-white/60">{d && `${rm(d.verified.profit)} campaign profit · ${rm(d.pending.amount)} pending`}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <Link to="/payments" className="btn btn-lime h-9">
              <CheckCheck size={15} aria-hidden="true" />
              Review{toReview ? ` ${toReview}` : ''}
            </Link>
            <Link to="/orders" className="btn h-9 bg-white/10 text-white hover:bg-white/15">
              <ShoppingBag size={15} aria-hidden="true" />
              Orders
            </Link>
            <Link to="/reports" className="btn h-9 bg-white/10 text-white hover:bg-white/15">
              <FileText size={15} aria-hidden="true" />
              Reports
            </Link>
          </div>
        </section>

        <section className="card flex flex-col p-5" aria-labelledby="period-h">
          <h2 id="period-h" className="kpi-label flex items-center gap-1.5">
            Bottles sold {kind === 'week' ? '' : 'in '}
            {period.name}
            <InfoTip text={DEFINITIONS.verifiedBottles} />
          </h2>
          {now.loading && !now.data ? <Skeleton className="mt-2 h-9 w-24" /> : <p className="display mt-1.5 text-[2.25rem] leading-none">{n(periodBottles)}</p>}
          <div className="mt-2.5">{before.data && now.data && <Change value={delta} against={period.prevName} />}</div>
          <div className="mt-auto pt-3">
            <Sparkline values={sparkValues} />
          </div>
        </section>

        <section className="card flex flex-col p-5" aria-labelledby="target-h">
          <h2 id="target-h" className="kpi-label">
            Campaign target
          </h2>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-28" />
          ) : (
            <p className="display mt-1.5 text-[2.25rem] leading-none">
              {n(d.verified.bottles)}
              <span className="text-[0.55em] font-medium text-ink-3">/{n(d.target.campaign_target)}</span>
            </p>
          )}
          {d && (
            <p className="mt-2.5 flex items-center gap-2 text-[0.8125rem] text-ink-3">
              <span className="rounded-full bg-lime-soft px-2 py-0.5 text-xs font-semibold text-[#3f5200] ring-1 ring-lime-deep/40 ring-inset">{pct(d.target.completion_pct)}</span>
              {d.target.remaining ? `${n(d.target.remaining)} bottles to go` : 'Target reached'}
            </p>
          )}
          <div className="mt-auto pt-3" role="progressbar" aria-label="Campaign target completion" aria-valuemin={0} aria-valuemax={d?.target.campaign_target ?? 180} aria-valuenow={d?.verified.bottles ?? 0}>
            <MiniBars filled={filled} />
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="card min-w-0 p-5" aria-labelledby="trend-h">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="trend-h" className="text-[0.9375rem] font-semibold">
              Sales trend
            </h2>
            <p className="flex items-center gap-4 text-[0.8125rem] text-ink-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-ink" aria-hidden="true" /> Verified bottles
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#a1a1aa]" aria-hidden="true" /> Pending
              </span>
            </p>
          </div>
          {series.loading && !series.data ? (
            <Skeleton className="h-[250px] w-full" />
          ) : series.error && !series.data ? (
            <ErrorState error={series.error} />
          ) : (
            <TrendChart
              data={trend}
              x="day"
              series={[
                { key: 'verified_bottles', name: 'Verified' },
                { key: 'pending_bottles', name: 'Pending' },
              ]}
              xFormat={kind === 'quarter' ? (v) => `w/c ${v}` : fmtDay}
              caption={`Verified and pending bottles per ${kind === 'quarter' ? 'week' : 'day'}, ${period.name}`}
            />
          )}
        </section>

        <section className="card min-w-0 p-5" aria-labelledby="top-h">
          <div className="flex items-center justify-between">
            <h2 id="top-h" className="text-[0.9375rem] font-semibold">
              Top sellers
            </h2>
            <Link to="/leaderboard" className="btn btn-ghost size-8 rounded-lg px-0" aria-label="Open the leaderboard" title="Leaderboard">
              <MoreHorizontal size={18} />
            </Link>
          </div>
          <p className="text-xs text-ink-3">All time · ranked by verified bottles</p>
          {members.loading && !members.data ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !top.length ? (
            <EmptyState icon={Trophy} title="No verified sales yet">
              The top three appear once the first payment is verified.
            </EmptyState>
          ) : (
            <ol className="mt-2 divide-y divide-line">
              {top.map((m) => (
                <li key={m.member_id}>
                  <button type="button" onClick={() => navigate(`/members/${m.member_id}`)} className="flex w-full items-center gap-3 rounded-lg py-3.5 text-left transition-colors hover:bg-tint/60">
                    <span className={`avatar ${tileFor(m.full_name)}`} aria-hidden="true">
                      {displayName(m.full_name)[0]}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[0.9375rem] font-medium">{displayName(m.full_name)}</span>
                      <span className="block truncate text-xs text-ink-3">
                        #{m.rank} · {m.committee_role}
                      </span>
                    </span>
                    <span className="text-right leading-tight">
                      <span className="block font-semibold tabular-nums">{m.verified_bottles} btl</span>
                      <span className="text-xs text-ink-3 tabular-nums">{rm(m.revenue)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <Link to="/leaderboard" className="mt-2 inline-flex items-center gap-1 text-[0.8125rem] font-medium hover:underline">
            Full leaderboard <ArrowRight size={14} />
          </Link>
        </section>
      </div>

      <section className="card mt-4 min-w-0 p-5" aria-labelledby="recent-h">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="recent-h" className="text-[0.9375rem] font-semibold">
            Recent orders
          </h2>
          <Link to="/orders" className="inline-flex items-center gap-1 text-[0.8125rem] font-medium hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {orders.loading && !orders.data ? (
          <div className="space-y-3 pt-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !recent.length ? (
          <EmptyState icon={ShoppingBag} title="No orders yet">
            Orders placed on the website appear here automatically.
          </EmptyState>
        ) : (
          <div className="relative -mx-5 overflow-x-auto px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="th pl-0">Customer</th>
                  <th className="th">Reference</th>
                  <th className="th">Promo code</th>
                  <th className="th">Date</th>
                  <th className="th">Status</th>
                  <th className="th pr-0 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((o) => (
                  <tr key={o.id} tabIndex={0} onClick={() => navigate(`/orders/${o.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${o.id}`)} className="row-link">
                    <td className="td pl-0">
                      <span className="flex items-center gap-3">
                        <span className={`avatar size-8 rounded-[9px] text-xs ${tileFor(o.customer_name)}`} aria-hidden="true">
                          {initials(o.customer_name)[0]}
                        </span>
                        <span className="font-medium">{o.customer_name}</span>
                      </span>
                    </td>
                    <td className="td font-mono text-[0.8125rem] text-ink-2">{o.reference}</td>
                    <td className="td text-ink-2">{o.promo_code || '—'}</td>
                    <td className="td text-ink-2">{fmtDate(o.created_at)}</td>
                    <td className="td">
                      <StatusBadge map={DISPLAY_STATUS} value={o.display_status} />
                    </td>
                    <td className="td pr-0 text-right font-medium tabular-nums">{rm(o.final_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
