import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Card, ErrorState, Kpi, PageHeader, Skeleton } from '../components/ui'
import { ColumnChart, RankChart, TwoLineChart, fillDays } from '../components/charts'
import DateRangeFilter from '../components/DateRangeFilter'
import { fetchDashboard, fetchMembers, fetchOrders, fetchTimeseries } from '../lib/api'
import { useQuery } from '../lib/data'
import { DEFAULT_RANGE, resolveRange } from '../lib/dateRange'
import { fmtDate, fmtDay, n, pct, rm, rmShort } from '../lib/format'
import { DISPLAY_STATUS, MEMBER_STATUS } from '../lib/status'
import { downloadCsv, stamp } from '../lib/csv'
import { MEMBER_CSV } from './Members'
import { ORDER_CSV } from './Orders'
import { DEFINITIONS } from './Overview'

export default function Reports() {
  const [range, setRange] = useState(DEFAULT_RANGE)
  const r = resolveRange(range)
  const deps = [r.from, r.to]
  const dash = useQuery(() => fetchDashboard(r), deps)
  const members = useQuery(() => fetchMembers(r), deps)
  const series = useQuery(() => fetchTimeseries(r), deps)
  const [exporting, setExporting] = useState(false)

  const d = dash.data
  const v = d?.verified
  const loading = dash.loading && !d
  // Say exactly which orders the figures cover, so the page and its exports agree.
  const lastDay = r.to ? fmtDate(new Date(new Date(r.to).getTime() - 1)) : null
  const periodLabel =
    r.from && lastDay
      ? `Orders placed ${fmtDate(r.from)} – ${lastDay}`
      : r.from
        ? `Orders placed from ${fmtDate(r.from)}`
        : lastDay
          ? `Orders placed up to ${lastDay}`
          : 'All orders, all time'

  const bureaus = useMemo(() => {
    const map = new Map()
    for (const m of members.data || []) {
      const b = map.get(m.committee_role) || { bureau: m.committee_role, members: 0, reached: 0, bottles: 0, pending: 0, revenue: 0, profit: 0 }
      b.members += 1
      b.reached += m.status === 'target_reached' ? 1 : 0
      b.bottles += m.verified_bottles
      b.pending += m.pending_bottles
      b.revenue += Number(m.revenue)
      b.profit += Number(m.profit)
      map.set(m.committee_role, b)
    }
    return [...map.values()].sort((a, b) => b.bottles - a.bottles)
  }, [members.data])

  const days = useMemo(() => fillDays(series.data, r.from, r.to), [series.data, r.from, r.to])
  const targetDist = Object.entries(MEMBER_STATUS).map(([k, s]) => ({ status: s.label, members: (members.data || []).filter((m) => m.status === k).length }))
  const statusDist = Object.entries(DISPLAY_STATUS).map(([k, s]) => ({ status: s.label, orders: d?.status_counts?.[k] ?? 0 }))

  const exportOrders = async () => {
    setExporting(true)
    try {
      downloadCsv(`jetha-orders-${range.preset}-${stamp()}.csv`, ORDER_CSV, await fetchOrders(r))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Fundraising summary for the outbound programme. All figures use verified payments only, filtered by order date."
        actions={
          <>
            <button type="button" className="btn btn-secondary" disabled={!members.data} onClick={() => downloadCsv(`jetha-leaderboard-${range.preset}-${stamp()}.csv`, MEMBER_CSV, members.data)}>
              <Download size={15} /> Leaderboard CSV
            </button>
            <button type="button" className="btn btn-secondary" disabled={exporting} onClick={exportOrders}>
              <Download size={15} /> {exporting ? 'Preparing…' : 'Orders CSV'}
            </button>
          </>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
        <p className="text-xs text-ink-3">{periodLabel}</p>
      </div>
      {dash.error && !d && <ErrorState error={dash.error} />}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <Kpi accent loading={loading} label="Verified bottles" info={DEFINITIONS.verifiedBottles} value={v && n(v.bottles)} sub={d && `${pct(d.target.completion_pct)} of ${n(d.target.campaign_target)} target`} />
        <Kpi loading={loading} label="Revenue collected" info={DEFINITIONS.net} value={v && rm(v.net)} sub={v && `Gross ${rm(v.gross)} · Postage ${rm(v.postage)} extra`} />
        <Kpi loading={loading} label="Discounts given" info={DEFINITIONS.discounts} value={v && rm(v.discounts)} />
        <Kpi loading={loading} label="Campaign profit" info={DEFINITIONS.profit} value={v && rm(v.profit)} />
        <Kpi loading={loading} label="Pending payments" info={DEFINITIONS.pending} tone="muted" value={d && rm(d.pending.amount)} sub={d && `${n(d.pending.orders)} orders`} />
        <Kpi loading={loading} label="Paid orders" value={v && n(v.orders)} />
        <Kpi loading={loading} label="Avg bottles / paid order" value={v && (v.orders ? (v.bottles / v.orders).toFixed(2) : '—')} />
        <Kpi loading={loading} label="Average order value" value={v && (v.orders ? rm(v.net / v.orders) : '—')} sub="Collected per paid order" />
        <Kpi loading={loading} label="AJK at target" value={d && `${d.members.reached} / ${d.members.total}`} sub={d && pct((d.members.reached / d.members.total) * 100)} />
        <Kpi loading={loading} label="Remaining to target" value={d && `${n(d.target.remaining)} bottles`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Daily sales" description="Verified bottles per day">
          {series.loading && !series.data ? <Skeleton className="h-60" /> : <ColumnChart data={days} x="day" y="verified_bottles" name="Verified bottles" xFormat={fmtDay} caption="Verified bottles per day" />}
        </Card>
        <Card title="Revenue and profit" description="Per day, verified orders, in RM">
          {series.loading && !series.data ? (
            <Skeleton className="h-60" />
          ) : (
            <TwoLineChart
              data={days}
              x="day"
              series={[
                { key: 'revenue', name: 'Revenue collected' },
                { key: 'profit', name: 'Campaign profit' },
              ]}
              xFormat={fmtDay}
              valueFormat={rmShort}
              caption="Revenue collected and campaign profit per day"
            />
          )}
        </Card>
        <Card title="Bottles by bureau" description="Verified bottles per Jawatan / Biro">
          {members.loading && !members.data ? (
            <Skeleton className="h-60" />
          ) : (
            <RankChart data={bureaus} label="bureau" y="bottles" name="Verified bottles" caption="Verified bottles by bureau" labelWidth={160} />
          )}
        </Card>
        <Card title="AJK target completion" description={`Members by status against their ${members.data?.[0]?.target ?? 5}-bottle target`}>
          {members.loading && !members.data ? <Skeleton className="h-60" /> : <ColumnChart data={targetDist} x="status" y="members" name="Members" height={220} caption="AJK members by target status" />}
        </Card>
        <Card title="Payment status" description="All orders in this period, by current status" className="xl:col-span-2">
          {loading ? <Skeleton className="h-48" /> : <RankChart data={statusDist} label="status" y="orders" name="Orders" caption="Orders by payment status" labelWidth={140} />}
        </Card>
      </div>

      <Card className="mt-4" title="Performance by bureau" bodyClass="p-0">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="th">Jawatan / Biro</th>
                <th className="th text-right">Members</th>
                <th className="th text-right">At target</th>
                <th className="th text-right">Verified bottles</th>
                <th className="th text-right">Pending bottles</th>
                <th className="th text-right">Revenue</th>
                <th className="th text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {bureaus.map((b) => (
                <tr key={b.bureau}>
                  <td className="td font-medium">{b.bureau}</td>
                  <td className="td text-right tabular-nums">{b.members}</td>
                  <td className="td text-right tabular-nums">{b.reached}</td>
                  <td className="td text-right font-semibold tabular-nums">{b.bottles}</td>
                  <td className="td text-right text-ink-3 tabular-nums">{b.pending}</td>
                  <td className="td text-right tabular-nums">{rm(b.revenue)}</td>
                  <td className="td text-right tabular-nums">{rm(b.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-xs text-ink-3">
        Bureau totals cover orders made with an AJK code. Orders without a code count in the campaign totals above but belong to no bureau.
      </p>
    </>
  )
}
