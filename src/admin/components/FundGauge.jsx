import { useEffect, useId, useRef, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { displayName, n, pct, rm } from '../lib/format'

/**
 * The fund gauge on Overview: two concentric half rings, both out of the fund
 * target, which is every AJK selling exactly their target × the profit per
 * bottle (Settings).
 *
 * Inner, red: confirmed. Each AJK's verified bottles, capped at their target,
 * × profit per bottle. Fills to 100% when every AJK has hit their target.
 *
 * Outer, green: extra. Verified bottles past each AJK's target, plus verified
 * bottles sold with no AJK code, × profit per bottle. Never counted in red.
 *
 * Expected profit (Reports) is target + extraSales: everyone assumed to reach
 * their target, extras on top.
 */
export function fundProgress(members, dash) {
  const price = Number(dash.settings?.profit_per_bottle) || 0
  let capped = 0
  let targetBottles = 0
  let ajkBottles = 0
  let ajkExtra = 0
  let reached = 0
  let counted = 0
  const contributors = []
  for (const m of members) {
    const t = Number(m.target) || 0
    const v = Number(m.verified_bottles) || 0
    ajkBottles += v
    // Every active AJK counts towards the target; an inactive one only if they sold.
    if (!m.is_active && v === 0) continue
    counted++
    targetBottles += t
    capped += Math.min(v, t)
    if (v >= t) reached++
    if (v > t) {
      ajkExtra += v - t
      contributors.push({ id: m.member_id, name: m.full_name, extra: v - t })
    }
  }
  contributors.sort((a, b) => b.extra - a.extra)
  // Verified bottles sold without any AJK code.
  const noCode = Math.max(0, (Number(dash.verified?.bottles) || 0) - ajkBottles)
  const extra = ajkExtra + noCode
  return {
    target: targetBottles * price,
    sales: capped * price,
    extra,
    ajkExtra,
    noCode,
    price,
    extraSales: extra * price,
    expected: (targetBottles + extra) * price,
    members: counted,
    reached,
    contributors,
  }
}

/** Eases a number from its last value to the next, unless the user prefers less motion. */
function useTween(target, ms = 1400) {
  const [value, setValue] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      from.current = target
      setValue(target)
      return
    }
    const start = performance.now()
    const a = from.current
    let raf
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms)
      const v = a + (target - a) * (1 - Math.pow(1 - k, 4))
      from.current = v
      setValue(v)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return value
}

// Geometry, in viewBox units. Both rings share a centre on the baseline.
const W = 340
const CX = W / 2
const CY = 172
const STROKE = 20
const R_OUT = 146
const R_IN = 114
const clamp = (v) => Math.max(0, Math.min(100, v))
const point = (r, p) => {
  const a = Math.PI * (1 - p / 100)
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)]
}
const arc = (r) => `M ${CX - r} ${CY} A ${r} ${r} 0 0 1 ${CX + r} ${CY}`

/** One ring: track, the filled arc with a soft glow, and a white tip. */
function Ring({ r, value, gradient, blur, glow, tipRing }) {
  const v = clamp(value)
  const [tx, ty] = point(r, v)
  return (
    <g>
      <path d={arc(r)} fill="none" stroke="#efeff3" strokeWidth={STROKE} strokeLinecap="round" />
      {v > 0.2 && (
        <>
          <path d={arc(r)} pathLength={100} fill="none" stroke={glow} strokeOpacity={0.28} strokeWidth={STROKE + 8} strokeLinecap="round" strokeDasharray={`${v} 200`} filter={`url(#${blur})`} />
          <path d={arc(r)} pathLength={100} fill="none" stroke={`url(#${gradient})`} strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={`${v} 200`} />
          <circle cx={tx} cy={ty} r={5.5} fill="#fff" stroke={tipRing} strokeWidth={2.5} />
        </>
      )}
    </g>
  )
}

/** Hairline ticks outside the outer ring, longer every quarter. */
function Ticks() {
  return (
    <g stroke="#c9c9d1" strokeLinecap="round">
      {Array.from({ length: 21 }, (_, i) => {
        const major = i % 5 === 0
        const [x1, y1] = point(R_OUT + STROKE / 2 + 4, i * 5)
        const [x2, y2] = point(R_OUT + STROKE / 2 + (major ? 11 : 7), i * 5)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={major ? 1.5 : 1} opacity={major ? 1 : 0.7} />
      })}
    </g>
  )
}

const whole = (v) => rm(v).replace(/\.00$/, '')

export function FundGauge({ data }) {
  const uid = useId().replace(/:/g, '')
  const salesPct = data.target ? (data.sales / data.target) * 100 : 0
  const extraPct = data.target ? (data.extraSales / data.target) * 100 : 0
  const red = useTween(salesPct)
  const green = useTween(extraPct)
  const shown = useTween(data.sales)
  const secured = salesPct >= 100
  const ids = { red: `${uid}-red`, green: `${uid}-green`, blur: `${uid}-blur` }
  const label =
    `Confirmed sales ${rm(data.sales)} of ${rm(data.target)} (${pct(salesPct)}). ` +
    `Extra bottle sales ${rm(data.extraSales)} of ${rm(data.target)} (${pct(extraPct)}), ${n(data.extra)} extra bottles.`

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${CY + STROKE / 2 + 4}`} className="block w-full" role="img" aria-label={label}>
          <defs>
            <linearGradient id={ids.red} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#ff8f6b" />
              <stop offset="0.55" stopColor="#f5554a" />
              <stop offset="1" stopColor="#e0303f" />
            </linearGradient>
            <linearGradient id={ids.green} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#7be3a4" />
              <stop offset="0.5" stopColor="#22c56b" />
              <stop offset="1" stopColor="#0d9a52" />
            </linearGradient>
            <filter id={ids.blur} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <Ticks />
          <Ring r={R_OUT} value={green} gradient={ids.green} blur={ids.blur} glow="#22c56b" tipRing="#0d9a52" />
          <Ring r={R_IN} value={red} gradient={ids.red} blur={ids.blur} glow="#f5554a" tipRing="#e0303f" />
        </svg>

        {/* Centre readout, sitting on the baseline inside the inner ring */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center text-center" aria-hidden="true">
          {secured ? (
            <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-good-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-good">
              <Check size={12} strokeWidth={3} /> Target reached
            </span>
          ) : (
            <span className="eyebrow mb-1">Confirmed sales</span>
          )}
          <span className="display text-[1.75rem] leading-none sm:text-[2rem]">{whole(Math.round(shown))}</span>
          <span className="mt-1 text-xs text-ink-3 tabular-nums">
            of {whole(data.target)} · {pct(salesPct, 0)}
          </span>
        </div>
      </div>
      <p className="mt-3 flex justify-center" aria-hidden="true">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${data.extra > 0 ? 'bg-[#0d9a52] text-white shadow-[0_4px_14px_rgba(13,154,82,0.35)]' : 'bg-tint text-ink-3'}`}>
          <Sparkles size={12} /> {data.extra > 0 ? `+${whole(data.extraSales)} from ${n(data.extra)} extra bottles` : 'No extra bottles yet'}
        </span>
      </p>
    </div>
  )
}

/** Key under the gauge: what each ring counts, with exact figures. */
export function FundLegend({ data }) {
  const salesPct = data.target ? (data.sales / data.target) * 100 : 0
  const extraPct = data.target ? (data.extraSales / data.target) * 100 : 0
  const rows = [
    {
      swatch: 'bg-[linear-gradient(90deg,#ff8f6b,#e0303f)]',
      name: 'Confirmed sales',
      value: `${rm(data.sales)} / ${rm(data.target)}`,
      note: `Profit on bottles up to each AJK's target · ${pct(salesPct)}`,
    },
    {
      swatch: 'bg-[linear-gradient(90deg,#7be3a4,#0d9a52)]',
      name: 'Extra bottle sales',
      value: `${rm(data.extraSales)} / ${rm(data.target)}`,
      note: `${n(data.extra)} extra ${data.extra === 1 ? 'bottle' : 'bottles'}${data.noCode ? ` (${n(data.noCode)} with no code)` : ''} × ${whole(data.price)} profit · ${pct(extraPct)}`,
    },
  ]
  return (
    <dl className="mt-5 grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.name} className="rounded-xl bg-tint/70 px-3.5 py-3">
          <dt className="flex items-center gap-2 text-[0.8125rem] text-ink-2">
            <span className={`h-2 w-5 rounded-full ${r.swatch}`} aria-hidden="true" />
            {r.name}
          </dt>
          <dd className="mt-1 font-semibold tabular-nums">{r.value}</dd>
          <dd className="text-xs text-ink-3">{r.note}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Right-hand panel: who is earning the green ring. */
export function ExtraBoard({ data, onSelect }) {
  const top = data.contributors.slice(0, 6)
  const max = top[0]?.extra || 1
  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="AJK at target" value={`${n(data.reached)}/${n(data.members)}`} />
        <Stat label="Over target" value={n(data.contributors.length)} />
        <Stat label="Extra bottles" value={n(data.extra)} />
      </div>
      <h3 className="mt-5 text-[0.8125rem] font-semibold">Extra bottles by AJK</h3>
      <p className="text-xs text-ink-3">Verified bottles beyond each AJK's target</p>
      {!top.length ? (
        <p className="mt-4 rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[0.8125rem] text-ink-3">
          Nobody is past their target yet. The green ring starts filling with the first bottle beyond a target.
        </p>
      ) : (
        <ol className="mt-3 space-y-1">
          {top.map((c, i) => (
            <li key={c.id}>
              <button type="button" onClick={() => onSelect?.(c.id)} className="grid w-full grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-tint/70">
                <span className="text-xs text-ink-3 tabular-nums">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.8125rem] font-medium">{displayName(c.name)}</span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#efeff3]">
                    <span className="block h-full rounded-full bg-[linear-gradient(90deg,#7be3a4,#0d9a52)]" style={{ width: `${Math.max(6, (c.extra / max) * 100)}%` }} />
                  </span>
                </span>
                <span className="text-right leading-tight">
                  <span className="block text-[0.8125rem] font-semibold text-good tabular-nums">+{n(c.extra)}</span>
                  <span className="block text-[0.6875rem] text-ink-3 tabular-nums">{whole(c.extra * data.price)}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-line px-3 py-2.5">
      <p className="truncate text-[0.6875rem] text-ink-3">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  )
}
