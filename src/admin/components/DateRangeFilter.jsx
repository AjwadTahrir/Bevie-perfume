import { PRESETS } from '../lib/dateRange'

export default function DateRangeFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-line-strong bg-surface p-0.5" role="group" aria-label="Date range">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={value.preset === p.key}
            onClick={() => onChange({ ...value, preset: p.key })}
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${value.preset === p.key ? 'bg-navy text-white' : 'text-ink-2 hover:text-ink'}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input type="date" aria-label="From" value={value.start} max={value.end || undefined} onChange={(e) => onChange({ ...value, start: e.target.value })} className="input h-9 w-auto" />
          <span className="text-ink-3">–</span>
          <input type="date" aria-label="To" value={value.end} min={value.start || undefined} onChange={(e) => onChange({ ...value, end: e.target.value })} className="input h-9 w-auto" />
        </div>
      )}
    </div>
  )
}
