/**
 * THE BEAVIE COLLECTION
 * ---------------------------------------------------------------
 * The eight Beavie perfumes. Names, descriptions, notes and bottle
 * photos come from the BeavieWeb catalogue (scents.js). Sizes are
 * PLACEHOLDERS (marked below) until the real ones are confirmed.
 * Every bottle sells at the campaign price, which is stored in the
 * database (campaign_settings) and read through src/lib/campaign.jsx.
 *
 * FIELDS (one record = one card + its modal)
 *   id            unique, url-safe text, e.g. 'melur-noir'
 *   name          the perfume's name as it should appear on the site
 *   family        one key from `fragranceFamilies` below
 *   description   one or two short sentences for the card and modal
 *   size          e.g. '50 ml Eau de Parfum' (or null)
 *   notes         { top: [...], heart: [...], base: [...] } arrays of
 *                 strings, or null for any tier that is unknown
 *   tagline       short personality line, e.g. 'Post-Shower Crispness'
 *   mood          one line describing the scent's atmosphere
 *   accords       [label, strength 0-100, colour] for the accord bars;
 *                 the pop-up shows the strongest six
 *   facts         { Family, Intensity, Longevity, Sillage, Season,
 *                 'Time of Day' } shown in the pop-up
 *   (tagline, mood, accords and facts come from the BeavieWeb site)
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
    tagline: 'Post-Shower Crispness',
    mood: 'Clean cold lighting, green apple glow, crushed ice, and slate mist.',
    accords: [
      ['Aromatic', 94, '#4fc9ad'],
      ['Fresh Spicy', 86, '#abd97d'],
      ['Woody', 70, '#96714c'],
      ['Green Apple', 66, '#7bc461'],
      ['Watery', 62, '#78bbec'],
      ['Ozonic', 58, '#8fc8ff'],
      ['Musky', 48, '#c7b7dd'],
      ['Mineral', 42, '#8ab8b5'],
      ['Citrus', 38, '#f0e36f'],
      ['Clean', 34, '#c7eef8'],
      ['Crisp', 30, '#a2d9cf'],
    ],
    facts: {
      Family: 'Aromatic Fresh',
      Intensity: 'Bright',
      Longevity: '6–8 Hours',
      Sillage: 'Clean Trail',
      Season: 'Spring / Summer',
      'Time of Day': 'Morning',
    },
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
    tagline: 'The Peak / CEO',
    mood: 'Midnight executive office, marble columns, frozen mint, and data-screen glow.',
    accords: [
      ['Vanilla', 96, '#f0dfbd'],
      ['Aromatic', 88, '#99ccd2'],
      ['Green', 72, '#5fc46b'],
      ['Mint', 66, '#63dcc9'],
      ['Woody', 58, '#8d5d35'],
      ['Fresh Spicy', 52, '#a4cf30'],
      ['Ambery', 48, '#d67c35'],
      ['Powdery', 44, '#ceb9c6'],
      ['Herbal', 38, '#8ea071'],
      ['Musky', 34, '#b8a8c7'],
      ['Earthy', 30, '#665849'],
      ['Citrus', 26, '#e6d86a'],
    ],
    facts: {
      Family: 'Aromatic Woody',
      Intensity: 'Controlled',
      Longevity: '8–10 Hours',
      Sillage: 'Confident',
      Season: 'All Season',
      'Time of Day': 'Work / Evening',
    },
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
    tagline: 'The Gentleman’s Lounge',
    mood: 'Dark mahogany library, leather books, amber rum glow, and cigar smoke.',
    accords: [
      ['Warm Spicy', 96, '#d94f2d'],
      ['Vanilla', 84, '#f1dfb7'],
      ['Aromatic', 76, '#92c9bd'],
      ['Rum', 68, '#bb652e'],
      ['Woody', 62, '#a56c43'],
      ['Tobacco', 56, '#9f784e'],
      ['Amber', 52, '#d87c36'],
      ['Leathery', 48, '#ba8a5e'],
      ['Smoky', 42, '#c4bbb5'],
      ['Sweet', 36, '#e26377'],
      ['Balsamic', 33, '#8a5a3a'],
      ['Chestnut', 30, '#c89262'],
      ['Soft Spice', 26, '#d99977'],
    ],
    facts: {
      Family: 'Warm Spicy',
      Intensity: 'Rich',
      Longevity: '9–11 Hours',
      Sillage: 'Elegant',
      Season: 'Fall / Winter',
      'Time of Day': 'Evening',
    },
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
    tagline: 'Aegean Zenith',
    mood: 'Ocean wave splash, sea salt crystals, lemon peels, and frozen droplets.',
    accords: [
      ['Citrus', 96, '#f1dc61'],
      ['Marine', 84, '#4fcaf0'],
      ['Fresh', 76, '#b7eff7'],
      ['Salty', 66, '#c8e0ea'],
      ['Watery', 54, '#67b8d8'],
      ['Aromatic', 48, '#66c1b1'],
      ['Ozonic', 42, '#8fc8ff'],
      ['Musky', 36, '#c5b8dc'],
      ['Lemon Zest', 32, '#f3d84e'],
      ['Mineral', 28, '#8dbabd'],
      ['Airy', 26, '#d6e8f2'],
      ['Clean', 22, '#e0edf2'],
    ],
    facts: {
      Family: 'Marine Citrus',
      Intensity: 'Sparkling',
      Longevity: '6–8 Hours',
      Sillage: 'Fresh',
      Season: 'Summer',
      'Time of Day': 'Daytime',
    },
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
    tagline: 'Midnight Raspberry CEO',
    mood: 'Black obsidian marble, silver veins, lace texture, raspberries, and black cherries.',
    accords: [
      ['Fruity', 94, '#ea474d'],
      ['Sweet', 78, '#df638c'],
      ['Floral', 64, '#e087c2'],
      ['Cherry', 58, '#c93657'],
      ['Vanilla', 50, '#eadcaf'],
      ['Juicy Berry', 44, '#be3d73'],
      ['Amber', 42, '#d77942'],
      ['Dark Gourmand', 38, '#a66f55'],
      ['Patchouli', 36, '#9ca765'],
      ['Musky', 32, '#cfbec9'],
      ['Powdery', 28, '#cabfb6'],
      ['Soft Woody', 24, '#a98468'],
    ],
    facts: {
      Family: 'Fruity Floral',
      Intensity: 'Intense',
      Longevity: '8–10 Hours',
      Sillage: 'Strong',
      Season: 'Fall / Winter',
      'Time of Day': 'Evening / Night',
    },
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
    tagline: 'Glacial Floral / Lotus / Ice',
    mood: 'Glacial ice wall, frozen pink peony, lotus petals, and trapped air bubbles.',
    accords: [
      ['Floral', 96, '#f0a0cf'],
      ['Fresh', 82, '#aee7f2'],
      ['Aquatic', 74, '#7bbcff'],
      ['Icy', 64, '#c8e6ff'],
      ['Rose', 56, '#d84b8a'],
      ['Lotus', 50, '#d7b2ef'],
      ['Watery', 44, '#7fbbe8'],
      ['Clean', 38, '#d7edf5'],
      ['Airy', 34, '#c8dff0'],
      ['White Floral', 32, '#efe2d2'],
      ['Mineral', 28, '#9bc9cb'],
      ['Musky', 26, '#cfc3dc'],
      ['Soft Green', 24, '#a8cfa4'],
    ],
    facts: {
      Family: 'Floral Aquatic',
      Intensity: 'Luminous',
      Longevity: '7–9 Hours',
      Sillage: 'Refined',
      Season: 'Winter / Spring',
      'Time of Day': 'Day / Evening',
    },
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
    tagline: 'Vineyard Opulence / Grape',
    mood: 'Rich violet velvet drapery, whole frosted grapes, and plush silver light.',
    accords: [
      ['Sweet', 96, '#d84b8a'],
      ['Vanilla', 76, '#eadfc8'],
      ['Fruity', 66, '#df4050'],
      ['Patchouli', 58, '#9caf72'],
      ['Grape', 54, '#9b6cb3'],
      ['Juicy Purple Fruit', 50, '#7d3f9e'],
      ['Amber', 46, '#db8c65'],
      ['Soft Spice', 42, '#d99977'],
      ['Gourmand', 38, '#d9a295'],
      ['Powdery', 34, '#d2c2c4'],
      ['Musky', 30, '#cec0ca'],
      ['Velvety', 28, '#d899a5'],
      ['Woody', 26, '#8f6a4a'],
    ],
    facts: {
      Family: 'Sweet Fruity',
      Intensity: 'Opulent',
      Longevity: '8–10 Hours',
      Sillage: 'Moderate',
      Season: 'Fall',
      'Time of Day': 'Evening',
    },
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
    tagline: 'Ethereal Vanilla / White Floral',
    mood: 'Vanilla-white architectural garden, lily petals, orchids, silver spheres, and mist.',
    accords: [
      ['White Floral', 96, '#d9d2c0'],
      ['Vanilla', 78, '#e2c98a'],
      ['Fresh', 68, '#8fcfc8'],
      ['Powdery', 64, '#c8b6b0'],
      ['Musky', 44, '#cbbac6'],
      ['Creamy', 42, '#dcc79a'],
      ['Airy', 38, '#b8cfdc'],
      ['Green', 34, '#9ac7a4'],
      ['Floral Dew', 30, '#ebb7cb'],
      ['Clean', 28, '#c9dde2'],
      ['Soft Woody', 26, '#c2a98c'],
      ['Luminous Amber', 24, '#d79c83'],
    ],
    facts: {
      Family: 'White Floral Vanilla',
      Intensity: 'Soft Radiance',
      Longevity: '7–9 Hours',
      Sillage: 'Graceful',
      Season: 'Spring',
      'Time of Day': 'Daytime',
    },
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
