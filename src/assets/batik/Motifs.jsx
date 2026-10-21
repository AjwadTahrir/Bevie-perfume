import { flower, leaf, spiral, seedCluster, ring, petalDots } from './geometry'

/**
 * SMALL MOTIFS
 * Four compact ornaments used on product cards (small) and behind
 * the product in the detail modal (large). Same stroke weight as the
 * larger artwork thanks to non-scaling strokes.
 *   bloom   | five-petal flower with dotted centre
 *   sprig   | stem with three leaves
 *   seed    | seed rosette with orbiting dots
 *   tendril | spiral tendril with a single leaf
 */

const bloom = (() => {
  const f = flower({ cx: 60, cy: 60, petals: 5, rotation: -90, inner: 8, length: 46, width: 18 })
  const axis = f.angles.flatMap((angle) => petalDots({ cx: 60, cy: 60, angle, inner: 8, length: 46, count: 3, from: 0.2, to: 0.5 }))
  return { petals: f.petals, inners: f.inners, dots: axis, ring: ring({ cx: 60, cy: 60, radius: 4.5, count: 6 }) }
})()

const sprig = (() => {
  const l = [
    leaf({ x: 58, y: 66, angle: -150, length: 38, width: 11 }),
    leaf({ x: 64, y: 50, angle: -30, length: 36, width: 10 }),
    leaf({ x: 60, y: 30, angle: -95, length: 26, width: 8, style: 'dots' }),
  ]
  return { leaves: l, stem: 'M54 108 C56 90 60 72 58 66 C57 58 62 52 64 50 C62 42 60 36 60 30' }
})()

const seed = {
  centre: seedCluster({ cx: 60, cy: 60, ring: 11, count: 8, size: 3 }),
  orbit: ring({ cx: 60, cy: 60, radius: 30, count: 12, rotation: 15 }),
  diamonds: ring({ cx: 60, cy: 60, radius: 44, count: 4, rotation: 45 }),
}

const tendril = {
  path: spiral({ cx: 44, cy: 44, r1: 22, turns: 1.6, start: 180, dir: 1, extend: [[80, 70], [92, 104]] }),
  leaf: leaf({ x: 82, y: 78, angle: -20, length: 30, width: 9, style: 'dots' }),
}

const stroke = { stroke: 'currentColor', vectorEffect: 'non-scaling-stroke' }

function Bloom() {
  return (
    <>
      <g {...stroke} strokeWidth="1.2" fill="var(--motif-fill, transparent)">
        {bloom.petals.map((d, i) => <path key={i} d={d} style={{ vectorEffect: 'non-scaling-stroke' }} />)}
      </g>
      <g {...stroke} strokeWidth="0.9">
        {bloom.inners.map((d, i) => <path key={i} d={d} style={{ vectorEffect: 'non-scaling-stroke' }} />)}
      </g>
      <g fill="var(--color-gold)">
        {bloom.dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" />)}
      </g>
      <circle cx="60" cy="60" r="7.5" fill="currentColor" />
      {bloom.ring.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.9" fill="var(--color-ivory)" />)}
    </>
  )
}

function Sprig() {
  return (
    <>
      <path d={sprig.stem} {...stroke} strokeWidth="1.2" />
      {sprig.leaves.map((l, i) => (
        <g key={i} {...stroke} strokeWidth="1.1">
          <path d={l.outline} fill="var(--motif-fill, transparent)" style={{ vectorEffect: 'non-scaling-stroke' }} />
          <path d={l.midrib} style={{ vectorEffect: 'non-scaling-stroke' }} />
          {l.veins.map((v, j) => <path key={j} d={v} style={{ vectorEffect: 'non-scaling-stroke' }} />)}
          {l.dots.map(([x, y], j) => <circle key={j} cx={x} cy={y} r="1" fill="var(--color-gold)" stroke="none" />)}
        </g>
      ))}
    </>
  )
}

function Seed() {
  return (
    <>
      <circle cx="60" cy="60" r="20" {...stroke} strokeWidth="1.1" fill="var(--motif-fill, transparent)" />
      <circle cx="60" cy="60" r="36" {...stroke} strokeWidth="0.9" strokeDasharray="1 5" />
      <g fill="currentColor">
        {seed.centre.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      <g fill="var(--color-gold)">
        {seed.orbit.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" />)}
      </g>
      <g {...stroke} strokeWidth="1">
        {seed.diamonds.map(([x, y], i) => (
          <path key={i} d={`M${x} ${y - 5} L${x + 4} ${y} L${x} ${y + 5} L${x - 4} ${y} Z`} style={{ vectorEffect: 'non-scaling-stroke' }} />
        ))}
      </g>
    </>
  )
}

function Tendril() {
  return (
    <>
      <path d={tendril.path} {...stroke} strokeWidth="1.2" />
      <g {...stroke} strokeWidth="1.1">
        <path d={tendril.leaf.outline} fill="var(--motif-fill, transparent)" style={{ vectorEffect: 'non-scaling-stroke' }} />
        <path d={tendril.leaf.midrib} style={{ vectorEffect: 'non-scaling-stroke' }} />
      </g>
      <g fill="var(--color-gold)">
        {tendril.leaf.dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1" />)}
      </g>
      <circle cx="96" cy="22" r="2.2" fill="var(--color-gold)" />
      <circle cx="104" cy="30" r="1.4" fill="var(--color-gold)" />
      <circle cx="90" cy="32" r="1.4" fill="var(--color-gold)" />
    </>
  )
}

const MOTIFS = { bloom: Bloom, sprig: Sprig, seed: Seed, tendril: Tendril }

export default function Motif({ name = 'bloom', className = '' }) {
  const Shape = MOTIFS[name] || Bloom
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Shape />
    </svg>
  )
}
