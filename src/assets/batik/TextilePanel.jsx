import { flower, leaf, bud, spiral, seedCluster, ring, petalDots, petalVeins } from './geometry'

/**
 * TEXTILE PANEL
 * The richer, denser illustration for the brand story: a cloth-like
 * panel on forest green with a framed border band, a field of small
 * florets and two large blooms woven together by leaves and tendrils.
 * Original artwork inspired by batik composition; not a reproduction
 * of any traditional pattern.
 */

const W = 1200
const H = 640
const BAND = 46

// Background field of small four-petal florets on an offset grid.
const florets = []
for (let row = 0; row < 9; row++) {
  for (let col = 0; col < 18; col++) {
    const x = 96 + col * 64 + (row % 2) * 32
    const y = 96 + row * 56
    if (x > W - 90 || y > H - 90) continue
    florets.push(flower({ cx: x, cy: y, petals: 4, rotation: 45, inner: 2, length: 11, width: 5 }).petals)
  }
}

const bloomA = { x: 330, y: 330 }
const bloomB = { x: 902, y: 300 }
const A = flower({ cx: bloomA.x, cy: bloomA.y, petals: 6, rotation: -90, inner: 30, length: 168, width: 56 })
const A2 = flower({ cx: bloomA.x, cy: bloomA.y, petals: 6, rotation: -60, inner: 26, length: 126, width: 40 })
const B = flower({ cx: bloomB.x, cy: bloomB.y, petals: 5, rotation: -72, inner: 26, length: 140, width: 54 })

const veinsA = A.angles.flatMap((angle) =>
  petalVeins({ cx: bloomA.x, cy: bloomA.y, angle, inner: 30, length: 168, width: 56, lines: 5, reach: 0.66 }),
)
const veinsB = B.angles.flatMap((angle) =>
  petalVeins({ cx: bloomB.x, cy: bloomB.y, angle, inner: 26, length: 140, width: 54, lines: 5, reach: 0.66 }),
)
const dotsA = A.angles.flatMap((angle) =>
  petalDots({ cx: bloomA.x, cy: bloomA.y, angle, inner: 30, length: 168, count: 4, from: 0.74, to: 0.86 }),
)
const dotsB = B.angles.flatMap((angle) =>
  petalDots({ cx: bloomB.x, cy: bloomB.y, angle, inner: 26, length: 140, count: 4, from: 0.74, to: 0.86 }),
)

const leaves = [
  leaf({ x: 520, y: 470, angle: -18, length: 190, width: 50, style: 'veins' }),
  leaf({ x: 560, y: 452, angle: -78, length: 150, width: 40, style: 'dots' }),
  leaf({ x: 700, y: 360, angle: 160, length: 140, width: 38, style: 'veins' }),
  leaf({ x: 182, y: 520, angle: 150, length: 120, width: 32, style: 'dots' }),
  leaf({ x: 1010, y: 470, angle: -20, length: 110, width: 30, style: 'veins' }),
  leaf({ x: 1040, y: 180, angle: -120, length: 96, width: 26, style: 'dots' }),
]

const buds = [
  bud({ x: 640, y: 180, angle: -110, length: 84, width: 26 }),
  bud({ x: 1060, y: 520, angle: 20, length: 70, width: 22 }),
  bud({ x: 150, y: 150, angle: -140, length: 70, width: 22 }),
]

const stems = [
  'M420 450 C470 480 500 476 520 470 C600 450 650 400 700 360 C760 320 800 310 830 306',
  'M560 452 C590 360 610 260 640 180',
  'M1000 400 C1010 430 1012 452 1010 470 C1030 495 1048 510 1060 520',
  'M240 470 C220 500 200 512 182 520',
  'M960 220 C990 200 1020 186 1040 180',
  'M240 230 C210 200 180 175 150 150',
]

const tendrils = [
  spiral({ cx: 470, cy: 140, r1: 34, turns: 1.7, start: 0, dir: 1, extend: [[530, 112], [600, 132], [640, 180]] }),
  spiral({ cx: 760, cy: 520, r1: 30, turns: 1.6, start: 180, dir: -1, extend: [[800, 480], [860, 450], [900, 420]] }),
  spiral({ cx: 110, cy: 380, r1: 24, turns: 1.5, start: 90, dir: 1, extend: [[150, 410], [190, 420]] }),
]

const seeds = [
  [470, 560], [640, 560], [1100, 330], [780, 140], [240, 110], [1100, 110],
].flatMap(([cx, cy], i) => seedCluster({ cx, cy, ring: 8, size: 2.2, rotation: i * 17 }))

// Border band ornament: seed rosettes alternating with small diamonds.
const bandSeeds = []
for (let x = BAND + 30; x < W - BAND; x += 60) {
  bandSeeds.push(...seedCluster({ cx: x, cy: BAND / 2 + 4, ring: 5, count: 4, size: 1.4 }))
  bandSeeds.push(...seedCluster({ cx: x, cy: H - BAND / 2 - 4, ring: 5, count: 4, size: 1.4 }))
}
for (let y = BAND + 30; y < H - BAND; y += 60) {
  bandSeeds.push(...seedCluster({ cx: BAND / 2 + 4, cy: y, ring: 5, count: 4, size: 1.4 }))
  bandSeeds.push(...seedCluster({ cx: W - BAND / 2 - 4, cy: y, ring: 5, count: 4, size: 1.4 }))
}

function Bloom({ f, f2, veins, dots, c, size }) {
  return (
    <g>
      {f2 && (
        <g fill="var(--color-forest-deep)" stroke="var(--color-sage)" strokeWidth="1.2">
          {f2.petals.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      )}
      <g fill="var(--color-forest)" stroke="var(--color-ivory)" strokeWidth="1.5">
        {f.petals.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="var(--color-forest-deep)" stroke="var(--color-sage)" strokeWidth="1">
        {f.inners.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g stroke="var(--color-sage)" strokeWidth="0.8" opacity="0.7">
        {veins.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="var(--color-gold)">
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" />
        ))}
      </g>
      <circle cx={c.x} cy={c.y} r={size} fill="var(--color-gold)" />
      <circle cx={c.x} cy={c.y} r={size * 0.72} fill="var(--color-forest)" />
      {ring({ cx: c.x, cy: c.y, radius: size * 0.45, count: 8 }).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.8" fill="var(--color-ivory)" />
      ))}
      {ring({ cx: c.x, cy: c.y, radius: size * 1.45, count: 16 }).map(([x, y], i) => (
        <circle key={`o${i}`} cx={x} cy={y} r="1.5" fill="var(--color-ivory)" />
      ))}
    </g>
  )
}

export default function TextilePanel({ className = '' }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width={W} height={H} fill="var(--color-forest)" />

      {/* Floret field */}
      <g stroke="var(--color-sage)" strokeWidth="0.8" opacity="0.32">
        {florets.flat().map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Stems and tendrils */}
      <g stroke="var(--color-ivory)" strokeWidth="1.4">
        {stems.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {tendrils.map((d, i) => (
          <path key={`t${i}`} d={d} />
        ))}
      </g>

      {/* Leaves */}
      {leaves.map((l, i) => (
        <g key={i}>
          <path d={l.outline} fill="var(--color-forest-deep)" stroke="var(--color-ivory)" strokeWidth="1.4" />
          <path d={l.midrib} stroke="var(--color-sage)" strokeWidth="1.1" />
          <g stroke="var(--color-sage)" strokeWidth="1">
            {l.veins.map((v, j) => (
              <path key={j} d={v} />
            ))}
          </g>
          <g fill="var(--color-gold)">
            {l.dots.map(([x, y], j) => (
              <circle key={j} cx={x} cy={y} r="1.8" />
            ))}
          </g>
        </g>
      ))}

      {/* Buds */}
      {buds.map((b, i) => (
        <g key={i} stroke="var(--color-ivory)" strokeWidth="1.3">
          {b.sepals.map((s, j) => (
            <path key={j} d={s} fill="var(--color-forest-deep)" />
          ))}
          <path d={b.outline} fill="var(--color-forest)" />
          <path d={b.fold} stroke="var(--color-sage)" />
        </g>
      ))}

      <Bloom f={A} f2={A2} veins={veinsA} dots={dotsA} c={bloomA} size={30} />
      <Bloom f={B} veins={veinsB} dots={dotsB} c={bloomB} size={26} />

      <g fill="var(--color-gold)">
        {seeds.map(([x, y, rad], i) => (
          <circle key={i} cx={x} cy={y} r={rad} />
        ))}
      </g>

      {/* Border band */}
      <g stroke="var(--color-gold)" strokeWidth="1.2">
        <rect x="10" y="10" width={W - 20} height={H - 20} />
        <rect x={BAND} y={BAND} width={W - BAND * 2} height={H - BAND * 2} />
      </g>
      <g fill="var(--color-sage)">
        {bandSeeds.map(([x, y, rad], i) => (
          <circle key={i} cx={x} cy={y} r={rad} />
        ))}
      </g>
    </svg>
  )
}
