import { flower, leaf, leafHalf, bud, smoothPath, ring, petalVeins } from './geometry'

/**
 * BOTANICAL SPRAYS
 * Painted-batik botanicals in the moodboard's manner: two-tone teal
 * leaves with ochre veins, layered rust and cream blossoms, buds and
 * curling stems, all outlined in deep brown like canting wax lines.
 *
 * Each preset describes its stems; leaves are placed along them
 * (deterministic, so server and client agree) and every stem ends in
 * a blossom or a bud. Original artwork inspired by batik florals.
 *   grand   large spray behind the hero bottle
 *   sprig   small spray behind collection bottles
 *   branch  tall upright study for the heritage panel
 */

/** Small deterministic random generator (mulberry32). */
function rng(seed) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Point and direction at fraction t along a polyline. */
function along(pts, t) {
  const segs = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0]
    const dy = pts[i + 1][1] - pts[i][1]
    const l = Math.hypot(dx, dy)
    segs.push([l, dx, dy])
    total += l
  }
  let d = t * total
  for (let i = 0; i < segs.length; i++) {
    const [l, dx, dy] = segs[i]
    if (d <= l || i === segs.length - 1) {
      const k = l ? Math.min(d / l, 1) : 0
      return { x: pts[i][0] + dx * k, y: pts[i][1] + dy * k, angle: (Math.atan2(dy, dx) * 180) / Math.PI }
    }
    d -= l
  }
}

function buildSpray({ stems, seed = 1 }) {
  const rand = rng(seed)
  const out = { stems: [], leaves: [], blossoms: [], buds: [] }
  stems.forEach((s) => {
    out.stems.push({ d: smoothPath(s.pts), w: s.width ?? 2 })
    const n = s.leaves ?? 0
    const from = s.from ?? 0.14
    const to = s.to ?? 0.84
    for (let i = 0; i < n; i++) {
      const a = along(s.pts, n === 1 ? (from + to) / 2 : from + ((to - from) * i) / (n - 1))
      const side = i % 2 ? 1 : -1
      const length = s.leafLen[0] + rand() * (s.leafLen[1] - s.leafLen[0])
      out.leaves.push({ x: a.x, y: a.y, angle: a.angle + side * (36 + rand() * 24), length, width: length * (0.27 + rand() * 0.07) })
      // Opposite leaf for fuller, overlapping foliage
      if (s.pair) out.leaves.push({ x: a.x, y: a.y, angle: a.angle - side * (30 + rand() * 24), length: length * 0.8, width: length * 0.8 * 0.3 })
    }
    if (s.tip) {
      const [x, y] = s.pts[s.pts.length - 1]
      const [px, py] = s.pts[s.pts.length - 2]
      const angle = (Math.atan2(y - py, x - px) * 180) / Math.PI
      if (s.tip.type === 'bud') out.buds.push(bud({ x, y, angle, length: s.tip.r, width: s.tip.r * 0.36 }))
      else out.blossoms.push({ cx: x, cy: y, r: s.tip.r, petals: s.tip.petals ?? 6, rot: rand() * 50 })
    }
  })
  return out
}

const PRESETS = {
  grand: {
    viewBox: '0 0 700 760',
    seed: 7,
    stems: [
      { pts: [[350, 760], [340, 620], [300, 500], [250, 390], [222, 270], [244, 150]], leaves: 10, pair: true, leafLen: [78, 124], width: 4, tip: { r: 80, petals: 7 } },
      { pts: [[344, 640], [420, 566], [500, 506], [578, 470], [640, 398]], leaves: 7, pair: true, leafLen: [66, 104], width: 3, tip: { r: 66 } },
      { pts: [[318, 560], [240, 522], [160, 500], [92, 430]], leaves: 6, pair: true, leafLen: [62, 96], width: 3, tip: { r: 58 } },
      { pts: [[268, 420], [356, 336], [432, 262], [474, 172]], leaves: 6, pair: true, leafLen: [58, 90], tip: { type: 'bud', r: 56 } },
      { pts: [[598, 482], [652, 560], [684, 646]], leaves: 3, leafLen: [50, 72], tip: { r: 42, petals: 5 } },
      { pts: [[338, 700], [250, 690], [170, 660], [108, 600]], leaves: 4, pair: true, leafLen: [56, 84], tip: { type: 'bud', r: 44 } },
      { pts: [[230, 330], [152, 262], [112, 180]], leaves: 3, leafLen: [50, 74], tip: { r: 46, petals: 6 } },
      { pts: [[452, 250], [540, 220], [600, 150]], leaves: 3, leafLen: [46, 66], tip: { r: 40, petals: 6 } },
      { pts: [[300, 500], [380, 440], [430, 400]], leaves: 2, leafLen: [52, 70], tip: { r: 36, petals: 5 } },
      { pts: [[560, 480], [520, 600], [470, 690]], leaves: 3, leafLen: [48, 70], tip: { type: 'bud', r: 40 } },
    ],
  },
  sprig: {
    viewBox: '0 0 300 360',
    seed: 3,
    stems: [
      { pts: [[150, 360], [146, 282], [130, 200], [118, 124], [128, 62]], leaves: 6, pair: true, leafLen: [44, 66], width: 2.4, tip: { r: 44 } },
      { pts: [[144, 250], [198, 222], [246, 172]], leaves: 2, leafLen: [34, 48], tip: { type: 'bud', r: 32 } },
      { pts: [[134, 186], [84, 158], [52, 108]], leaves: 2, leafLen: [30, 44], tip: { r: 26, petals: 5 } },
    ],
  },
  branch: {
    viewBox: '0 0 320 540',
    seed: 11,
    stems: [
      { pts: [[160, 540], [170, 430], [150, 330], [170, 228], [160, 130], [174, 56]], leaves: 9, pair: true, leafLen: [44, 70], width: 2.6, tip: { r: 48 } },
      { pts: [[166, 390], [232, 350], [272, 288]], leaves: 2, leafLen: [34, 50], tip: { r: 34, petals: 5 } },
      { pts: [[156, 280], [92, 246], [58, 186]], leaves: 2, leafLen: [32, 46], tip: { type: 'bud', r: 32 } },
      { pts: [[166, 176], [222, 146], [248, 92]], leaves: 1, leafLen: [30, 40], tip: { r: 26, petals: 5 } },
    ],
  },
}

const BUILT = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, { viewBox: v.viewBox, ...buildSpray(v) }]))

export const LINE = 'var(--color-brown-deep)'

/** Two-tone batik leaf. */
export function BatikLeaf({ x, y, angle, length, width, line = LINE, fill = 'var(--color-teal)', shade = 'var(--color-teal-deep)', vein = 'var(--color-ochre)', sw = 1.4 }) {
  const l = leaf({ x, y, angle, length, width, style: 'veins' })
  return (
    <g>
      <path d={l.outline} fill={fill} />
      <path d={leafHalf({ x, y, angle, length, width, side: -1 })} fill={shade} />
      <g stroke={vein} strokeWidth={sw * 0.7}>
        {l.veins.map((v, j) => (
          <path key={j} d={v} />
        ))}
      </g>
      <path d={l.midrib} stroke={vein} strokeWidth={sw * 0.8} />
      <path d={l.outline} stroke={line} strokeWidth={sw} />
    </g>
  )
}

const LIGHT_BLOSSOM = {
  outer: 'var(--color-rust)',
  vein: 'var(--color-ochre-soft)',
  mid: 'var(--color-cream-light)',
  midInner: 'var(--color-ochre)',
  centre: 'var(--color-brown)',
  dot: 'var(--color-ochre)',
}

/** Layered batik blossom: rust outer petals, cream inner petals, dotted centre. */
export function Blossom({ cx, cy, r, petals = 6, rot = 0, colors = LIGHT_BLOSSOM, line = LINE, sw = 1.4 }) {
  const outer = flower({ cx, cy, petals, rotation: rot - 90, inner: r * 0.16, length: r, width: r * 0.44 })
  const mid = flower({ cx, cy, petals, rotation: rot - 90 + 180 / petals, inner: r * 0.14, length: r * 0.68, width: r * 0.34 })
  const veins = outer.angles.flatMap((angle) => petalVeins({ cx, cy, angle, inner: r * 0.16, length: r, width: r * 0.44, lines: 3, reach: 0.72 }))
  const centreDots = ring({ cx, cy, radius: r * 0.12, count: 8 })
  return (
    <g>
      <g fill={colors.outer} stroke={line} strokeWidth={sw}>
        {outer.petals.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g stroke={colors.vein} strokeWidth={sw * 0.6}>
        {veins.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill={colors.mid} stroke={line} strokeWidth={sw * 0.9}>
        {mid.petals.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill={colors.midInner}>
        {mid.inners.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r * 0.2} fill={colors.centre} stroke={line} strokeWidth={sw * 0.8} />
      <g fill={colors.dot}>
        {centreDots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={Math.max(r * 0.028, 0.8)} />
        ))}
        {outer.dots.map(([x, y], i) => (
          <circle key={`t${i}`} cx={x} cy={y} r={Math.max(r * 0.03, 0.8)} />
        ))}
      </g>
    </g>
  )
}

export default function Foliage({ variant = 'sprig', className = '' }) {
  const s = BUILT[variant] || BUILT.sprig
  const sw = variant === 'grand' ? 1.7 : 1.3
  return (
    <svg viewBox={s.viewBox} className={className} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g stroke="var(--color-brown)">
        {s.stems.map((st, i) => (
          <path key={i} d={st.d} strokeWidth={st.w} />
        ))}
      </g>
      {s.leaves.map((l, i) => (
        <BatikLeaf key={i} {...l} sw={sw} fill={i % 3 === 2 ? 'var(--color-teal-soft)' : 'var(--color-teal)'} />
      ))}
      {s.buds.map((b, i) => (
        <g key={i} stroke={LINE} strokeWidth={sw}>
          {b.sepals.map((d, j) => (
            <path key={j} d={d} fill="var(--color-teal-deep)" />
          ))}
          <path d={b.outline} fill="var(--color-rust)" />
          <path d={b.fold} stroke="var(--color-ochre-soft)" />
        </g>
      ))}
      {s.blossoms.map((b, i) => (
        <Blossom key={i} {...b} sw={sw} />
      ))}
    </svg>
  )
}
