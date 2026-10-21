import { flower, leaf, bud, spiral, seedCluster, ring, petalDots } from './geometry'

/**
 * PHILOSOPHY TRIO
 * A family of three upright botanical studies, drawn on the same
 * 240 x 320 canvas with identical line weights:
 *   heritage      | a rooted bud: something carried forward
 *   individuality | a single open bloom
 *   character     | a tendril that turns its own way
 */

const S = { stroke: 'var(--color-forest)', strokeWidth: 1.5 }

const heritage = {
  stem: 'M120 250 C118 210 124 170 120 120',
  roots: [
    'M120 250 C112 268 98 276 84 290',
    'M120 250 C126 270 140 280 156 292',
    'M120 252 C120 272 118 288 120 306',
    'M104 272 C96 274 90 280 86 286',
    'M136 274 C144 276 150 282 152 288',
  ],
  leaves: [
    leaf({ x: 120, y: 200, angle: -150, length: 70, width: 20 }),
    leaf({ x: 121, y: 170, angle: -28, length: 64, width: 18, style: 'dots' }),
  ],
  bud: bud({ x: 120, y: 122, angle: -90, length: 78, width: 26 }),
  ground: Array.from({ length: 11 }, (_, i) => [50 + i * 14, 250]),
}

const individuality = (() => {
  const f = flower({ cx: 120, cy: 110, petals: 5, rotation: -90, inner: 14, length: 82, width: 32 })
  return {
    f,
    axis: f.angles.flatMap((angle) => petalDots({ cx: 120, cy: 110, angle, inner: 14, length: 82, count: 4, from: 0.18, to: 0.5 })),
    ring: ring({ cx: 120, cy: 110, radius: 8, count: 7 }),
    stem: 'M120 192 C116 230 126 262 120 306',
    leaf: leaf({ x: 121, y: 250, angle: -35, length: 72, width: 20 }),
    leaf2: leaf({ x: 119, y: 280, angle: -155, length: 54, width: 15, style: 'dots' }),
  }
})()

const character = {
  path: spiral({ cx: 150, cy: 82, r1: 40, turns: 1.85, start: 200, dir: 1, extend: [[108, 140], [96, 200], [110, 260], [118, 306]] }),
  leaves: [
    leaf({ x: 100, y: 180, angle: -160, length: 62, width: 18 }),
    leaf({ x: 103, y: 228, angle: -18, length: 66, width: 19, style: 'dots' }),
    leaf({ x: 114, y: 272, angle: -160, length: 50, width: 14 }),
  ],
  seeds: [
    ...seedCluster({ cx: 70, cy: 70, ring: 7, size: 2, rotation: 10 }),
    ...seedCluster({ cx: 196, cy: 182, ring: 7, size: 2 }),
  ],
}

function Leaf({ l }) {
  return (
    <g>
      <path d={l.outline} fill="var(--color-ivory)" {...S} pathLength="1" className="draw" />
      <path d={l.midrib} {...S} strokeWidth="1.1" pathLength="1" className="draw" />
      {l.veins.map((v, i) => <path key={i} d={v} {...S} strokeWidth="1" pathLength="1" className="draw" />)}
      <g fill="var(--color-gold)" className="fade">
        {l.dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" />)}
      </g>
    </g>
  )
}

function Heritage() {
  const h = heritage
  return (
    <>
      <g fill="var(--color-gold)" className="fade">
        {h.ground.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" />)}
      </g>
      {h.roots.map((d, i) => <path key={i} d={d} {...S} strokeWidth="1.2" pathLength="1" className="draw" />)}
      <path d={h.stem} {...S} pathLength="1" className="draw" />
      {h.leaves.map((l, i) => <Leaf key={i} l={l} />)}
      {h.bud.sepals.map((d, i) => <path key={i} d={d} fill="var(--color-sage-soft)" {...S} pathLength="1" className="draw" />)}
      <path d={h.bud.outline} fill="var(--color-ivory)" {...S} pathLength="1" className="draw" />
      <path d={h.bud.fold} {...S} strokeWidth="1.1" pathLength="1" className="draw" />
      <g fill="var(--color-gold)" className="fade">
        <circle cx="120" cy="30" r="2.4" />
        <circle cx="108" cy="22" r="1.5" />
        <circle cx="132" cy="22" r="1.5" />
      </g>
    </>
  )
}

function Individuality() {
  const v = individuality
  return (
    <>
      <path d={v.stem} {...S} pathLength="1" className="draw" />
      <Leaf l={v.leaf} />
      <Leaf l={v.leaf2} />
      {v.f.petals.map((d, i) => <path key={i} d={d} fill="var(--color-ivory)" {...S} pathLength="1" className="draw" />)}
      {v.f.inners.map((d, i) => <path key={i} d={d} fill="var(--color-sage-soft)" {...S} strokeWidth="1" pathLength="1" className="draw" />)}
      <g fill="var(--color-gold)" className="fade">
        {v.axis.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" />)}
        {v.f.dots.map(([x, y], i) => <circle key={`d${i}`} cx={x} cy={y} r="1.6" />)}
      </g>
      <g className="fade">
        <circle cx="120" cy="110" r="13" fill="var(--color-forest)" />
        {v.ring.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.5" fill="var(--color-ivory)" />)}
      </g>
    </>
  )
}

function Character() {
  const c = character
  return (
    <>
      <path d={c.path} {...S} pathLength="1" className="draw" />
      {c.leaves.map((l, i) => <Leaf key={i} l={l} />)}
      <g fill="var(--color-gold)" className="fade">
        {c.seeds.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
    </>
  )
}

const STUDIES = { heritage: Heritage, individuality: Individuality, character: Character }

export default function PhilosophyMotif({ name, className = '' }) {
  const Study = STUDIES[name]
  if (!Study) return null
  return (
    <svg viewBox="0 0 240 320" className={`batik-draw ${className}`} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Study />
    </svg>
  )
}
