import { useId } from 'react'
import { flower, leaf, ring, spiral } from './geometry'
import { Blossom, BatikLeaf, LINE } from './Foliage'

/**
 * BATIK CLOTH
 * A densely patterned length of batik: a half-drop repeat of large
 * blossoms with paired teal leaves, small florets and tendrils over a
 * field of fine "isen" dots. With `drape`, an SVG turbulence filter
 * warps the repeat and adds light and shadow so it reads as folded
 * fabric rather than flat wallpaper. Original artwork inspired by
 * batik composition, not a reproduction of a traditional pattern.
 *   tone "rust":  rust ground, ochre and cream blossoms (heritage, hero)
 *   tone "brown": dark brown ground, rust blossoms (closing section)
 */

const T = 200 // tile size

const TONES = {
  rust: {
    ground: 'var(--color-rust)',
    isen: 'var(--color-brown-deep)',
    blossom: {
      outer: 'var(--color-ochre)',
      vein: 'var(--color-brown)',
      mid: 'var(--color-cream-light)',
      midInner: 'var(--color-rust)',
      centre: 'var(--color-brown)',
      dot: 'var(--color-cream)',
    },
    floret: 'var(--color-cream-light)',
    tendril: 'var(--color-brown-deep)',
  },
  brown: {
    ground: 'var(--color-brown)',
    isen: 'var(--color-ochre)',
    blossom: {
      outer: 'var(--color-rust)',
      vein: 'var(--color-ochre-soft)',
      mid: 'var(--color-ochre-soft)',
      midInner: 'var(--color-rust)',
      centre: 'var(--color-brown-deep)',
      dot: 'var(--color-cream)',
    },
    floret: 'var(--color-ochre)',
    tendril: 'var(--color-ochre)',
  },
}

// Two large blossoms per tile on the diagonal (a half-drop repeat).
const BIG = [
  { cx: 50, cy: 52, rot: 0 },
  { cx: 150, cy: 152, rot: 20 },
]
const leavesFor = ({ cx, cy, rot }) =>
  [rot + 35, rot + 125, rot + 215, rot + 305].map((a, i) => ({
    x: cx + Math.cos((a * Math.PI) / 180) * 22,
    y: cy + Math.sin((a * Math.PI) / 180) * 22,
    angle: a,
    length: i % 2 ? 34 : 42,
    width: i % 2 ? 11 : 13,
  }))
const SMALL = [
  [150, 50],
  [50, 150],
]
const florets = SMALL.map(([cx, cy]) => flower({ cx, cy, petals: 6, rotation: -90, inner: 3, length: 19, width: 9 }))
const floretRings = SMALL.map(([cx, cy]) => ring({ cx, cy, radius: 27, count: 12 }))
const tendrils = [
  spiral({ cx: 100, cy: 100, r1: 9, turns: 1.4, start: 0, dir: 1, extend: [[112, 88], [124, 74]] }),
  spiral({ cx: 100, cy: 100, r1: 9, turns: 1.4, start: 180, dir: 1, extend: [[88, 112], [76, 126]] }),
]
const smallLeaves = SMALL.flatMap(([cx, cy]) =>
  [45, 135, 225, 315].map((a) => leaf({ x: cx + Math.cos((a * Math.PI) / 180) * 17, y: cy + Math.sin((a * Math.PI) / 180) * 17, angle: a, length: 26, width: 8, style: 'dots' })),
)

export default function BatikCloth({ tone = 'rust', drape = false, scale = 1, className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const t = TONES[tone] || TONES.rust
  return (
    <svg viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id={`isen-${id}`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="0.9" fill={t.isen} opacity="0.4" />
        </pattern>
        <pattern id={`tile-${id}`} width={T} height={T} patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
          <rect width={T} height={T} fill={`url(#isen-${id})`} />
          <g stroke={t.tendril} strokeWidth="1.1">
            {tendrils.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {BIG.flatMap(leavesFor).map((l, i) => (
            <BatikLeaf key={i} {...l} sw={1} fill="var(--color-teal)" shade="var(--color-teal-deep)" vein="var(--color-ochre-soft)" />
          ))}
          {BIG.map((b, i) => (
            <Blossom key={i} cx={b.cx} cy={b.cy} r={38} petals={8} rot={b.rot} colors={t.blossom} sw={1} />
          ))}
          {smallLeaves.map((l, i) => (
            <g key={i}>
              <path d={l.outline} fill="var(--color-teal-deep)" stroke={LINE} strokeWidth="0.9" />
              <g fill="var(--color-ochre-soft)">
                {l.dots.map(([x, y], j) => (
                  <circle key={j} cx={x} cy={y} r="0.8" />
                ))}
              </g>
            </g>
          ))}
          {florets.map((f, i) => (
            <g key={i}>
              <g fill={t.floret} stroke={LINE} strokeWidth="0.9">
                {f.petals.map((d, j) => (
                  <path key={j} d={d} />
                ))}
              </g>
              <circle cx={SMALL[i][0]} cy={SMALL[i][1]} r="4.4" fill="var(--color-brown-deep)" />
              <g fill={t.floret}>
                {floretRings[i].map(([x, y], j) => (
                  <circle key={j} cx={x} cy={y} r="1.1" />
                ))}
              </g>
            </g>
          ))}
        </pattern>
        {drape && (
          <filter id={`drape-${id}`} filterUnits="userSpaceOnUse" x="-200" y="-200" width="1600" height="1300">
            <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.0085" numOctaves="2" seed="5" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="80" xChannelSelector="R" yChannelSelector="G" result="w" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.14  0 0 0 0 0.07  0 0 0 0 0.05  -3 0 0 0 1.5" result="shade" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 0.8  0 0 0 0 0.6  1.5 0 0 0 -0.95" result="light" />
            <feMerge>
              <feMergeNode in="w" />
              <feMergeNode in="shade" />
              <feMergeNode in="light" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g filter={drape ? `url(#drape-${id})` : undefined}>
        <g transform={drape ? 'rotate(-18 600 450)' : undefined}>
          <rect x="-300" y="-300" width="1800" height="1500" fill={t.ground} />
          <rect x="-300" y="-300" width="1800" height="1500" fill={`url(#tile-${id})`} />
        </g>
      </g>
    </svg>
  )
}
