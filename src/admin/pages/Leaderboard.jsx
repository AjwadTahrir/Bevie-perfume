import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Medal, Trophy } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, ProgressBar, Skeleton, StatusBadge } from '../components/ui'
import { ColumnChart, RankChart } from '../components/charts'
import DateRangeFilter from '../components/DateRangeFilter'
import { fetchMembers } from '../lib/api'
import { useQuery } from '../lib/data'
import { DEFAULT_RANGE, resolveRange } from '../lib/dateRange'
import { displayName, n, rm } from '../lib/format'
import { MEMBER_STATUS } from '../lib/status'
import { downloadCsv, stamp } from '../lib/csv'
import { MEMBER_CSV } from './Members'

const METRICS = {
  verified_bottles: { label: 'Bottles', format: (v) => n(v) },
  revenue: { label: 'Revenue', format: (v) => rm(v) },
  profit: { label: 'Profit', format: (v) => rm(v) },
}

const PLACES = [
  { ring: 'ring-gold/40', bg: 'bg-gold-soft', text: 'text-gold', label: '1st place', icon: Trophy },
  { ring: 'ring-silver/40', bg: 'bg-silver-soft', text: 'text-silver', label: '2nd place', icon: Medal },
  { ring: 'ring-bronze/40', bg: 'bg-bronze-soft', text: 'text-bronze', label: '3rd place', icon: Medal },
]

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
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : !top3.length ? (
        <div className="card">
          <EmptyState icon={Trophy} title="The competition hasn't started yet">
            The top three appear here as soon as payments are verified{range.preset !== 'all' ? ' in this period' : ''}.
          </EmptyState>
        </div>
      ) : (
        <ol className="grid gap-3 md:grid-cols-3" aria-label="Top three sellers">
          {top3.map((m, i) => {
            const p = PLACES[Math.min(m.rank, 3) - 1]
            const Icon = p.icon
            return (
              <li key={m.member_id}>
                <button
                  type="button"
                  onClick={() => navigate(`/members/${m.member_id}`)}
                  className={`card rise flex h-full w-full flex-col p-5 text-left ring-1 transition-shadow hover:shadow-md ${p.ring} ${i === 0 ? 'md:-translate-y-1' : ''}`}
                >
                  <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-semibold ${p.bg} ${p.text}`}>
                    <Icon size={14} aria-hidden="true" /> {p.label}
                    {top3.filter((x) => x.rank === m.rank).length > 1 && ' (tied)'}
                  </span>
                  <span className="mt-4 block text-base font-semibold">{displayName(m.full_name)}</span>
                  <span className="text-xs text-ink-3">{m.committee_role}</span>
                  <span className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tabular-nums">{m.verified_bottles}</span>
                    <span className="text-sm text-ink-3">bottles</span>
                  </span>
                  <span className="mt-3 block">
                    <ProgressBar value={m.verified_bottles} max={m.target} size="sm" label="Target progress" />
                  </span>
                  <span className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <span>
                      <span className="block text-ink-3">Revenue</span>
                      <span className="font-medium tabular-nums">{rm(m.revenue)}</span>
                    </span>
                    <span>
                      <span className="block text-ink-3">Profit</span>
                      <span className="font-medium tabular-nums">{rm(m.profit)}</span>
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
            <div className="inline-flex rounded-lg border border-line-strong p-0.5" role="group" aria-label="Chart metric">
              {Object.entries(METRICS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={metric === k}
                  onClick={() => setMetric(k)}
                  className={`h-7 rounded-md px-2.5 text-xs font-medium ${metric === k ? 'bg-navy text-white' : 'text-ink-2 hover:text-ink'}`}
                >
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
        <Card className="xl:col-span-2" title="Sales distribution" description="How many AJK members have sold each number of verified bottles">
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

      <Card className="mt-4" title="Full ranking" bodyClass="p-0">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-canvas/60">
              <tr>
                <th className="th">Rank</th>
                <th className="th">Member</th>
                <th className="th text-right">Bottles</th>
                <th className="th w-40">Target</th>
                <th className="th text-right">Revenue</th>
                <th className="th text-right">Profit</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rest.map((m) => (
                <tr key={m.member_id} tabIndex={0} onClick={() => navigate(`/members/${m.member_id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/members/${m.member_id}`)} className="cursor-pointer hover:bg-canvas">
                  <td className="td text-ink-3 tabular-nums">{m.verified_bottles > 0 ? m.rank : '—'}</td>
                  <td className="td">
                    <span className="block font-medium">{displayName(m.full_name)}</span>
                    <span className="text-xs text-ink-3">{m.committee_role}</span>
                  </td>
                  <td className="td text-right font-semibold tabular-nums">{m.verified_bottles}</td>
                  <td className="td">
                    <ProgressBar value={m.verified_bottles} max={m.target} size="sm" label="Target progress" />
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
        </div>
      </Card>
    </>
  )
}
