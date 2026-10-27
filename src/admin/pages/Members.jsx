import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Users } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, Pagination, ProgressBar, SearchInput, Select, SortTh, StatusBadge, TableSkeleton, sortRows, usePaged } from '../components/ui'
import { fetchMembers } from '../lib/api'
import { useQuery } from '../lib/data'
import { displayName, fmtDateTime, rm } from '../lib/format'
import { MEMBER_STATUS } from '../lib/status'
import { downloadCsv, stamp } from '../lib/csv'

export const MEMBER_CSV = [
  { label: 'Rank', value: (m) => m.rank },
  { label: 'Name', value: (m) => m.full_name },
  { label: 'Jawatan / Biro', value: (m) => m.committee_role },
  { label: 'Promo code', value: (m) => m.promo_code },
  { label: 'Verified bottles', value: (m) => m.verified_bottles },
  { label: 'Pending bottles', value: (m) => m.pending_bottles },
  { label: 'Target', value: (m) => m.target },
  { label: 'Remaining to target', value: (m) => m.remaining },
  { label: 'Status', value: (m) => MEMBER_STATUS[m.status].label },
  { label: 'Verified orders', value: (m) => m.verified_orders },
  { label: 'All orders', value: (m) => m.total_orders },
  { label: 'Revenue (RM)', value: (m) => m.revenue },
  { label: 'Discounts (RM)', value: (m) => m.discounts },
  { label: 'Profit (RM)', value: (m) => m.profit },
  { label: 'Last order', value: (m) => m.last_order_at },
]

export const bureaus = (members) => [...new Set((members || []).map((m) => m.committee_role))]

export default function Members() {
  const navigate = useNavigate()
  const members = useQuery(() => fetchMembers(), [])
  const [q, setQ] = useState('')
  const [bureau, setBureau] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState({ key: 'verified_bottles', dir: 'desc' })

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const rows = (members.data || []).filter(
      (m) => (!term || m.full_name.toLowerCase().includes(term) || m.promo_code.toLowerCase().includes(term)) && (!bureau || m.committee_role === bureau) && (!status || m.status === status),
    )
    return sortRows(rows, sort, { full_name: (m) => m.full_name, revenue: (m) => Number(m.revenue), profit: (m) => Number(m.profit) })
  }, [members.data, q, bureau, status, sort])
  const { rows, pager } = usePaged(filtered, 36)

  const reached = (members.data || []).filter((m) => m.status === 'target_reached').length

  return (
    <>
      <PageHeader
        title="AJK Performance"
        description={members.data ? `${reached} of ${members.data.length} members have reached their target. Only verified payments count.` : 'Sales by committee member'}
        actions={
          <button type="button" className="btn btn-secondary" disabled={!filtered.length} onClick={() => downloadCsv(`bevie-ajk-performance-${stamp()}.csv`, MEMBER_CSV, filtered)}>
            <Download size={15} /> Export CSV
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Name or promo code" label="Search members" />
        <Select label="Jawatan / Biro" value={bureau} onChange={setBureau} className="w-full sm:w-56" options={[{ value: '', label: 'All bureaus' }, ...bureaus(members.data).map((b) => ({ value: b, label: b }))]} />
        <Select
          label="Target status"
          value={status}
          onChange={setStatus}
          className="w-full sm:w-48"
          options={[{ value: '', label: 'All statuses' }, ...Object.entries(MEMBER_STATUS).map(([value, s]) => ({ value, label: s.label }))]}
        />
      </div>

      {members.error && !members.data && <ErrorState error={members.error} />}
      <Card bodyClass="p-0">
        {members.loading && !members.data ? (
          <TableSkeleton rows={10} cols={8} />
        ) : !filtered.length ? (
          <EmptyState icon={Users} title="No members match these filters" />
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-canvas/60">
                  <tr>
                    <th className="th">Rank</th>
                    <SortTh label="Member" k="full_name" sort={sort} setSort={setSort} />
                    <th className="th">Code</th>
                    <SortTh label="Verified" k="verified_bottles" sort={sort} setSort={setSort} className="text-right" />
                    <th className="th text-right">Pending</th>
                    <th className="th w-44">Target progress</th>
                    <th className="th text-right">To go</th>
                    <SortTh label="Revenue" k="revenue" sort={sort} setSort={setSort} className="text-right" />
                    <SortTh label="Profit" k="profit" sort={sort} setSort={setSort} className="text-right" />
                    <th className="th text-right">Orders</th>
                    <th className="th">Last order</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((m) => (
                    <tr
                      key={m.member_id}
                      tabIndex={0}
                      onClick={() => navigate(`/members/${m.member_id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/members/${m.member_id}`)}
                      className="cursor-pointer hover:bg-canvas focus-visible:bg-canvas"
                    >
                      <td className="td text-ink-3 tabular-nums">{m.verified_bottles > 0 ? m.rank : '—'}</td>
                      <td className="td">
                        <span className="block font-medium">{displayName(m.full_name)}</span>
                        <span className="text-xs text-ink-3">{m.committee_role}</span>
                      </td>
                      <td className="td font-mono text-xs">{m.promo_code}</td>
                      <td className="td text-right font-semibold tabular-nums">{m.verified_bottles}</td>
                      <td className="td text-right text-ink-3 tabular-nums">{m.pending_bottles || '—'}</td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={m.verified_bottles} max={m.target} size="sm" label={`${displayName(m.full_name)}: ${m.verified_bottles} of ${m.target}`} />
                          <span className="w-9 text-right text-xs text-ink-3 tabular-nums">
                            {m.verified_bottles}/{m.target}
                          </span>
                        </div>
                      </td>
                      <td className="td text-right tabular-nums">{m.remaining}</td>
                      <td className="td text-right tabular-nums">{rm(m.revenue)}</td>
                      <td className="td text-right tabular-nums">{rm(m.profit)}</td>
                      <td className="td text-right tabular-nums">{m.verified_orders}</td>
                      <td className="td text-ink-2">{fmtDateTime(m.last_order_at)}</td>
                      <td className="td">
                        <StatusBadge map={MEMBER_STATUS} value={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pager} />
          </>
        )}
      </Card>
      <p className="mt-3 text-xs text-ink-3">
        Not started: 0 verified bottles · In progress: 1–4 · Target reached: 5 or more. Members with equal verified bottles share a rank.
      </p>
    </>
  )
}
