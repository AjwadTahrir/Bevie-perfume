import symbol from '../assets/brand/jetha-symbol.png'
import symbolBlack from '../assets/brand/jetha-symbol-black.png'

// The compass is a pale gold that measures only 1.2-1.7:1 against the site's
// cream and white backgrounds, so on its own it almost disappears. Two hairline
// shadows in the brand brown give its strokes an edge; every fill colour of the
// artwork is unchanged. Pass edge={false} to show the raw artwork.
const EDGE = 'drop-shadow(0 0 0.4px rgb(79 50 45 / 0.7)) drop-shadow(0 0 0.4px rgb(79 50 45 / 0.7))'

/**
 * The JETHA compass-and-wing symbol, shared by the storefront and the
 * admin console so both always show the same asset.
 *
 * The file is the supplied jetha_header_symbol.png (512 x 400) cropped to
 * its visible artwork plus a 4 px margin (428 x 228): the original had
 * transparent space above and below, which made the emblem look small.
 * Set the size with a height class (e.g. h-11); the width follows.
 * Decorative by default: the link or heading around it carries the name.
 *
 * finish="black": the glossy black storefront mark. jetha-symbol-black.png
 * has exactly the original's alpha (same shape and edges), every colour
 * turned near-black with the artwork's own shading kept as faint charcoal
 * highlights; a fixed diagonal sheen is masked to the same shape
 * (.brand-gloss-sheen in index.css). Matches the .brand-gloss-text wordmark.
 */
export default function JethaSymbol({ className = '', alt = '', edge = true, finish = 'original' }) {
  if (finish === 'black') {
    return (
      <span className={`brand-gloss-symbol relative inline-block shrink-0 ${className}`} style={{ '--symbol-mask': `url(${symbolBlack})` }}>
        <img
          src={symbolBlack}
          width={428}
          height={228}
          alt={alt}
          decoding="async"
          draggable={false}
          className="block h-full w-auto max-w-none select-none"
        />
        <span className="brand-gloss-sheen" aria-hidden="true" />
      </span>
    )
  }
  return (
    <img
      src={symbol}
      width={428}
      height={228}
      alt={alt}
      decoding="async"
      draggable={false}
      style={edge ? { filter: EDGE } : undefined}
      className={`block w-auto max-w-none object-contain select-none ${className}`}
    />
  )
}
