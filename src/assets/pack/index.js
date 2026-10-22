/**
 * BEAVIE ASSET PACK
 * ---------------------------------------------------------------
 * Photography and painted illustrations from beavie-asset-pack.zip,
 * resized and re-encoded as WebP. Replace a file here (same name) or
 * point an import at a new file to change it everywhere it is used.
 *
 * One floral throughout: the bouquet. The pack's floral-sprig.png is
 * deliberately not used.
 *
 * Not used: hero-perfume-batik.jpg. It shows a generic bottle with a
 * blank label, not a Beavie product, so the hero composes the real
 * bottle over the wall and fabric photographs instead.
 */

import fabric1600 from './batik-fabric-1600.webp'
import fabric900 from './batik-fabric-900.webp'
import band2000 from './batik-band-2000.webp'
import band1000 from './batik-band-1000.webp'
import bouquet1200 from './floral-bouquet-1200.webp'
import bouquet640 from './floral-bouquet-640.webp'
import phoenix900 from './phoenix-900.webp'
import wall1300 from './warm-wall-1300.webp'

export const pack = {
  /** Draped rust and teal batik, photographed (1536 x 1024; "Rust and Teal Batik Fabric Folds"). */
  fabric: { src: fabric1600, srcSet: `${fabric900} 900w, ${fabric1600} 1536w` },
  /** Dark brown band with batik corners, plain centre for text (2000 x 1050). */
  band: { src: band2000, srcSet: `${band1000} 1000w, ${band2000} 2000w` },
  /** Painted batik bouquet, transparent (1200 x 800; "Vintage Ornamental Botanical Bouquet"). */
  bouquet: { src: bouquet1200, srcSet: `${bouquet640} 640w, ${bouquet1200} 1200w` },
  /** Painted batik phoenix, transparent (900 x 591). */
  phoenix: { src: phoenix900 },
  /** Cream wall with soft leaf shadows, cropped clear of its foliage (1300 x 1197). */
  wall: { src: wall1300 },
}
