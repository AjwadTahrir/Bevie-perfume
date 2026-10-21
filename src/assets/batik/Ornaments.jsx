import { useId } from 'react'
import { seedCluster } from './geometry'

/**
 * ORNAMENTS
 * Fine-line dividers and borders that repeat the motif language at
 * small scale.
 */

/** Fine repeating border: a wave with alternating seed dots. */
export function OrnamentBorder({ className = '', color = 'var(--color-gold)' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg className={className} height="28" width="100%" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`orn-${id}`} width="48" height="28" patternUnits="userSpaceOnUse">
          <path d="M0 14 Q12 3 24 14 T48 14" fill="none" stroke={color} strokeWidth="1" />
          <circle cx="12" cy="20" r="1.6" fill={color} />
          <circle cx="36" cy="8" r="1.6" fill={color} />
          <circle cx="24" cy="14" r="2.2" fill="none" stroke={color} strokeWidth="1" />
          <circle cx="0" cy="14" r="2.2" fill="none" stroke={color} strokeWidth="1" />
          <circle cx="48" cy="14" r="2.2" fill="none" stroke={color} strokeWidth="1" />
        </pattern>
      </defs>
      <line x1="0" y1="1" x2="100%" y2="1" stroke={color} strokeWidth="1" />
      <rect y="0" width="100%" height="28" fill={`url(#orn-${id})`} />
      <line x1="0" y1="27" x2="100%" y2="27" stroke={color} strokeWidth="1" />
    </svg>
  )
}

/** Hairline divider with a seed rosette at its centre. */
export function SeedDivider({ className = '' }) {
  const seeds = seedCluster({ cx: 60, cy: 12, ring: 6, count: 6, size: 1.5 })
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gold/60" />
      <svg viewBox="0 0 120 24" width="120" height="24" focusable="false">
        <path d="M0 12 H40 M80 12 H120" stroke="var(--color-gold)" strokeWidth="1" />
        <path d="M44 12 L50 6 L56 12 L50 18 Z M64 12 L70 6 L76 12 L70 18 Z" fill="none" stroke="var(--color-gold)" strokeWidth="1" />
        {seeds.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="var(--color-forest)" />
        ))}
      </svg>
      <span className="h-px flex-1 bg-gold/60" />
    </div>
  )
}

/** Corner flourish used on framed panels (rotate for other corners). */
export function CornerFlourish({ className = '' }) {
  const seeds = seedCluster({ cx: 22, cy: 22, ring: 6, count: 6, size: 1.6 })
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round">
      <path d="M4 116 V40 C4 20 20 4 40 4 H116" stroke="var(--color-gold)" strokeWidth="1" />
      <path d="M14 116 V46 C14 28 28 14 46 14 H116" stroke="var(--color-gold)" strokeWidth="1" opacity="0.6" />
      <path d="M40 40 C52 34 64 36 74 44 C64 46 54 46 46 52 C44 46 42 44 40 40 Z" stroke="var(--color-forest)" strokeWidth="1" />
      <path d="M40 40 C34 52 36 64 44 74 C46 64 46 54 52 46 C46 44 44 42 40 40 Z" stroke="var(--color-forest)" strokeWidth="1" />
      <path d="M74 44 C84 52 96 52 108 46 M44 74 C52 84 52 96 46 108" stroke="var(--color-forest)" strokeWidth="1" />
      {seeds.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="var(--color-gold)" />
      ))}
      <circle cx="108" cy="46" r="2" fill="var(--color-gold)" />
      <circle cx="46" cy="108" r="2" fill="var(--color-gold)" />
    </svg>
  )
}
