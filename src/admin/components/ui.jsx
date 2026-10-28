import { useId, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Info, Inbox, Search } from 'lucide-react'

/** Page title block: large semibold title, one quiet line under it, controls on the right. */
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="display text-[1.625rem] leading-tight text-ink sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[0.9375rem] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Section heading inside a page, for groups that don't need a card around them. */
export function SectionTitle({ title, description, actions, className = '' }) {
  return (
    <div className={`mb-3 flex flex-wrap items-end justify-between gap-3 ${className}`}>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Card({ title, description, actions, children, className = '', bodyClass = 'p-5' }) {
  return (
    <section className={`card min-w-0 ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-1">
          <div className="min-w-0">
            <h2 className="text-[0.9375rem] leading-snug font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

/** Small (i) with a definition, shown on hover and on keyboard focus. */
export function InfoTip({ text }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex size-4 items-center justify-center rounded-full text-ink-3 hover:text-ink"
        aria-describedby={id}
        aria-label="What does this mean?"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info size={13} />
      </button>
      <span
        id={id}
        role="tooltip"
        className={`fixed inset-x-4 bottom-4 z-50 rounded-md bg-espresso px-3 py-2 text-xs leading-snug font-normal tracking-normal text-surface normal-case shadow-lg sm:absolute sm:inset-x-auto sm:bottom-full sm:left-1/2 sm:mb-2 sm:w-60 sm:-translate-x-1/2 ${open ? '' : 'hidden'}`}
      >
        {text}
      </span>
    </span>
  )
}

/**
 * Key figure: quiet label, large semibold value, one supporting line.
 * `accent` marks the figure that matters most with a small lime dot.
 */
export function Kpi({ label, value, sub, info, loading, tone, accent, className = '' }) {
  return (
    <div className={`card flex flex-col p-5 ${className}`}>
      <p className="kpi-label flex items-center gap-1.5">
        {accent && <span className="size-2 rounded-full bg-lime-deep" aria-hidden="true" />}
        {label}
        {info && <InfoTip text={info} />}
      </p>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-28" />
      ) : (
        <p className={`display mt-2 text-[1.625rem] leading-none sm:text-[1.875rem] ${tone === 'muted' ? 'text-ink-2' : 'text-ink'}`}>{value}</p>
      )}
      {sub && !loading && <p className="mt-2 text-xs text-ink-3">{sub}</p>}
    </div>
  )
}

/** Progress towards a target: black while in progress, lime once complete (callers also say so in text). */
export function ProgressBar({ value, max, size = 'md', label }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const done = max > 0 && value >= max
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-[#ececf0] ${size === 'lg' ? 'h-2.5' : size === 'sm' ? 'h-1.5' : 'h-2'}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-label={label}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${done ? 'bg-lime-deep' : 'bg-ink'}`} style={{ width: `${p}%` }} />
    </div>
  )
}

const TONES = {
  neutral: 'bg-[#f0f0f3] text-ink-2 ring-transparent',
  info: 'bg-info-soft text-info ring-transparent',
  good: 'bg-good-soft text-good ring-transparent',
  warn: 'bg-warn-soft text-warn ring-transparent',
  bad: 'bg-bad-soft text-bad ring-transparent',
  brand: 'bg-lime-soft text-ink ring-lime-deep/40',
}
const DOTS = { neutral: 'bg-ink-3', info: 'bg-info', good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad', brand: 'bg-brand' }

/** Status pill. The leading dot and the label carry the meaning, so colour is never the only cue. */
export function Badge({ tone = 'neutral', children, icon: Icon }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-medium whitespace-nowrap ring-1 ring-inset ${TONES[tone]}`}>
      {Icon ? <Icon size={12} aria-hidden="true" /> : <span className={`size-1.5 rounded-full ${DOTS[tone]}`} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function StatusBadge({ map, value }) {
  const s = map[value] || { label: value, tone: 'neutral' }
  return <Badge tone={s.tone}>{s.label}</Badge>
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} />
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }, (_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-tint text-ink-3">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-[0.9375rem] font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-ink-3">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error }) {
  return (
    <div role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-bad/25 bg-bad-soft px-4 py-3 text-sm text-bad">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">Couldn't load this data.</p>
        <p className="mt-0.5 text-bad/90">{error?.message || 'Please try again.'} It will retry automatically.</p>
      </div>
    </div>
  )
}

/** Row of search, selects and filters above a table. */
export function Toolbar({ children, className = '' }) {
  return <div className={`mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center ${className}`}>{children}</div>
}

export function SearchInput({ value, onChange, placeholder, label = 'Search' }) {
  return (
    <label className="relative block w-full sm:w-72">
      <span className="sr-only">{label}</span>
      <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-9" />
    </label>
  )
}

export function Select({ value, onChange, options, label, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input pr-8" aria-label={label}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Sortable column header. sort = { key, dir }. */
export function SortTh({ label, k, sort, setSort, className = '' }) {
  const active = sort.key === k
  const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown
  return (
    <th className={`th ${className}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded tracking-[0.08em] uppercase hover:text-ink ${active ? 'text-ink' : ''}`}
        onClick={() => setSort({ key: k, dir: active && sort.dir === 'desc' ? 'asc' : 'desc' })}
      >
        {label}
        <Icon size={12} aria-hidden="true" />
      </button>
    </th>
  )
}

export function sortRows(rows, { key, dir }, accessors = {}) {
  const get = accessors[key] || ((r) => r[key])
  return [...rows].sort((a, b) => {
    const x = get(a)
    const y = get(b)
    const c = typeof x === 'string' || typeof y === 'string' ? String(x ?? '').localeCompare(String(y ?? '')) : (Number(x) || 0) - (Number(y) || 0)
    return dir === 'asc' ? c : -c
  })
}

/**
 * Scroll container for wide tables. On narrow screens the table scrolls sideways
 * inside its card (never the page) and the first column stays readable.
 */
export function TableScroll({ children, label }) {
  return (
    <div className="relative overflow-x-auto overscroll-x-contain" role="region" aria-label={label} tabIndex={label ? 0 : undefined}>
      {children}
    </div>
  )
}

export function Pagination({ page, pageCount, setPage, total, pageSize }) {
  if (total <= pageSize) return null
  const start = (page - 1) * pageSize + 1
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-ink-2">
      <span className="tabular-nums">
        {start}–{Math.min(total, page * pageSize)} of {total}
      </span>
      <div className="flex gap-1">
        <button type="button" className="btn btn-secondary h-8 px-2" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={15} />
        </button>
        <button type="button" className="btn btn-secondary h-8 px-2" disabled={page >= pageCount} onClick={() => setPage(page + 1)} aria-label="Next page">
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

export function usePaged(rows, pageSize = 20) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pageCount)
  return {
    rows: rows.slice((current - 1) * pageSize, current * pageSize),
    pager: { page: current, pageCount, setPage, total: rows.length, pageSize },
    reset: () => setPage(1),
  }
}

/** Definition list row for detail panels. */
export function Field({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-ink-3">{label}</dt>
      <dd className="min-w-0 text-right break-words text-ink">{children}</dd>
    </div>
  )
}
