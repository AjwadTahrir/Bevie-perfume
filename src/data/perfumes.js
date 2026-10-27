/**
 * THE BEAVIE COLLECTION
 * ---------------------------------------------------------------
 * The eight Beavie perfumes. Names, descriptions, notes and bottle
 * photos come from the BeavieWeb catalogue (scents.js). Prices and
 * sizes are PLACEHOLDERS (marked below) until the real ones are
 * confirmed; set price to null to show "to be announced" instead.
 *
 * FIELDS (one record = one card + its modal)
 *   id            unique, url-safe text, e.g. 'melur-noir'
 *   name          the perfume's name as it should appear on the site
 *   family        one key from `fragranceFamilies` below
 *   description   one or two short sentences for the card and modal
 *   price         number in ringgit, e.g. 189 (or null if unknown)
 *   size          e.g. '50 ml Eau de Parfum' (or null)
 *   notes         { top: [...], heart: [...], base: [...] } arrays of
 *                 strings, or null for any tier that is unknown
 *   image         product photo: put the file in src/assets/products/,
 *                 import it at the top of this file and assign it
 *                 here. Leave null to show the illustrated bottle.
 *   imageAlt      describe the photo for screen readers
 *   accent        backdrop tint behind the bottle on cards and in the
 *                 modal: 'teal' | 'rust' | 'ochre' | 'cream'
 *   bottle        illustration settings, used only while `image` is null
 *                 shape:  'arch' | 'flask' | 'column' | 'facet'
 *                 liquid: 'sage' | 'amber' | 'forest' | 'smoke'
 *                 cap:    'gold' | 'forest' | 'espresso'
 *   motif         small batik ornament on the card:
 *                 'bloom' | 'sprig' | 'seed' | 'tendril'
 *   motifPlacement 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
 *   scene         optional still life behind the bottle in the detail
 *                 pop-up: { src, srcSet, position, alt }. Supply it
 *                 portrait, about 1060 x 1484 or larger (5:7, the
 *                 pop-up's shape), ingredients in the lower right.
 *                 position is a CSS object-position for narrow crops
 *                 (phones). Without it the pop-up shows the batik bouquet.
 *   isPlaceholder  true only for stand-in records
 */

import verdiusImg from '../assets/products/verdius-bottle-640.webp'
import tonviraImg from '../assets/products/tonvira-bottle-640.webp'
import chestnutRushImg from '../assets/products/chestnut-rush-bottle-640.webp'
import wavekissImg from '../assets/products/wavekiss-bottle-640.webp'
import seductressImg from '../assets/products/seductress-bottle-640.webp'
import celestiaRoseImg from '../assets/products/celestia-rose-bottle-640.webp'
import berryTeaseImg from '../assets/products/berry-tease-bottle-640.webp'
import lilyValleyImg from '../assets/products/lily-valley-bottle-640.webp'
import verdiusScene640 from '../assets/products/verdius-scene-640.webp'
import verdiusScene1060 from '../assets/products/verdius-scene-1060.webp'
import tonviraScene640 from '../assets/products/tonvira-scene-640.webp'
import tonviraScene1060 from '../assets/products/tonvira-scene-1060.webp'
import chestnutRushScene640 from '../assets/products/chestnut-rush-scene-640.webp'
import chestnutRushScene1060 from '../assets/products/chestnut-rush-scene-1060.webp'
import wavekissScene640 from '../assets/products/wavekiss-scene-640.webp'
import wavekissScene1060 from '../assets/products/wavekiss-scene-1060.webp'
import seductressScene640 from '../assets/products/seductress-scene-640.webp'
import seductressScene1060 from '../assets/products/seductress-scene-1060.webp'
import celestiaRoseScene640 from '../assets/products/celestia-rose-scene-640.webp'
import celestiaRoseScene1060 from '../assets/products/celestia-rose-scene-1060.webp'
import berryTeaseScene640 from '../assets/products/berry-tease-scene-640.webp'
import berryTeaseScene1060 from '../assets/products/berry-tease-scene-1060.webp'
import lilyValleyScene640 from '../assets/products/lily-valley-scene-640.webp'
import lilyValleyScene1060 from '../assets/products/lily-valley-scene-1060.webp'
import chestnutRushLarge from '../assets/products/chestnut-rush-bottle-1200.webp'

export const fragranceFamilies = {
  floral: { label: 'Floral', blurb: 'Built around flowers, from soft petals to heady blooms.' },
  fruity: { label: 'Fruity', blurb: 'Juicy berries and dark fruit, sweet and indulgent.' },
  woody: { label: 'Woody', blurb: 'Dry, warm structures with the depth of timber.' },
  fresh: { label: 'Fresh', blurb: 'Bright and airy, leaning citrus, green or marine.' },
  amber: { label: 'Amber', blurb: 'Rounded and warm, with resinous softness.' },
}

/** Backdrop tints for each accent (see `accent` above). */
export const accentTints = {
  teal: 'var(--color-teal-soft)',
  rust: 'var(--color-rust-soft)',
  ochre: 'var(--color-ochre-soft)',
  cream: 'var(--color-cream-deep)',
}

export const tintOf = (perfume) => accentTints[perfume?.accent] ?? accentTints.cream

/**
 * HERO PRODUCT
 * The bottle photographed in the hero and carried through the scroll
 * sequence. Swap the imports above to feature another scent.
 */
export const heroProduct = {
  perfumeId: 'chestnut-rush',
  src: chestnutRushLarge,
  srcSet: `${chestnutRushImg} 640w, ${chestnutRushLarge} 1200w`,
  alt: 'Beavie Chestnut Rush perfume bottle with a cream label framed by batik-style borders',
}

export const perfumes = [
  {
    id: 'verdius',
    name: 'Verdius',
    family: 'fresh',
    description:
      'A revitalizing breath of cool clarity. Verdius captures freshly washed skin, chilled green apple, and morning air with effortless polish.',
    price: 149, // PLACEHOLDER price (MYR)
    size: '50 ml Eau de Parfum', // PLACEHOLDER
    notes: {
      top: ['Green Apple', 'Bergamot', 'Iced Aldehydes'],
      heart: ['Lavender', 'Aromatic Herbs', 'Rosemary'],
      base: ['Cedarwood', 'Vetiver', 'White Musk'],
    },
    image: verdiusImg,
    imageAlt: 'Verdius perfume bottle with a deep green botanical label',
    scene: {
      src: verdiusScene1060,
      srcSet: `${verdiusScene640} 640w, ${verdiusScene1060} 1060w`,
      position: '60% 82%',
      alt: 'Green apple, lavender, mint and lime on a misty stone, beside the bottle',
    },
    accent: 'teal',
    bottle: { shape: 'facet', liquid: 'forest', cap: 'gold' },
    motif: 'sprig',
    motifPlacement: 'top-right',
  },
  {
    id: 'tonvira',
    name: 'Tonvira',
    family: 'woody',
    description:
      'Precision, composure, command. Cool mint meets warm vanilla and timeless woods, crafted for ambition without compromise.',
    price: 169, // PLACEHOLDER price (MYR)
    size: '50 ml Eau de Parfum', // PLACEHOLDER
    notes: {
      top: ['Mint', 'Bergamot', 'Cardamom'],
      heart: ['Lavender', 'Sage', 'Green Tea'],
      base: ['Vanilla', 'Amberwood', 'Cedar'],
    },
    image: tonviraImg,
    imageAlt: 'Tonvira perfume bottle',
    scene: {
      src: tonviraScene1060,
      srcSet: `${tonviraScene640} 640w, ${tonviraScene1060} 1060w`,
      position: '60% 82%',
      alt: 'Mint, bergamot, cardamom, lavender, vanilla and amber on cedar wood, beside the bottle',
    },
    accent: 'cream',
    bottle: { shape: 'column', liquid: 'smoke', cap: 'espresso' },
    motif: 'seed',
    motifPlacement: 'bottom-left',
  },
  {
    id: 'chestnut-rush',
    name: 'Chestnut Rush',
    family: 'amber',
    description:
      'An evocative blend of warmth and sophistication: rum, spices, rich tobacco, smooth leather, vanilla, and amber.',
    price: 179, // PLACEHOLDER price (MYR)
    size: '50 ml Eau de Parfum', // PLACEHOLDER
    notes: {
      top: ['Rum', 'Chestnut', 'Saffron'],
      heart: ['Tobacco', 'Leather', 'Lavender'],
      base: ['Vanilla', 'Amber', 'Sandalwood'],
    },
    image: chestnutRushImg,
    imageAlt: 'Chestnut Rush perfume bottle',
    scene: {
      src: chestnutRushScene1060,
      srcSet: `${chestnutRushScene640} 640w, ${chestnutRushScene1060} 1060w`,
      position: '60% 82%',
      alt: 'Rum, chestnuts, saffron, tobacco leaf, leather, vanilla and amber beside the bottle',
    },
    accent: 'ochre',
    bottle: { shape: 'facet', liquid: 'amber', cap: 'espresso' },
    motif: 'seed',
    motifPlacement: 'top-left',
  },
  {
    id: 'wavekiss',
    name: 'Wavekiss',
    family: 'fresh',
    description:
      'A surge of marine freshness. Sunlit citrus meets crystalline sea salt and airy waves: pure, invigorating, and clear.',
    price: 149, // PLACEHOLDER price (MYR)
    size: '50 ml Eau de Parfum', // PLACEHOLDER
    notes: {
      top: ['Lemon', 'Bergamot', 'Sea Salt'],
      heart: ['Marine Notes', 'Neroli', 'Aquatic Accord'],
      base: ['Driftwood', 'White Musk', 'Soft Ambergris'],
    },
    image: wavekissImg,
    imageAlt: 'Wavekiss perfume bottle',
    scene: {
      src: wavekissScene1060,
      srcSet: `${wavekissScene640} 640w, ${wavekissScene1060} 1060w`,
      position: '60% 82%',
      alt: 'Lemons, sea salt in a shell, driftwood and neroli blossom on a wave-washed shore beside the bottle',
    },
    accent: 'teal',
    bottle: { shape: 'flask', liquid: 'forest', cap: 'gold' },
    motif: 'tendril',
    motifPlacement: 'bottom-right',
  },
  {
    id: 'seductress',
    name: 'Seductress',
    family: 'fruity',
    description: 'A bold, magnetic fragrance where juicy dark fruits meet luxurious florals and smoldering base notes.',
    price: 169, // PLACEHOLDER price (MYR)
    size: '50 ml Eau de Parfum', // PLACEHOLDER
    notes: {
      top: ['Raspberry', 'Black Cherry', 'Pink Pepper'],
      heart: ['Rose', 'Jasmine', 'Peony'],
      base: ['Vanilla', 'Patchouli', 'Amber'],
    },
    image: seductressImg,
    imageAlt: 'Seductress perfume bottle',
    scene: {
      src: seductressScene1060,
      srcSet: `${seductressScene640} 640w, ${seductressScene1060} 1060w`,
      position: '60% 82%',
      alt: 'Black cherries, raspberries, pink pepper, rose, peony, jasmine and vanilla beside the bottle',
    },
    accent: 'rust',
    bottle: { shape: 'arch', liquid: 'smoke', cap: 'espresso' },
    motif: 'bloom',
    motifPlacement: 'top-right',
  },
  {
    id: 'celestia-rose',
    name: 'Celestia Rose',
    family: 'floral',
    description:
      'Frozen petals and luminous freshness. Rose and lotus meet crystalline air in an icy floral haute couture composition.',
    price: 159, // PLACEHOLDER price (MYR)
    size: '50 ml Eau de Parfum', // PLACEHOLDER
    notes: {
      top: ['Frosted Lotus', 'Icy Accord', 'Pink Peony'],
      heart: ['Rose', 'Water Lily', 'Translucent Florals'],
      base: ['White Musk', 'Pale Woods', 'Clean Amber'],
    },
    image: celestiaRoseImg,
    imageAlt: 'Celestia Rose perfume bottle',
    scene: {
      src: celestiaRoseScene1060,
      srcSet: `${celestiaRoseScene640} 640w, ${celestiaRoseScene1060} 1060w`,
      position: '60% 82%',
      alt: 'Frosted pink rose, peony and lotus among ice crystals beside the bottle',
    },
    accent: 'cream',
    bottle: { shape: 'arch', liquid: 'sage', cap: 'gold' },
    motif: 'bloom',
    motifPlacement: 'bottom-left',
  },
  {
    id: 'berry-tease',
    name: 'Berry Tease',
    family: 'fruity',
    description:
      'A luscious celebration of whole frosted grapes and velvety sweetness with plush fruit and deep, indulgent warmth.',
    price: 159, // PLACEHOLDER price (MYR)
    size: '50 ml Eau de Parfum', // PLACEHOLDER
    notes: {
      top: ['Grape', 'Plum', 'Red Berries'],
      heart: ['Violet', 'Heliotrope', 'Fruit Nectar'],
      base: ['Vanilla', 'Patchouli', 'Amber'],
    },
    image: berryTeaseImg,
    imageAlt: 'Berry Tease perfume bottle',
    scene: {
      src: berryTeaseScene1060,
      srcSet: `${berryTeaseScene640} 640w, ${berryTeaseScene1060} 1060w`,
      position: '60% 82%',
      alt: 'Grapes, plums, red berries, violets, vanilla and amber beside the bottle',
    },
    accent: 'rust',
    bottle: { shape: 'flask', liquid: 'amber', cap: 'forest' },
    motif: 'tendril',
    motifPlacement: 'top-left',
  },
  {
    id: 'lily-valley',
    name: 'Lily in the Valley',
    family: 'floral',
    description:
      'A soft radiance of white florals and creamy vanilla blooming like morning light through a veil of pure serenity.',
    price: 159, // PLACEHOLDER price (MYR)
    size: '50 ml Eau de Parfum', // PLACEHOLDER
    notes: {
      top: ['Vanilla Orchid', 'Neroli', 'Soft Pear'],
      heart: ['Lily of the Valley', 'Jasmine Petals', 'White Floral Accord'],
      base: ['Vanilla', 'White Musk', 'Sandalwood'],
    },
    image: lilyValleyImg,
    imageAlt: 'Lily in the Valley perfume bottle',
    scene: {
      src: lilyValleyScene1060,
      srcSet: `${lilyValleyScene640} 640w, ${lilyValleyScene1060} 1060w`,
      position: '60% 82%',
      alt: 'Lily of the valley, vanilla orchid, jasmine and pear on sandalwood beside the bottle',
    },
    accent: 'cream',
    bottle: { shape: 'column', liquid: 'sage', cap: 'forest' },
    motif: 'sprig',
    motifPlacement: 'bottom-right',
  },
]

/** Families that at least one perfume actually uses (drives the finder). */
export const usedFamilies = Object.keys(fragranceFamilies).filter((key) =>
  perfumes.some((p) => p.family === key),
)

export const hasPlaceholderProducts = perfumes.some((p) => p.isPlaceholder)
