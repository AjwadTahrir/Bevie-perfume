import { useId } from 'react'

/**
 * PLACEHOLDER BOTTLE ILLUSTRATION
 * A neutral, stylised bottle drawn in the site palette. It stands in
 * for product photography until real images are supplied (set
 * `image` on a perfume record). The label is intentionally blank:
 * no invented branding, names or claims.
 */

export const LIQUIDS = {
  sage: { fill: 'var(--color-teal)', opacity: 0.85, tint: 'var(--color-teal-soft)' },
  amber: { fill: 'var(--color-ochre)', opacity: 0.7, tint: 'var(--color-cream-deep)' },
  forest: { fill: 'var(--color-brown)', opacity: 0.82, tint: 'var(--color-teal-soft)' },
  smoke: { fill: 'var(--color-brown)', opacity: 0.5, tint: 'var(--color-ochre-soft)' },
}

const CAPS = {
  gold: 'var(--color-ochre)',
  forest: 'var(--color-brown)',
  espresso: 'var(--color-brown)',
}

// Each shape: glass body path, liquid top line, neck, cap and label geometry.
const SHAPES = {
  arch: {
    body: 'M52 276 V152 A48 48 0 0 1 148 152 V276 Z',
    liquidTop: 150,
    neck: { x: 88, y: 86, w: 24, h: 20 },
    cap: <rect x="78" y="34" width="44" height="54" rx="4" />,
    label: { x: 72, y: 188, w: 56, h: 56, arch: true },
    highlight: 'M64 160 V258',
  },
  flask: {
    body: 'M100 118 C142 118 172 150 172 196 C172 244 140 278 100 278 C60 278 28 244 28 196 C28 150 58 118 100 118 Z',
    liquidTop: 160,
    neck: { x: 88, y: 92, w: 24, h: 28 },
    cap: <circle cx="100" cy="68" r="26" />,
    label: { x: 74, y: 178, w: 52, h: 44 },
    highlight: 'M46 176 C42 200 48 226 60 244',
  },
  column: {
    body: 'M68 104 H132 V276 H68 Z',
    liquidTop: 128,
    neck: { x: 90, y: 88, w: 20, h: 18 },
    cap: <rect x="76" y="28" width="48" height="62" />,
    label: { x: 78, y: 170, w: 44, h: 64 },
    highlight: 'M78 116 V264',
  },
  facet: {
    body: 'M58 136 L82 112 H118 L142 136 V254 L118 278 H82 L58 254 Z',
    liquidTop: 148,
    neck: { x: 88, y: 92, w: 24, h: 22 },
    cap: <path d="M80 92 L72 72 L84 46 H116 L128 72 L120 92 Z" />,
    label: { x: 74, y: 172, w: 52, h: 58 },
    highlight: 'M68 142 V248',
  },
}

export default function BottleIllustration({ bottle = {}, className = '', title }) {
  const shape = SHAPES[bottle.shape] || SHAPES.arch
  const liquid = LIQUIDS[bottle.liquid] || LIQUIDS.sage
  const cap = CAPS[bottle.cap] || CAPS.gold
  const clip = `bottle-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const { label } = shape

  return (
    <svg
      viewBox="0 0 200 300"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      <defs>
        <clipPath id={clip}>
          <path d={shape.body} />
        </clipPath>
      </defs>

      <ellipse cx="100" cy="284" rx="62" ry="6" fill="var(--color-brown)" opacity="0.1" />

      {/* Neck */}
      <rect {...{ x: shape.neck.x, y: shape.neck.y, width: shape.neck.w, height: shape.neck.h }} fill="var(--color-cream)" stroke="var(--color-brown)" strokeWidth="1.4" />

      {/* Glass body with liquid */}
      <path d={shape.body} fill="var(--color-cream)" fillOpacity="0.55" />
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y={shape.liquidTop} width="200" height="200" fill={liquid.fill} fillOpacity={liquid.opacity} />
        <rect x="0" y={shape.liquidTop} width="200" height="3" fill="var(--color-cream)" fillOpacity="0.45" />
      </g>
      <path d={shape.body} fill="none" stroke="var(--color-brown)" strokeWidth="1.6" />
      <path d={shape.highlight} fill="none" stroke="var(--color-cream)" strokeOpacity="0.75" strokeWidth="4" strokeLinecap="round" />

      {/* Blank label cartouche */}
      <g fill="var(--color-cream)" stroke="var(--color-ochre)" strokeWidth="1">
        {label.arch ? (
          <path d={`M${label.x} ${label.y + label.h} V${label.y + label.w / 2} A${label.w / 2} ${label.w / 2} 0 0 1 ${label.x + label.w} ${label.y + label.w / 2} V${label.y + label.h} Z`} />
        ) : (
          <rect x={label.x} y={label.y} width={label.w} height={label.h} />
        )}
      </g>
      <g fill="var(--color-ochre)">
        <circle cx="100" cy={label.y + label.h / 2 + (label.arch ? 6 : 0)} r="2.4" />
        <circle cx="94" cy={label.y + label.h / 2 + (label.arch ? 6 : 0)} r="1.3" />
        <circle cx="106" cy={label.y + label.h / 2 + (label.arch ? 6 : 0)} r="1.3" />
      </g>

      {/* Cap */}
      <g fill={cap} stroke="var(--color-brown)" strokeWidth="1.4">
        {shape.cap}
      </g>
    </svg>
  )
}
