import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState } from './ui'
import { BarChart3 } from 'lucide-react'

/**
 * Chart conventions (one system for every chart in the dashboard):
 * one y-axis, a single colour per series (series-1 blue, series-2
 * orange), thin bars with 4px rounded data ends, 2px lines, recessive
 * grid, a hover tooltip on every mark, text in ink colours, and a data
 * table behind every chart for screen readers and exact values.
 */
export const SERIES = ['#2a78d6', '#eb6834']
const INK_3 = '#7b8491'
const GRID = '#ecebe6'
const axis = { stroke: INK_3, fontSize: 11, tickLine: false, axisLine: false }

function TipBox({ active, payload, label, labelFormat, valueFormat, rows }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-ink">{labelFormat ? labelFormat(label, row) : label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-ink-2">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
          {p.name}: <span className="font-medium text-ink tabular-nums">{valueFormat ? valueFormat(p.value) : p.value}</span>
        </p>
      ))}
      {rows?.(row)}
    </div>
  )
}

function DataTable({ caption, columns, data }) {
  return (
    <details className="mt-2 text-xs text-ink-3">
      <summary className="cursor-pointer select-none hover:text-ink">Show data table</summary>
      <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-line">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-canvas">
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
            <Tooltip cursor={{ fill: '#13233d0d' }} content={<TipBox labelFormat={xFormat} valueFormat={valueFormat} rows={tooltipRows} />} />
            <Bar dataKey={y} name={name} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
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
            <YAxis type="category" dataKey={label} {...axis} width={labelWidth} tick={{ fill: '#4a5565', fontSize: 11 }} interval={0} />
            <Tooltip cursor={{ fill: '#13233d0d' }} content={<TipBox valueFormat={valueFormat} />} />
            <Bar
              dataKey={y}
              name={name}
              fill={SERIES[0]}
              radius={[0, 4, 4, 0]}
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
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
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
