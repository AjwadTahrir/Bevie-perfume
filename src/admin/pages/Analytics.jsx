import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { EmptyState, ErrorState, Skeleton } from '../components/ui'
import { DonutChart, PillBarChart } from '../components/charts'
import { fetchDashboard, fetchMembers, fetchTimeseries } from '../lib/api'
import { useQuery } from '../lib/data'
import { displayName, n, rm, rmShort } from '../lib/format'
import { BUCKETS, PERIODS, foldDays, periodRange, recentBuckets } from '../lib/periods'
import { tileFor } from './Overview'

const BAR_NAME = { week: 'Weekly bottles', month: 'Monthly bottles', quarter: 'Quarterly bottles' }
const CURRENT = { week: 'This week', month: 'This month', quarter: 'This quarter' }
// Ranked-list fills, following the reference: black, violet, lime, then black.
const RANK_FILL = ['bg-ink', 'bg-[#9d8cf4]', 'bg-[#c6e84a]']

/**
 * Bureau shares of verified revenue for the period. Sales without a
 * promo code belong to no bureau and get their own slice. Four slices
 * at most, the rest folded into "Other" (grey).
 */
function bureauSlices(members, totalNet) {
  const by = new Map()
  for (const m of members || []) by.set(m.committee_role, (by.get(m.committee_role) || 0) + Number(m.revenue))
  const attributed = [...by.values()].reduce((a, b) => a + b, 0)
  const rows = [...by].map(([label, value]) => ({ label, value })).filter((r) => r.value > 0)
  const direct = Math.max(0, (Number(totalNet) || 0) - attributed)
  if (direct > 0) rows.push({ label: 'Without a promo code', value: direct })
  rows.sort((a, b) => b.value - a.value)
  if (rows.length <= 5) return rows
  const rest = rows.slice(4).reduce((a, r) => a + r.value, 0)
  return [...rows.slice(0, 4), { label: `Other (${rows.length - 4})`, value: rest, other: true }]
}

export default function Analytics() {
  const navigate = useNavigate()
  const [kind, setKind] = useState('month')
  const period = periodRange(kind)
  const buckets = recentBuckets(kind, BUCKETS[kind])
  const r = { from: period.from, to: period.to }
  const dash = useQuery(() => fetchDashboard(r), [r.from])
  const members = useQuery(() => fetchMembers(r), [r.from])
  const series = useQuery(() => fetchTimeseries({ from: buckets[0].start.toISOString(), to: period.to }), [buckets[0].key])

  const slices = bureauSlices(members.data, dash.data?.verified.net)
  const bars = foldDays(series.data, buckets, ['verified_bottles', 'revenue']).map((b) => ({ key: b.key, label: b.label, value: b.verified_bottles, revenue: b.revenue, current: b.current }))
  const sellers = (members.data || []).filter((m) => Number(m.revenue) > 0).slice(0, 5)
  const maxRevenue = Math.max(1, ...sellers.map((m) => Number(m.revenue)))

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.625rem] leading-tight sm:text-[1.75rem]">Analytics</h1>
          <p className="mt-1 text-[0.9375rem] text-ink-2">Where the sales came from {kind === 'week' ? '' : 'in '}{period.name}</p>
        </div>
        <div className="segmented" role="group" aria-label="Period">
          {PERIODS.map((p) => (
            <button key={p.key} type="button" className="segment px-4" aria-pressed={kind === p.key} onClick={() => setKind(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </header>
      {(dash.error || members.error) && !dash.data && <ErrorState error={dash.error || members.error} />}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1.42fr]">
        <section className="card p-5" aria-labelledby="bureau-h">
          <h2 id="bureau-h" className="text-[0.9375rem] font-semibold">
            Sales by bureau
          </h2>
          <p className="mb-5 text-xs text-ink-3">Share of verified revenue by the AJK member's Jawatan / Biro</p>
          {(dash.loading && !dash.data) || (members.loading && !members.data) ? (
            <Skeleton className="mx-auto aspect-square w-full max-w-[15rem] rounded-full" />
          ) : (
            <DonutChart
              data={slices}
              total={rmShort(dash.data?.verified.net)}
              totalLabel="Total"
              valueFormat={rm}
              caption={`Verified revenue by bureau, ${period.name}`}
            />
          )}
        </section>

        <div className="grid min-w-0 gap-4">
          <section className="card min-w-0 p-5" aria-labelledby="bars-h">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="bars-h" className="text-[0.9375rem] font-semibold">
                {BAR_NAME[kind]}
              </h2>
              <p className="flex items-center gap-4 text-[0.8125rem] text-ink-2">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-ink" aria-hidden="true" /> {new Date().getFullYear()}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-lime" aria-hidden="true" /> {CURRENT[kind]}
                </span>
              </p>
            </div>
            {series.loading && !series.data ? (
              <Skeleton className="h-[230px] w-full" />
            ) : (
              <PillBarChart
                data={bars}
                name="Verified bottles"
                valueFormat={n}
                caption={`${BAR_NAME[kind]} sold, verified payments only`}
                tooltipRows={(row) => <p className="mt-0.5 text-white/70">Revenue {rm(row.revenue)}</p>}
              />
            )}
          </section>

          <section className="card min-w-0 p-5" aria-labelledby="sellers-h">
            <h2 id="sellers-h" className="text-[0.9375rem] font-semibold">
              Top AJK sellers
            </h2>
            <p className="mb-2 text-xs text-ink-3">Verified revenue {kind === 'week' ? '' : 'in '}{period.name}</p>
            {members.loading && !members.data ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !sellers.length ? (
              <EmptyState icon={Trophy} title={`No verified sales ${kind === 'week' ? '' : 'in '}${period.name} yet`} />
            ) : (
              <ol className="divide-y divide-dashed divide-line">
                {sellers.map((m, i) => (
                  <li key={m.member_id}>
                    <button type="button" onClick={() => navigate(`/members/${m.member_id}`)} className="grid w-full grid-cols-[auto_minmax(6rem,11rem)_1fr_auto] items-center gap-3 rounded-lg py-3 text-left transition-colors hover:bg-tint/60 max-sm:grid-cols-[auto_1fr_auto]">
                      <span className={`avatar ${tileFor(m.full_name)}`} aria-hidden="true">
                        {displayName(m.full_name)[0]}
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-[0.9375rem]">{displayName(m.full_name).split(' ').slice(0, 2).join(' ')}</span>
                        <span className="block truncate text-xs text-ink-3">{n(m.verified_bottles)} bottles</span>
                      </span>
                      <span className="h-2 overflow-hidden rounded-full bg-[#ececf0] max-sm:hidden" aria-hidden="true">
                        <span className={`block h-full rounded-full ${RANK_FILL[i] ?? 'bg-ink'}`} style={{ width: `${(Number(m.revenue) / maxRevenue) * 100}%` }} />
                      </span>
                      <span className="text-right font-semibold tabular-nums">{rm(m.revenue)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
