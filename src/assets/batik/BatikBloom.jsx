import { flower, leaf, bud, spiral, seedCluster, ring, petalDots, petalVeins } from './geometry'

/**
 * THE BATIK BLOOM
 * Signature hero illustration: an oversized, hibiscus-like bloom
 * with leaves, a bud and spiral tendrils, in fine line with dotted
 * fills. Original artwork, inspired by batik florals.
 *
 * Paths with class "draw" are line-drawn on entrance; "fade"
 * elements fade in. Both are disabled under reduced motion.
 */

const C = { x: 455, y: 400 }

const back = flower({ cx: C.x, cy: C.y, petals: 5, rotation: -54, inner: 30, length: 228, width: 70 })
const front = flower({ cx: C.x, cy: C.y, petals: 5, rotation: -90, inner: 34, length: 252, width: 94 })
const frontAxisDots = front.angles.flatMap((angle) =>
  petalDots({ cx: C.x, cy: C.y, angle, inner: 34, length: 252, count: 6, from: 0.14, to: 0.52 }),
)
const frontVeins = front.angles.flatMap((angle) =>
  petalVeins({ cx: C.x, cy: C.y, angle, inner: 34, length: 252, width: 94, lines: 4, reach: 0.6 }).slice(0, 4),
)
const centreRing = ring({ cx: C.x, cy: C.y, radius: 22, count: 10, rotation: -90 })
const outerRing = ring({ cx: C.x, cy: C.y, radius: 46, count: 20, rotation: -81 })

const small = flower({ cx: 150, cy: 168, petals: 6, rotation: -70, inner: 14, length: 96, width: 36 })
const smallRing = ring({ cx: 150, cy: 168, radius: 9, count: 7 })

const leaves = [
  leaf({ x: 352, y: 788, angle: 196, length: 176, width: 46, style: 'veins' }),
  leaf({ x: 418, y: 684, angle: -28, length: 196, width: 52, style: 'dots' }),
  leaf({ x: 438, y: 628, angle: 162, length: 132, width: 36, style: 'veins' }),
  leaf({ x: 214, y: 244, angle: 32, length: 86, width: 24, style: 'veins' }),
  leaf({ x: 214, y: 244, angle: -12, length: 74, width: 20, style: 'dots' }),
]

const theBud = bud({ x: 612, y: 820, angle: -62, length: 112, width: 34 })

const stems = [
  'M330 860 C330 780 410 720 430 640 C445 580 452 520 455 440',
  'M560 860 C580 846 600 834 612 820',
  'M150 264 C170 252 196 246 214 244',
]

const tendrils = [
  spiral({ cx: 118, cy: 560, r1: 42, turns: 1.8, start: 0, dir: 1, extend: [[190, 520], [244, 478]] }),
  spiral({ cx: 692, cy: 148, r1: 38, turns: 1.6, start: 180, dir: -1, extend: [[640, 196], [604, 236]] }),
  spiral({ cx: 714, cy: 712, r1: 24, turns: 1.5, start: 90, dir: 1, extend: [[680, 760], [640, 800]] }),
]

const seeds = [
  [252, 104], [742, 420], [70, 700], [566, 112], [236, 768], [704, 566], [44, 300],
].flatMap(([cx, cy], i) => seedCluster({ cx, cy, ring: 8, size: 2.2, rotation: i * 13 }))

export default function BatikBloom({ className = '' }) {
  let d = 0
  const next = (step = 80) => ({ '--d': `${(d += step)}ms` })

  return (
    <svg
      viewBox="0 0 800 860"
      className={`batik-draw ${className}`}
      aria-hidden="true"
      focusable="false"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Stems */}
      <g stroke="var(--color-forest)" strokeWidth="1.6">
        {stems.map((s, i) => (
          <path key={i} d={s} pathLength="1" className="draw" style={next(60)} />
        ))}
      </g>

      {/* Leaves */}
      {leaves.map((l, i) => (
        <g key={i}>
          <path d={l.outline} fill="var(--color-sage-soft)" className="fade" style={next(70)} />
          <g stroke="var(--color-forest)" strokeWidth="1.6">
            <path d={l.outline} pathLength="1" className="draw" style={next(0)} />
            <path d={l.midrib} pathLength="1" className="draw" strokeWidth="1.2" style={next(40)} />
            {l.veins.map((v, j) => (
              <path key={j} d={v} pathLength="1" className="draw" strokeWidth="1.1" style={next(20)} />
            ))}
          </g>
          <g fill="var(--color-gold)" className="fade" style={next(0)}>
            {l.dots.map(([x, y], j) => (
              <circle key={j} cx={x} cy={y} r="2" />
            ))}
          </g>
        </g>
      ))}

      {/* Bud */}
      <g stroke="var(--color-forest)" strokeWidth="1.6">
        {theBud.sepals.map((s, i) => (
          <path key={i} d={s} fill="var(--color-sage-soft)" pathLength="1" className="draw" style={next(60)} />
        ))}
        <path d={theBud.outline} fill="var(--color-ivory)" pathLength="1" className="draw" style={next(60)} />
        <path d={theBud.fold} pathLength="1" className="draw" strokeWidth="1.2" style={next(60)} />
      </g>

      {/* Tendrils */}
      <g stroke="var(--color-forest)" strokeWidth="1.4">
        {tendrils.map((t, i) => (
          <path key={i} d={t} pathLength="1" className="draw" style={next(90)} />
        ))}
      </g>

      {/* Secondary bloom */}
      <g>
        {small.petals.map((pt, i) => (
          <path key={i} d={pt} fill="var(--color-ivory)" stroke="var(--color-forest)" strokeWidth="1.5" pathLength="1" className="draw" style={next(50)} />
        ))}
        {small.inners.map((pt, i) => (
          <path key={i} d={pt} fill="var(--color-sage-soft)" stroke="var(--color-forest)" strokeWidth="1" pathLength="1" className="draw" style={next(30)} />
        ))}
        <g className="fade" style={next(60)}>
          <circle cx="150" cy="168" r="14" fill="var(--color-forest)" />
          {smallRing.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="var(--color-ivory)" />
          ))}
        </g>
      </g>

      {/* Main bloom: back petals */}
      <g>
        {back.petals.map((pt, i) => (
          <path key={i} d={pt} fill="var(--color-sage-soft)" stroke="var(--color-forest)" strokeWidth="1.5" pathLength="1" className="draw" style={next(70)} />
        ))}
        <g fill="var(--color-forest)" className="fade" style={next(0)}>
          {back.dots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" />
          ))}
        </g>
      </g>

      {/* Main bloom: front petals */}
      <g>
        {front.petals.map((pt, i) => (
          <path key={i} d={pt} fill="var(--color-ivory)" stroke="var(--color-forest)" strokeWidth="1.7" pathLength="1" className="draw" style={next(90)} />
        ))}
        {front.inners.map((pt, i) => (
          <path key={i} d={pt} fill="var(--color-sage-soft)" stroke="var(--color-forest)" strokeWidth="1.1" pathLength="1" className="draw" style={next(50)} />
        ))}
        <g stroke="var(--color-forest)" strokeWidth="0.9" opacity="0.55">
          {frontVeins.map((v, i) => (
            <path key={i} d={v} pathLength="1" className="draw" style={next(12)} />
          ))}
        </g>
        <g fill="var(--color-gold)" className="fade" style={next(60)}>
          {frontAxisDots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" />
          ))}
          {front.dots.map(([x, y], i) => (
            <circle key={`t${i}`} cx={x} cy={y} r="2.1" />
          ))}
        </g>
      </g>

      {/* Bloom centre */}
      <g className="fade" style={next(80)}>
        {outerRing.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.8" fill="var(--color-forest)" />
        ))}
        <circle cx={C.x} cy={C.y} r="34" fill="var(--color-forest)" />
        <circle cx={C.x} cy={C.y} r="28" stroke="var(--color-gold)" strokeWidth="1" />
        {centreRing.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.4" fill="var(--color-ivory)" />
        ))}
        <circle cx={C.x} cy={C.y} r="5" fill="var(--color-gold)" />
      </g>

      {/* Seed clusters */}
      <g fill="var(--color-gold)" className="fade" style={next(100)}>
        {seeds.map(([x, y, rad], i) => (
          <circle key={i} cx={x} cy={y} r={rad} />
        ))}
      </g>
    </svg>
  )
}
