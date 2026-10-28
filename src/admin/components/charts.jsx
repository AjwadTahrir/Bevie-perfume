import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState } from './ui'
import { BarChart3 } from 'lucide-react'

/**
 * Chart conventions (one system for every chart in the dashboard):
 * one y-axis, near-black for the main series and grey for the second,
 * lime only to mark the current period, rounded bars, 2px lines, a
 * recessive hairline grid, monospace axis labels, a dark hover tooltip
 * on every mark, and a data table behind every chart for screen
 * readers and exact values.
 *
 * Categorical slots (doughnut, ranked lists) follow the reference
 * design: black, lime, violet, peach, then grey for "Other". Slots
 * after the first sit below 3:1 against white, so every categorical
 * chart also shows its values and percentages as text.
 */
export const SERIES = ['#111114', '#a1a1aa']
export const CATEGORICAL = ['#111114', '#c6e84a', '#9d8cf4', '#f7a77a']
export const OTHER = '#dcdce2'
export const LIME = '#d7f26b'
const INK_3 = '#6e6e78'
const INK_2 = '#52525c'
const GRID = '#efeff2'
const CURSOR = '#1111140a'
const MONO = 'ui-monospace, SF Mono, SFMono-Regular, Menlo, monospace'
const axis = { stroke: INK_3, fontSize: 11, tickLine: false, axisLine: false, fontFamily: MONO }

/** Dark tooltip, as in the reference: period label over the figures. */
function TipBox({ active, payload, label, labelFormat, valueFormat, rows }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl bg-espresso px-3 py-2 text-xs text-white shadow-[0_8px_24px_rgba(12,12,16,0.25)]">
      <p className="mb-1 text-white/70">{labelFormat ? labelFormat(label, row) : label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full ring-1 ring-white/40" style={{ background: p.color === SERIES[0] ? '#ffffff' : p.color }} aria-hidden="true" />
          {p.name}: <span className="font-mono font-semibold tabular-nums">{valueFormat ? valueFormat(p.value) : p.value}</span>
        </p>
      ))}
      {rows?.(row)}
    </div>
  )
}

function DataTable({ caption, columns, data }) {
  return (
    <details className="mt-2 text-xs text-ink-3">
      <summary className="inline-block cursor-pointer rounded select-none hover:text-ink">Show data table</summary>
      <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-tint">
            <tr>
              {columns.map((c) => (
                <th key={c.label} className="px-3 py-1.5 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i} className="border-t border-line text-ink-2">
                {columns.map((c) => (
                  <td key={c.label} className="px-3 py-1.5 tabular-nums">
                    {c.value(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

function NoData() {
  return <EmptyState icon={BarChart3} title="No data for this period yet" />
}

/** Vertical bars over a category or day axis. */
export function ColumnChart({ data, x, y, name, height = 240, xFormat, valueFormat, tooltipRows, caption }) {
  if (!data?.length || data.every((d) => !Number(d[y]))) return <NoData />
  return (
    <figure>
      <div style={{ height }} role="img" aria-label={caption}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey={x} {...axis} tickFormatter={xFormat} minTickGap={12} />
            <YAxis {...axis} allowDecimals={false} tickFormatter={valueFormat} width={56} />
            <Tooltip cursor={{ fill: CURSOR }} content={<TipBox labelFormat={xFormat} valueFormat={valueFormat} rows={tooltipRows} />} />
            <Bar dataKey={y} name={name} fill={SERIES[0]} radius={[6, 6, 6, 6]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        caption={caption}
        data={data}
        columns={[
          { label: 'Period', value: (r) => (xFormat ? xFormat(r[x]) : r[x]) },
          { label: name, value: (r) => (valueFormat ? valueFormat(r[y]) : r[y]) },
        ]}
      />
    </figure>
  )
}

/** Horizontal bars for ranked categories (members, bureaus, statuses). */
export function RankChart({ data, label, y, name, valueFormat, onSelect, caption, labelWidth = 150 }) {
  if (!data?.length || data.every((d) => !Number(d[y]))) return <NoData />
  const height = Math.max(120, data.length * 34 + 16)
  return (
    <figure>
      <div style={{ height }} role="img" aria-label={caption}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" {...axis} allowDecimals={false} tickFormatter={valueFormat} />
            <YAxis type="category" dataKey={label} {...axis} width={labelWidth} tick={{ fill: INK_2, fontSize: 11 }} interval={0} />
            <Tooltip cursor={{ fill: CURSOR }} content={<TipBox valueFormat={valueFormat} />} />
            <Bar
              dataKey={y}
              name={name}
              fill={SERIES[0]}
              radius={[0, 6, 6, 0]}
              barSize={18}
              isAnimationActive={false}
              onClick={onSelect ? (d) => onSelect(d.payload ?? d) : undefined}
              style={onSelect ? { cursor: 'pointer' } : undefined}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        caption={caption}
        data={data}
        columns={[
          { label: 'Name', value: (r) => r[label] },
          { label: name, value: (r) => (valueFormat ? valueFormat(r[y]) : r[y]) },
        ]}
      />
    </figure>
  )
}

/** Two series in ringgit on one shared axis (revenue and profit). */
export function TwoLineChart({ data, x, series, height = 260, xFormat, valueFormat, caption }) {
  if (!data?.length || data.every((d) => series.every((s) => !Number(d[s.key])))) return <NoData />
  return (
    <figure>
      <div className="mb-2 flex gap-4 text-xs text-ink-2" aria-hidden="true">
        {series.map((s, i) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: SERIES[i] }} />
            {s.name}
          </span>
        ))}
      </div>
      <div style={{ height }} role="img" aria-label={caption}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey={x} {...axis} tickFormatter={xFormat} minTickGap={12} />
            <YAxis {...axis} tickFormatter={valueFormat} width={64} />
            <Tooltip cursor={{ stroke: INK_3, strokeDasharray: '3 3' }} content={<TipBox labelFormat={xFormat} valueFormat={valueFormat} />} />
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={SERIES[i]}
                strokeWidth={2}
                dot={data.length < 20 ? { r: 3, strokeWidth: 0, fill: SERIES[i] } : false}
                activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        caption={caption}
        data={data}
        columns={[{ label: 'Day', value: (r) => (xFormat ? xFormat(r[x]) : r[x]) }, ...series.map((s) => ({ label: s.name, value: (r) => (valueFormat ? valueFormat(r[s.key]) : r[s.key]) }))]}
      />
    </figure>
  )
}

/**
 * Doughnut with the total in the middle and a legend underneath that
 * always shows each slice's share. data: [{ label, value }] already
 * folded to at most four slices plus "Other".
 */
export function DonutChart({ data, total, totalLabel = 'Total', valueFormat = (v) => v, caption }) {
  const sum = data.reduce((n, d) => n + d.value, 0)
  if (!sum) return <NoData />
  const colour = (d, i) => (d.other ? OTHER : CATEGORICAL[i % CATEGORICAL.length])
  return (
    <figure>
      <div className="relative mx-auto aspect-square w-full max-w-[15rem]" role="img" aria-label={caption}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="80%" outerRadius="100%" startAngle={90} endAngle={-270} paddingAngle={2} cornerRadius={12} stroke="none" isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={d.label} fill={colour(d, i)} />
              ))}
            </Pie>
            <Tooltip content={<TipBox valueFormat={valueFormat} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[0.8125rem] text-ink-3">{totalLabel}</span>
          <span className="display text-[1.75rem] leading-tight">{total}</span>
        </div>
      </div>
      <ul className="mt-6 space-y-3.5 text-[0.9375rem]">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-3">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: colour(d, i) }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{d.label}</span>
            <span className="text-xs text-ink-3 tabular-nums">{valueFormat(d.value)}</span>
            <span className="w-11 text-right font-semibold tabular-nums">{Math.round((d.value / sum) * 100)}%</span>
          </li>
        ))}
      </ul>
      <DataTable
        caption={caption}
        data={data}
        columns={[
          { label: 'Group', value: (r) => r.label },
          { label: 'Value', value: (r) => valueFormat(r.value) },
          { label: 'Share', value: (r) => `${((r.value / sum) * 100).toFixed(1)}%` },
        ]}
      />
    </figure>
  )
}

/**
 * Tall rounded bars per period, the current one in lime, as in the
 * reference "Monthly spend" card. data: [{ key, label, value, current }].
 */
export function PillBarChart({ data, name, valueFormat = (v) => v, height = 230, caption, tooltipRows }) {
  if (!data?.length || data.every((d) => !d.value)) return <NoData />
  return (
    <figure>
      <div style={{ height }} role="img" aria-label={caption}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
            <XAxis dataKey="label" {...axis} interval={0} tickMargin={10} />
            <YAxis hide domain={[0, (max) => Math.max(1, max) * 1.08]} />
            <Tooltip cursor={{ fill: CURSOR, radius: 10 }} content={<TipBox valueFormat={valueFormat} rows={tooltipRows} />} />
            <Bar dataKey="value" name={name} radius={[10, 10, 10, 10]} maxBarSize={44} isAnimationActive={false} minPointSize={3}>
              {data.map((d) => (
                <Cell key={d.key} fill={d.current ? LIME : SERIES[0]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        caption={caption}
        data={data}
        columns={[
          { label: 'Period', value: (r) => r.label + (r.current ? ' (current)' : '') },
          { label: name, value: (r) => valueFormat(r.value) },
        ]}
      />
    </figure>
  )
}

/**
 * Smooth trend with a soft grey wash under the main series and a
 * thinner grey second series, as in the reference "Cash flow" card.
 */
export function TrendChart({ data, x, series, height = 250, xFormat, valueFormat, caption }) {
  if (!data?.length || data.every((d) => series.every((s) => !Number(d[s.key])))) return <NoData />
  return (
    <figure>
      <div style={{ height }} role="img" aria-label={caption}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: -6 }}>
            <defs>
              <linearGradient id="trend-wash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111114" stopOpacity={0.07} />
                <stop offset="100%" stopColor="#111114" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey={x} {...axis} tickFormatter={xFormat} minTickGap={18} tickMargin={10} />
            <YAxis {...axis} tickFormatter={valueFormat} width={56} allowDecimals={false} />
            <Tooltip cursor={{ stroke: INK_3, strokeDasharray: '3 3' }} content={<TipBox labelFormat={xFormat} valueFormat={valueFormat} />} />
            {series
              .slice()
              .reverse()
              .map((s) => {
                const main = s === series[0]
                return (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={main ? SERIES[0] : SERIES[1]}
                    strokeWidth={2}
                    fill={main ? 'url(#trend-wash)' : 'transparent'}
                    dot={false}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: main ? SERIES[0] : SERIES[1] }}
                    isAnimationActive={false}
                  />
                )
              })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        caption={caption}
        data={data}
        columns={[{ label: 'Period', value: (r) => (xFormat ? xFormat(r[x]) : r[x]) }, ...series.map((s) => ({ label: s.name, value: (r) => (valueFormat ? valueFormat(r[s.key]) : r[s.key]) }))]}
      />
    </figure>
  )
}

/** Tiny line for a KPI card. Decorative: the card states the figures in text. */
export function Sparkline({ values, height = 48 }) {
  if (!values?.length || values.every((v) => !v)) return <div style={{ height }} />
  const data = values.map((v, i) => ({ i, v }))
  return (
    <div style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line type="monotone" dataKey="v" stroke={SERIES[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Row of small bars, the first `filled` in lime: a progress meter in the reference style. Decorative. */
export function MiniBars({ total = 12, filled, height = 44 }) {
  return (
    <div className="flex items-end gap-1.5" style={{ height }} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const on = i < filled
        return <span key={i} className={`flex-1 rounded-[5px] ${on ? 'bg-lime' : 'bg-[#ececf0]'}`} style={{ height: on ? `${55 + (i / total) * 45}%` : '45%' }} />
      })}
    </div>
  )
}

/** Fills missing days with zeros so the time axis is continuous. */
export function fillDays(rows, from, to) {
  const byDay = new Map((rows || []).map((r) => [r.day, r]))
  const days = [...byDay.keys()].sort()
  const start = from ? new Date(from) : days.length ? new Date(`${days[0]}T00:00:00`) : null
  const end = to ? new Date(new Date(to).getTime() - 1) : new Date()
  if (!start) return []
  const out = []
  const zero = { verified_bottles: 0, verified_orders: 0, revenue: 0, profit: 0, pending_bottles: 0, orders: 0 }
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end && out.length < 400; d.setDate(d.getDate() + 1)) {
    const key = fmt(d)
    const r = byDay.get(key)
    out.push(r ? { ...r, revenue: Number(r.revenue), profit: Number(r.profit) } : { day: key, ...zero })
  }
  return out
}
