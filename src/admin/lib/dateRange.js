/**
 * Date filters. Days are calendar days in the browser's time zone
 * (Malaysia for the committee); `to` is exclusive.
 */
export const PRESETS = [
  { key: 'all', label: 'All time' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'custom', label: 'Custom' },
]

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function resolveRange({ preset, start, end }) {
  const today = startOfDay(new Date())
  const tomorrow = new Date(today.getTime() + 86_400_000)
  if (preset === '7d') return { from: new Date(today.getTime() - 6 * 86_400_000).toISOString(), to: tomorrow.toISOString() }
  if (preset === '30d') return { from: new Date(today.getTime() - 29 * 86_400_000).toISOString(), to: tomorrow.toISOString() }
  if (preset === 'custom') {
    const from = start ? new Date(`${start}T00:00:00`) : null
    const to = end ? new Date(new Date(`${end}T00:00:00`).getTime() + 86_400_000) : null
    return { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null }
  }
  return { from: null, to: null }
}

export const DEFAULT_RANGE = { preset: 'all', start: '', end: '' }
