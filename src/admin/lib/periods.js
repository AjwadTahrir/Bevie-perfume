/**
 * Week / Month / Quarter periods for the Overview and Analytics pages.
 * Boundaries are local calendar boundaries (Malaysia for the committee),
 * weeks start on Monday, and `to` is exclusive. The daily series from
 * admin_sales_timeseries is folded into buckets here, so every figure
 * still comes from the same database totals.
 */
export const PERIODS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
]

const MONTH = new Intl.DateTimeFormat('en-MY', { month: 'short' })
const MONTH_LONG = new Intl.DateTimeFormat('en-MY', { month: 'long' })
const DAY = new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'short' })

function startOf(kind, d) {
  if (kind === 'week') {
    const day = (d.getDay() + 6) % 7 // Monday = 0
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
  }
  if (kind === 'month') return new Date(d.getFullYear(), d.getMonth(), 1)
  return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)
}

function shift(kind, d, n) {
  if (kind === 'week') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * n)
  return new Date(d.getFullYear(), d.getMonth() + (kind === 'month' ? n : 3 * n), 1)
}

export function bucketLabel(kind, start) {
  if (kind === 'week') return DAY.format(start)
  if (kind === 'month') return MONTH.format(start)
  return `Q${Math.floor(start.getMonth() / 3) + 1}`
}

/** The period containing `now` and the one before it. Dates are ISO strings for the RPCs. */
export function periodRange(kind, now = new Date()) {
  const start = startOf(kind, now)
  const end = shift(kind, start, 1)
  const prevStart = shift(kind, start, -1)
  const names = {
    week: ['this week', 'last week'],
    month: [MONTH_LONG.format(start), MONTH_LONG.format(prevStart)],
    quarter: [`Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`, `Q${Math.floor(prevStart.getMonth() / 3) + 1} ${prevStart.getFullYear()}`],
  }[kind]
  return {
    from: start.toISOString(),
    to: end.toISOString(),
    prevFrom: prevStart.toISOString(),
    prevTo: start.toISOString(),
    name: names[0],
    prevName: names[1],
    start,
  }
}

/** The last `count` periods ending with the current one: [{ key, label, from, to, current }]. */
export function recentBuckets(kind, count, now = new Date()) {
  const current = startOf(kind, now)
  return Array.from({ length: count }, (_, i) => {
    const start = shift(kind, current, i - count + 1)
    return { key: start.toISOString(), label: bucketLabel(kind, start), start, end: shift(kind, start, 1), current: i === count - 1 }
  })
}

/** Local Date for a 'YYYY-MM-DD' day string from the database. */
export const dayDate = (d) => {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day)
}

/** Sums daily rows into buckets. fields: the numeric columns to add up. */
export function foldDays(rows, buckets, fields) {
  const out = buckets.map((b) => ({ ...b, ...Object.fromEntries(fields.map((f) => [f, 0])) }))
  for (const r of rows || []) {
    const t = dayDate(r.day)
    const b = out.find((x) => t >= x.start && t < x.end)
    if (b) for (const f of fields) b[f] += Number(r[f]) || 0
  }
  return out
}

/** How many buckets each chart shows. */
export const BUCKETS = { week: 8, month: 6, quarter: 4 }

/** Percentage change, or null when there is nothing to compare with. */
export function change(current, previous) {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}
