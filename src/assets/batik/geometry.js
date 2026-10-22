/**
 * BATIK GEOMETRY
 * ---------------------------------------------------------------
 * Small helpers that generate the building blocks of the Beavie
 * botanical language: notched petals, veined leaves, spiral
 * tendrils and dot clusters (the fine dotted fills drawn with a
 * canting are the main reference). Every illustration in
 * src/assets/batik is composed from these, so line character stays
 * consistent across the site.
 *
 * These are original drawings inspired by batik florals. They do
 * not reproduce any specific traditional pattern.
 */

const r = (n) => Math.round(n * 100) / 100
const deg = (a) => (a * Math.PI) / 180

/** Local frame: u runs along the motif axis, v across it. */
function frame(cx, cy, angle) {
  const c = Math.cos(deg(angle))
  const s = Math.sin(deg(angle))
  return (u, v) => [r(cx + u * c - v * s), r(cy + u * s + v * c)]
}

const p = (pt) => `${pt[0]} ${pt[1]}`

function cubicAt(a, b, c, d, t) {
  const m = 1 - t
  return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d
}

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
export function smoothPath(pts) {
  let d = `M${p(pts[0])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1 = [r(p1[0] + (p2[0] - p0[0]) / 6), r(p1[1] + (p2[1] - p0[1]) / 6)]
    const c2 = [r(p2[0] - (p3[0] - p1[0]) / 6), r(p2[1] - (p3[1] - p1[1]) / 6)]
    d += ` C${p(c1)} ${p(c2)} ${p(p2)}`
  }
  return d
}

/**
 * Petal with a heart-notched tip.
 * `width` is the half-width at the petal's widest point.
 */
export function petal({ cx, cy, angle, inner = 0, length, width, notch = true }) {
  const f = frame(cx, cy, angle)
  const span = length - inner
  const P = (k, w) => f(inner + span * k, width * w)
  if (!notch) {
    return `M${p(P(0, 0))} C${p(P(0.2, 0.95))} ${p(P(0.7, 1.05))} ${p(P(1, 0))} C${p(P(0.7, -1.05))} ${p(P(0.2, -0.95))} ${p(P(0, 0))}Z`
  }
  return (
    `M${p(P(0, 0))}` +
    ` C${p(P(0.18, 0.95))} ${p(P(0.62, 1.15))} ${p(P(0.93, 0.55))}` +
    ` C${p(P(1.02, 0.32))} ${p(P(1, 0.08))} ${p(P(0.9, 0))}` +
    ` C${p(P(1, -0.08))} ${p(P(1.02, -0.32))} ${p(P(0.93, -0.55))}` +
    ` C${p(P(0.62, -1.15))} ${p(P(0.18, -0.95))} ${p(P(0, 0))}Z`
  )
}

/** Dots along a petal's centre line (the dotted "isen" fill). */
export function petalDots({ cx, cy, angle, inner = 0, length, count = 6, from = 0.2, to = 0.62 }) {
  const f = frame(cx, cy, angle)
  const span = length - inner
  return Array.from({ length: count }, (_, i) => {
    const k = from + ((to - from) * i) / Math.max(1, count - 1)
    return f(inner + span * k, 0)
  })
}

/** Fan of fine veins from the petal base. */
export function petalVeins({ cx, cy, angle, inner = 0, length, width, lines = 5, reach = 0.72 }) {
  const f = frame(cx, cy, angle)
  const span = length - inner
  const out = []
  for (let i = 0; i < lines; i++) {
    const t = lines === 1 ? 0 : (i / (lines - 1)) * 2 - 1
    const end = f(inner + span * (reach - Math.abs(t) * 0.18), width * t * 0.62)
    const ctrl = f(inner + span * 0.35, width * t * 0.5)
    const start = f(inner + span * 0.08, 0)
    out.push(`M${p(start)} Q${p(ctrl)} ${p(end)}`)
  }
  return out
}

/** Whole flower: returns petal paths, inner outlines and centre-line dots. */
export function flower({ cx, cy, petals = 5, rotation = -90, inner, length, width, innerScale = 0.64 }) {
  const out = { petals: [], inners: [], dots: [], angles: [] }
  for (let i = 0; i < petals; i++) {
    const angle = rotation + (360 / petals) * i
    out.angles.push(angle)
    out.petals.push(petal({ cx, cy, angle, inner, length, width }))
    out.inners.push(
      petal({ cx, cy, angle, inner: inner * 1.1, length: inner + (length - inner) * innerScale, width: width * 0.5, notch: false }),
    )
    out.dots.push(...petalDots({ cx, cy, angle, inner, length, count: 5, from: 0.72, to: 0.86 }))
  }
  return out
}

/**
 * Pointed leaf.
 * style 'veins' gives a midrib with alternating side veins,
 * style 'dots' gives a midrib with two rows of dots.
 */
export function leaf({ x, y, angle, length, width, style = 'veins' }) {
  const f = frame(x, y, angle)
  const L = length
  const W = width
  const outline = `M${p(f(0, 0))} C${p(f(L * 0.25, W))} ${p(f(L * 0.7, W * 0.78))} ${p(f(L, 0))} C${p(f(L * 0.7, -W * 0.78))} ${p(f(L * 0.25, -W))} ${p(f(0, 0))}Z`
  const midrib = `M${p(f(0, 0))} Q${p(f(L * 0.5, W * 0.06))} ${p(f(L * 0.93, 0))}`
  const edge = (t) => [cubicAt(0, L * 0.25, L * 0.7, L, t), cubicAt(0, W, W * 0.78, 0, t)]
  const veins = []
  const dots = []
  if (style === 'veins') {
    ;[0.16, 0.3, 0.44, 0.58, 0.72].forEach((t, i) => {
      const side = i % 2 === 0 ? 1 : -1
      const [eu, ev] = edge(Math.min(t + 0.12, 0.9))
      const start = f(L * t, 0)
      const end = f(eu, ev * 0.78 * side)
      const ctrl = f(L * t + (eu - L * t) * 0.25, ev * 0.55 * side)
      veins.push(`M${p(start)} Q${p(ctrl)} ${p(end)}`)
    })
  } else {
    for (let i = 1; i <= 7; i++) {
      const t = 0.12 + i * 0.1
      const [eu, ev] = edge(t)
      dots.push(f(eu, ev * 0.5), f(eu, -ev * 0.5))
    }
  }
  return { outline, midrib, veins, dots }
}

/** Closed bud with two sepals. */
export function bud({ x, y, angle, length, width }) {
  const f = frame(x, y, angle)
  const L = length
  const W = width
  const outline = `M${p(f(0, 0))} C${p(f(L * 0.15, W * 1.05))} ${p(f(L * 0.9, W * 0.95))} ${p(f(L, 0))} C${p(f(L * 0.9, -W * 0.95))} ${p(f(L * 0.15, -W * 1.05))} ${p(f(0, 0))}Z`
  const fold = `M${p(f(L * 0.12, 0))} Q${p(f(L * 0.55, W * 0.55))} ${p(f(L * 0.96, W * 0.05))}`
  const sepals = [1, -1].map((s) => leaf({ x, y, angle: angle + 38 * s, length: L * 0.55, width: W * 0.38 }).outline)
  return { outline, fold, sepals }
}

/**
 * Spiral tendril, drawn from the centre outward.
 * `extend` appends points so the tendril can trail into a stem.
 */
export function spiral({ cx, cy, r0 = 1.5, r1, turns = 1.7, start = 0, dir = 1, extend = [] }) {
  const steps = Math.ceil(turns * 18)
  const pts = []
  for (let k = 0; k <= steps; k++) {
    const t = k / steps
    const a = deg(start) + dir * t * turns * Math.PI * 2
    const rad = r0 + (r1 - r0) * Math.pow(t, 0.9)
    pts.push([r(cx + rad * Math.cos(a)), r(cy + rad * Math.sin(a))])
  }
  return smoothPath([...pts, ...extend])
}

/** Seed rosette: centre dot with a ring of smaller dots. Returns [x, y, radius][]. */
export function seedCluster({ cx, cy, ring = 7, count = 6, size = 2.4, rotation = 0 }) {
  const out = [[cx, cy, r(size * 1.25)]]
  for (let i = 0; i < count; i++) {
    const a = deg(rotation + (360 / count) * i)
    out.push([r(cx + ring * Math.cos(a)), r(cy + ring * Math.sin(a)), size])
  }
  return out
}

/** Ring of evenly spaced points. */
export function ring({ cx, cy, radius, count, rotation = 0 }) {
  return Array.from({ length: count }, (_, i) => {
    const a = deg(rotation + (360 / count) * i)
    return [r(cx + radius * Math.cos(a)), r(cy + radius * Math.sin(a))]
  })
}

/** One half of a pointed leaf (midrib to one edge), for two-tone shading. side: 1 or -1. */
export function leafHalf({ x, y, angle, length, width, side = 1 }) {
  const f = frame(x, y, angle)
  const L = length
  const W = width * side
  return `M${p(f(0, 0))} C${p(f(L * 0.25, W))} ${p(f(L * 0.7, W * 0.78))} ${p(f(L, 0))} Q${p(f(L * 0.5, W * 0.06))} ${p(f(0, 0))}Z`
}
