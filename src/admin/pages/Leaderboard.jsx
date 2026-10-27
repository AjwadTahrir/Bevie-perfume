import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Trophy } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, ProgressBar, Skeleton, StatusBadge, TableScroll } from '../components/ui'
import { ColumnChart, RankChart } from '../components/charts'
import DateRangeFilter from '../components/DateRangeFilter'
import { fetchMembers } from '../lib/api'
import { useQuery } from '../lib/data'
import { DEFAULT_RANGE, resolveRange } from '../lib/dateRange'
import { displayName, n, pct, rm } from '../lib/format'
import { MEMBER_STATUS } from '../lib/status'
import { downloadCsv, stamp } from '../lib/csv'
import { MEMBER_CSV } from './Members'

const METRICS = {
  verified_bottles: { label: 'Bottles', format: (v) => n(v) },
  revenue: { label: 'Revenue', format: (v) => rm(v) },
  profit: { label: 'Profit', format: (v) => rm(v) },
}

const PLACE = ['First', 'Second', 'Third']

/** Short label for chart axes: first two words of the title-cased name. */
const shortName = (name) => displayName(name).split(' ').slice(0, 2).join(' ')

export default function Leaderboard() {
  const navigate = useNavigate()
  const [range, setRange] = useState(DEFAULT_RANGE)
  const [metric, setMetric] = useState('verified_bottles')
  const r = resolveRange(range)
  const members = useQuery(() => fetchMembers(r), [r.from, r.to])
  const all = members.data || []
  const sellers = all.filter((m) => m.verified_bottles > 0)
  const top3 = sellers.slice(0, 3)
  const rest = all.slice(top3.length)
  const target = all[0]?.target ?? 5
  const totalBottles = sellers.reduce((s, m) => s + m.verified_bottles, 0)

  const top10 = [...sellers]
    .sort((a, b) => Number(b[metric]) - Number(a[metric]) || a.rank - b.rank)
    .slice(0, 10)
    .map((m) => ({ ...m, name: shortName(m.full_name), value: Number(m[metric]) }))

  const distribution = Array.from({ length: target + 1 }, (_, i) => ({
    bucket: i === target ? `${target}+` : String(i),
    members: all.filter((m) => (i === target ? m.verified_bottles >= target : m.verified_bottles === i)).length,
  }))

  return (
    <>
      <PageHeader
        eyebrow="Committee"
        title="Leaderboard"
        description="Ranked by verified bottles sold. Equal counts share a rank; the next rank skips accordingly (1, 1, 3)."
        actions={
          <button type="button" className="btn btn-secondary" disabled={!all.length} onClick={() => downloadCsv(`beavie-leaderboard-${stamp()}.csv`, MEMBER_CSV, all)}>
            <Download size={15} /> Export CSV
          </button>
        }
      />
      <div className="mb-5">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>
      {members.error && !members.data && <ErrorState error={members.error} />}

      {members.loading && !members.data ? (
        <Skeleton className="h-52" />
      ) : !top3.length ? (
        <div className="card">
          <EmptyState icon={Trophy} title="The competition hasn't started yet">
            The top three appear here as soon as payments are verified{range.preset !== 'all' ? ' in this period' : ''}.
          </EmptyState>
        </div>
      ) : (
        <ol className={`card grid divide-y divide-line md:divide-x md:divide-y-0 ${['', 'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3'][top3.length]}`} aria-label="Top three sellers">
          {top3.map((m) => {
            const tied = top3.filter((x) => x.rank === m.rank).length > 1
            const first = m.rank === 1
            return (
              <li key={m.member_id} className="min-w-0">
                <button type="button" onClick={() => navigate(`/members/${m.member_id}`)} className="group flex h-full w-full flex-col p-5 text-left transition-colors duration-150 hover:bg-tint/50 sm:p-6">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={`display text-[2.75rem] leading-none ${first ? 'text-brand-deep' : 'text-ink-3'}`}>{m.rank}</span>
                    <span className="eyebrow">
                      {PLACE[m.rank - 1] ?? `Rank ${m.rank}`} place{tied ? ' · tied' : ''}
                    </span>
                  </span>
                  <span className={`mt-4 block h-px w-10 ${first ? 'bg-gold' : 'bg-line-strong'}`} aria-hidden="true" />
                  <span className="display mt-4 block text-lg leading-snug group-hover:text-brand-deep">{displayName(m.full_name)}</span>
                  <span className="mt-0.5 text-xs text-ink-3">{m.committee_role}</span>
                  <span className="mt-5 flex items-baseline gap-1.5">
                    <span className="display text-3xl leading-none">{m.verified_bottles}</span>
                    <span className="text-sm text-ink-3">bottles · {pct(totalBottles ? (m.verified_bottles / totalBottles) * 100 : 0)} of sales</span>
                  </span>
                  <span className="mt-3 flex items-center gap-2">
                    <ProgressBar value={m.verified_bottles} max={m.target} size="sm" label={`${displayName(m.full_name)} target progress`} />
                    <span className="text-[0.6875rem] whitespace-nowrap text-ink-3 tabular-nums">
                      {Math.min(m.verified_bottles, m.target)}/{m.target}
                    </span>
                  </span>
                  <span className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4 text-xs">
                    <span>
                      <span className="eyebrow block">Revenue</span>
                      <span className="mt-1 block font-medium tabular-nums">{rm(m.revenue)}</span>
                    </span>
                    <span>
                      <span className="eyebrow block">Profit</span>
                      <span className="mt-1 block font-medium tabular-nums">{rm(m.profit)}</span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Card
          className="xl:col-span-3"
          title="Top 10 sellers"
          description="Click a bar to open the member"
          actions={
            <div className="segmented" role="group" aria-label="Chart metric">
              {Object.entries(METRICS).map(([k, v]) => (
                <button key={k} type="button" aria-pressed={metric === k} onClick={() => setMetric(k)} className="segment h-7 px-2.5">
                  {v.label}
                </button>
              ))}
            </div>
          }
        >
          <RankChart
            data={top10}
            label="name"
            y="value"
            name={METRICS[metric].label}
            valueFormat={METRICS[metric].format}
            onSelect={(d) => navigate(`/members/${d.member_id}`)}
            caption={`Top ten sellers by ${METRICS[metric].label.toLowerCase()}`}
          />
        </Card>
        <Card className="xl:col-span-2" title="Sales distribution" description="How many code holders have sold each number of verified bottles">
          <ColumnChart
            data={distribution}
            x="bucket"
            y="members"
            name="Members"
            xFormat={(b) => `${b} bottle${b === '1' ? '' : 's'}`}
            height={220}
            caption="Number of members by verified bottles sold"
          />
        </Card>
      </div>

      <Card className="mt-4" title="Full ranking" description={`${n(sellers.length)} of ${n(all.length)} code holders have verified sales`} bodyClass="p-0">
        <TableScroll label="Full ranking">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="th w-16">Rank</th>
                <th className="th">Member</th>
                <th className="th text-right">Bottles</th>
                <th className="th w-44">Target</th>
                <th className="th text-right">Revenue</th>
                <th className="th text-right">Profit</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rest.map((m) => (
                <tr key={m.member_id} tabIndex={0} onClick={() => navigate(`/members/${m.member_id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/members/${m.member_id}`)} className="row-link">
                  <td className="td display text-base text-ink-3">{m.verified_bottles > 0 ? m.rank : '—'}</td>
                  <td className="td">
                    <span className="block font-medium">{displayName(m.full_name)}</span>
                    <span className="text-xs text-ink-3">{m.committee_role}</span>
                  </td>
                  <td className="td display text-right text-base">{m.verified_bottles}</td>
                  <td className="td">
                    <span className="flex items-center gap-2">
                      <ProgressBar value={m.verified_bottles} max={m.target} size="sm" label={`${displayName(m.full_name)}: ${m.verified_bottles} of ${m.target}`} />
                      <span className="w-8 text-right text-xs text-ink-3 tabular-nums">
                        {Math.min(m.verified_bottles, m.target)}/{m.target}
                      </span>
                    </span>
                  </td>
                  <td className="td text-right tabular-nums">{rm(m.revenue)}</td>
                  <td className="td text-right tabular-nums">{rm(m.profit)}</td>
                  <td className="td">
                    <StatusBadge map={MEMBER_STATUS} value={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>
    </>
  )
}
