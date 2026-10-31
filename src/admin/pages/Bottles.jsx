import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Card, ErrorState, Kpi, PageHeader, Skeleton, TableScroll, TableSkeleton } from '../components/ui'
import { RankChart } from '../components/charts'
import DateRangeFilter from '../components/DateRangeFilter'
import { fetchBottleSales } from '../lib/api'
import { bottleSales, litresFor } from '../lib/bottles'
import { useQuery } from '../lib/data'
import { DEFAULT_RANGE, resolveRange } from '../lib/dateRange'
import { n, pct } from '../lib/format'
import { downloadCsv, stamp } from '../lib/csv'

const STORAGE_KEY = 'jetha-bottle-plan'
const DEFAULT_PLAN = { ml: 32, spare: 0, includePending: true }

function loadPlan() {
  try {
    return { ...DEFAULT_PLAN, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }
  } catch {
    return DEFAULT_PLAN
  }
}

function savePlan(plan) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  } catch {
    // Without storage the plan simply resets next visit.
  }
}

const litres = (v) => `${v.toFixed(2)} L`

export default function Bottles() {
  const [range, setRange] = useState(DEFAULT_RANGE)
  const [plan, setPlanState] = useState(loadPlan)
  const r = resolveRange(range)
  const sales = useQuery(() => fetchBottleSales(r), [r.from, r.to])

  const setPlan = (patch) => {
    const next = { ...plan, ...patch }
    setPlanState(next)
    savePlan(next)
  }
  const number = (raw) => Math.max(0, Number(raw) || 0)

  const rows = useMemo(() => {
    const list = bottleSales(sales.data?.orders, sales.data?.items).map((s) => {
      const counted = s.verified + (plan.includePending ? s.pending : 0)
      return { ...s, counted, buy: litresFor(counted, plan.ml, plan.spare) }
    })
    const all = list.reduce((a, s) => a + s.counted, 0)
    return list.map((s) => ({ ...s, share: all ? (s.counted / all) * 100 : 0 })).sort((a, b) => b.counted - a.counted)
  }, [sales.data, plan])

  const total = (key) => rows.reduce((a, s) => a + s[key], 0)
  const loading = sales.loading && !sales.data
  const top = rows[0]?.counted ? rows[0] : null
  const basis = plan.includePending ? 'Verified and pending' : 'Verified only'
  const csv = [
    { label: 'Perfume', value: (s) => s.name },
    { label: 'Collection', value: (s) => s.category },
    { label: 'Verified bottles', value: (s) => s.verified },
    { label: 'Pending bottles', value: (s) => s.pending },
    { label: 'Bottles counted', value: (s) => s.counted },
    { label: `Litres to buy (${plan.ml} ml each, ${plan.spare}% spare)`, value: (s) => s.buy.toFixed(3) },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Stock"
        title="Bottles & Litres"
        description="Bottles sold per scent, and how much perfume to buy for them."
        actions={
          <button type="button" className="btn btn-secondary" disabled={!sales.data} onClick={() => downloadCsv(`jetha-bottles-${range.preset}-${stamp()}.csv`, csv, rows)}>
            <Download size={15} /> Export CSV
          </button>
        }
      />
      <div className="mb-5">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>
      {sales.error && !sales.data && <ErrorState error={sales.error} />}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <Kpi accent loading={loading} label="Litres to buy" value={litres(total('buy'))} sub={`${basis} · ${plan.ml} ml each${plan.spare ? ` · ${plan.spare}% spare` : ''}`} />
        <Kpi loading={loading} label="Verified bottles" value={n(total('verified'))} sub="Payment checked" />
        <Kpi loading={loading} label="Pending bottles" tone="muted" value={n(total('pending'))} sub="Receipt waiting for review" />
        <Kpi loading={loading} label="Best seller" value={top ? top.name : '—'} sub={top ? `${n(top.counted)} bottles · ${pct(top.share)}` : 'No sales yet'} />
      </div>

      <Card className="mt-4" title="Buying plan" description="These settings are remembered on this device.">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1.5 block text-xs text-ink-2">ml per bottle</span>
            <input type="number" min="1" step="1" inputMode="numeric" className="input h-9 w-28" value={plan.ml} onChange={(e) => setPlan({ ml: number(e.target.value) })} />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-xs text-ink-2">Spare (%)</span>
            <input type="number" min="0" step="1" inputMode="numeric" className="input h-9 w-28" value={plan.spare} onChange={(e) => setPlan({ spare: number(e.target.value) })} />
          </label>
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" checked={plan.includePending} onChange={(e) => setPlan({ includePending: e.target.checked })} />
            Count pending orders
          </label>
        </div>
      </Card>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card title="By scent" bodyClass="p-0">
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <TableScroll label="Bottles and litres by scent">
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="th">Perfume</th>
                    <th className="th text-right">Verified</th>
                    <th className="th text-right">Pending</th>
                    <th className="th text-right">Share</th>
                    <th className="th text-right">Litres to buy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td className="td">
                        <span className="block font-medium">{s.name}</span>
                        <span className="text-xs text-ink-3">{s.category}</span>
                      </td>
                      <td className="td text-right font-semibold tabular-nums">{n(s.verified)}</td>
                      <td className="td text-right text-ink-3 tabular-nums">{n(s.pending)}</td>
                      <td className="td text-right tabular-nums">{pct(s.share)}</td>
                      <td className="td text-right font-semibold tabular-nums">{litres(s.buy)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line">
                    <td className="td font-semibold">Total</td>
                    <td className="td text-right font-semibold tabular-nums">{n(total('verified'))}</td>
                    <td className="td text-right text-ink-3 tabular-nums">{n(total('pending'))}</td>
                    <td className="td" />
                    <td className="td text-right font-semibold tabular-nums">{litres(total('buy'))}</td>
                  </tr>
                </tfoot>
              </table>
            </TableScroll>
          )}
        </Card>
        <Card title="Bottles by scent" description={basis}>
          {loading ? <Skeleton className="h-72" /> : <RankChart data={rows} label="name" y="counted" name="Bottles" caption="Bottles by scent" labelWidth={80} />}
        </Card>
      </div>
      <p className="mt-3 text-xs text-ink-3">Litres are the total liquid for the bottles counted. Rejected, cancelled and refunded orders aren't counted, and neither are orders with no receipt yet.</p>
    </>
  )
}
