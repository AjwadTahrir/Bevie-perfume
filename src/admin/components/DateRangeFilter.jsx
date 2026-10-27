import { PRESETS } from '../lib/dateRange'

export default function DateRangeFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="segmented max-w-full overflow-x-auto" role="group" aria-label="Date range">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={value.preset === p.key}
            onClick={() => onChange({ ...value, preset: p.key })}
            className="segment"
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input type="date" aria-label="From" value={value.start} max={value.end || undefined} onChange={(e) => onChange({ ...value, start: e.target.value })} className="input h-9 w-auto min-w-0" />
          <span className="text-ink-3">–</span>
          <input type="date" aria-label="To" value={value.end} min={value.start || undefined} onChange={(e) => onChange({ ...value, end: e.target.value })} className="input h-9 w-auto" />
        </div>
      )}
    </div>
  )
}
