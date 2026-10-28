/**
 * THE JETHA COLLECTION
 * ---------------------------------------------------------------
 * The eight JETHA perfumes, four For Him and four For Her. IDs and names match the Supabase catalogue
 * (Bayu, Nirmala, ...). Descriptions, notes and bottle photos come from
 * the BeavieWeb catalogue (scents.js); the photo files keep their
 * original names. Prices are RM 35 per bottle, matching the Supabase
 * catalogue, which is the authoritative price at checkout. Every bottle
 * is 30 ml.
 *
 * FIELDS (one record = one card + its modal)
 *   id            unique, url-safe text; must equal the product id in Supabase
 *   name          the perfume's name as it should appear on the site
 *   category      'him' | 'her': which collection it belongs to
 *                 (see `categories` below)
 *   family        one key from `fragranceFamilies` below
 *   description   one or two short sentences for the card and modal
 *   price         number in ringgit, e.g. 189 (or null if unknown)
 *   size          e.g. '50 ml Eau de Parfum' (or null)
 *   notes         { top: [...], heart: [...], base: [...] } arrays of
 *                 strings. Kept as reference data for the descriptions;
 *                 no longer shown as a pyramid on the site.
 *   story         DRAFT, please confirm: one or two sentences on the
 *                 scent, its mood and why the name suits it. Written
 *                 only from the notes above. Shown in the pop-up.
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
 *   render        studio render of the actual JETHA bottle (Blender model,
 *                 real label, black cap), transparent WebP, 4:5:
 *                 { src, srcSet }. See `renders` below for which Blender
 *                 file each one comes from. Shown instead of `image`
 *                 wherever it is set.
 *   tone          [base, deep] backdrop tints for the card and detail
 *                 panel, picked to sit quietly beside the label's own
 *                 colours. `deep` is the hover/selected shade. Purely
 *                 visual: says nothing about the scent.
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
import bayuRender480 from '../assets/products/renders/bayu-480.webp'
import bayuRender960 from '../assets/products/renders/bayu-960.webp'
import nirmalaRender480 from '../assets/products/renders/nirmala-480.webp'
import nirmalaRender960 from '../assets/products/renders/nirmala-960.webp'
import senjaRender480 from '../assets/products/renders/senja-480.webp'
import senjaRender960 from '../assets/products/renders/senja-960.webp'
import samuderaRender480 from '../assets/products/renders/samudera-480.webp'
import samuderaRender960 from '../assets/products/renders/samudera-960.webp'
import purnamaRender480 from '../assets/products/renders/purnama-480.webp'
import purnamaRender960 from '../assets/products/renders/purnama-960.webp'
import ranumRender480 from '../assets/products/renders/ranum-480.webp'
import ranumRender960 from '../assets/products/renders/ranum-960.webp'
import ratnaRender480 from '../assets/products/renders/ratna-480.webp'
import ratnaRender960 from '../assets/products/renders/ratna-960.webp'
import serojaRender480 from '../assets/products/renders/seroja-480.webp'
import serojaRender960 from '../assets/products/renders/seroja-960.webp'

/**
 * BOTTLE RENDERS
 * Product id -> render of the actual Blender bottle. Rendered in Cycles from
 * a working copy of each file in ~/Downloads/JETHA-3D (the .blend1 originals
 * are never opened for writing), same camera, lights and crop for all eight:
 *
 *   bayu      bayu.blend1      label art: verdius.png
 *   nirmala   nirmala.blend1   label art: tonvira.png
 *   senja     senja.blend1     label art: chestnut rushh.png
 *   samudera  wavekiss.blend   label art: wavekiss.png (no samudera.blend1 exists)
 *   purnama   purnama.blend1   label art: seductress.png
 *   ranum     ranum.blend1     label art: berry tease.png
 *   ratna     ratna.blend1     label art: celestia rose.png
 *   seroja    seroja.blend1    label art: lily in the valley.png
 */
const render = (s480, s960) => ({ src: s480, srcSet: `${s480} 480w, ${s960} 960w` })
const renders = {
  bayu: render(bayuRender480, bayuRender960),
  nirmala: render(nirmalaRender480, nirmalaRender960),
  senja: render(senjaRender480, senjaRender960),
  samudera: render(samuderaRender480, samuderaRender960),
  purnama: render(purnamaRender480, purnamaRender960),
  ranum: render(ranumRender480, ranumRender960),
  ratna: render(ratnaRender480, ratnaRender960),
  seroja: render(serojaRender480, serojaRender960),
}

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

/** [base, deep] backdrop for a perfume: its own `tone`, else its accent tint for both. */
export const toneOf = (perfume) => perfume?.tone ?? [tintOf(perfume), tintOf(perfume)]

/**
 * HERO PRODUCT
 * The bottle rendered in the hero. Point it at another entry of
 * `renders` to feature a different scent.
 */
export const heroProduct = {
  perfumeId: 'senja',
  src: renders.senja.src,
  srcSet: renders.senja.srcSet,
  alt: 'JETHA Senja perfume bottle with a black cap and a maroon and cream batik label',
}

export const perfumes = [
  {
    id: 'bayu',
    category: 'him',
    name: 'Bayu',
    family: 'fresh',
    description:
      'A revitalizing breath of cool clarity. Bayu captures freshly washed skin, chilled green apple, and morning air with effortless polish.',
    tagline: 'Post-Shower Crispness',
    story:
      'Named after the breeze, Bayu feels like cool air after a shower: crisp green apple and bergamot, aromatic lavender and rosemary, then clean cedarwood and musk. Light, fresh and easy to wear every day.',
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
    price: 35, // MYR; authoritative checkout price comes from Supabase
    size: '30 ml',
    notes: {
      top: ['Green Apple', 'Bergamot', 'Iced Aldehydes'],
      heart: ['Lavender', 'Aromatic Herbs', 'Rosemary'],
      base: ['Cedarwood', 'Vetiver', 'White Musk'],
    },
    image: verdiusImg,
    render: renders.bayu,
    tone: ['#ece5d9', '#e0d3bd'],
    imageAlt: 'Bayu perfume bottle with a black cap and a brown and gold batik label',
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
    id: 'nirmala',
    category: 'him',
    name: 'Nirmala',
    family: 'woody',
    description:
      'Precision, composure, command. Cool mint meets warm vanilla and timeless woods, crafted for ambition without compromise.',
    tagline: 'The Peak / CEO',
    story:
      'Nirmala means pure and clear, and it wears that way: cool mint and bergamot with sage and green tea, grounded by smooth vanilla, amberwood and cedar. Calm, polished and quietly confident.',
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
    price: 35,
    size: '30 ml',
    notes: {
      top: ['Mint', 'Bergamot', 'Cardamom'],
      heart: ['Lavender', 'Sage', 'Green Tea'],
      base: ['Vanilla', 'Amberwood', 'Cedar'],
    },
    image: tonviraImg,
    render: renders.nirmala,
    tone: ['#eceae4', '#dcdee0'],
    imageAlt: 'Nirmala perfume bottle with a black cap and a navy and silver batik label',
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
    id: 'senja',
    category: 'him',
    name: 'Senja',
    family: 'amber',
    description:
      'An evocative blend of warmth and sophistication: rum, spices, rich tobacco, smooth leather, vanilla, and amber.',
    tagline: 'The Gentleman’s Lounge',
    story:
      'Senja is dusk in a bottle. Warm rum, chestnut and saffron deepen into tobacco and leather before settling on vanilla, amber and sandalwood, as rich and relaxed as the last light of the day.',
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
    price: 35,
    size: '30 ml',
    notes: {
      top: ['Rum', 'Chestnut', 'Saffron'],
      heart: ['Tobacco', 'Leather', 'Lavender'],
      base: ['Vanilla', 'Amber', 'Sandalwood'],
    },
    image: chestnutRushImg,
    render: renders.senja,
    tone: ['#f0e0d2', '#e7c9b4'],
    imageAlt: 'Senja perfume bottle with a black cap and a maroon and cream batik label',
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
    id: 'samudera',
    category: 'him',
    name: 'Samudera',
    family: 'fresh',
    description:
      'A surge of marine freshness. Sunlit citrus meets crystalline sea salt and airy waves: pure, invigorating, and clear.',
    tagline: 'Aegean Zenith',
    story:
      'Inspired by the open ocean, Samudera pairs bright lemon and sea salt with marine notes and neroli over driftwood and soft ambergris. Fresh, airy and wide open, like standing at the water\'s edge.',
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
    price: 35,
    size: '30 ml',
    notes: {
      top: ['Lemon', 'Bergamot', 'Sea Salt'],
      heart: ['Marine Notes', 'Neroli', 'Aquatic Accord'],
      base: ['Driftwood', 'White Musk', 'Soft Ambergris'],
    },
    image: wavekissImg,
    render: renders.samudera,
    tone: ['#e8e2e6', '#d9ccd6'],
    imageAlt: 'Samudera perfume bottle with a black cap and a plum and cream batik label',
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
    id: 'purnama',
    category: 'her',
    name: 'Purnama',
    family: 'fruity',
    description: 'A bold, magnetic fragrance where juicy dark fruits meet luxurious florals and smoldering base notes.',
    tagline: 'Midnight Raspberry CEO',
    story:
      'Purnama is the full moon on a dark night: juicy raspberry and black cherry glow over rose, jasmine and peony, held by warm vanilla, patchouli and amber. Bold, luminous and magnetic.',
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
    price: 35,
    size: '30 ml',
    notes: {
      top: ['Raspberry', 'Black Cherry', 'Pink Pepper'],
      heart: ['Rose', 'Jasmine', 'Peony'],
      base: ['Vanilla', 'Patchouli', 'Amber'],
    },
    image: seductressImg,
    render: renders.purnama,
    tone: ['#ebe5de', '#ddd2c4'],
    imageAlt: 'Purnama perfume bottle with a black cap and a brown and cream paisley label',
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
    id: 'ranum',
    category: 'her',
    name: 'Ranum',
    family: 'fruity',
    description:
      'A luscious celebration of whole frosted grapes and velvety sweetness with plush fruit and deep, indulgent warmth.',
    tagline: 'Vineyard Opulence / Grape',
    story:
      'Ranum describes fruit at its ripest, and this scent is exactly that: grape, plum and red berries with soft violet and heliotrope, warmed by vanilla and amber. Lush, sweet and full of life.',
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
    price: 35,
    size: '30 ml',
    notes: {
      top: ['Grape', 'Plum', 'Red Berries'],
      heart: ['Violet', 'Heliotrope', 'Fruit Nectar'],
      base: ['Vanilla', 'Patchouli', 'Amber'],
    },
    image: berryTeaseImg,
    render: renders.ranum,
    tone: ['#e4e6ec', '#d2d8e6'],
    imageAlt: 'Ranum perfume bottle with a black cap and a blue paisley label',
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
    id: 'ratna',
    category: 'her',
    name: 'Ratna',
    family: 'floral',
    description:
      'Frozen petals and luminous freshness. Rose and lotus meet crystalline air in an icy floral haute couture composition.',
    tagline: 'Glacial Floral / Lotus / Ice',
    story:
      'Like a jewel catching the light, Ratna is clear and precious: frosted lotus and pink peony with rose and water lily, set on white musk and pale woods. Cool, radiant and elegant.',
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
    price: 35,
    size: '30 ml',
    notes: {
      top: ['Frosted Lotus', 'Icy Accord', 'Pink Peony'],
      heart: ['Rose', 'Water Lily', 'Translucent Florals'],
      base: ['White Musk', 'Pale Woods', 'Clean Amber'],
    },
    image: celestiaRoseImg,
    render: renders.ratna,
    tone: ['#efe1db', '#e4cac0'],
    imageAlt: 'Ratna perfume bottle with a black cap and a deep red floral batik label',
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
    id: 'seroja',
    category: 'her',
    name: 'Seroja',
    family: 'floral',
    description:
      'A soft radiance of white florals and creamy vanilla blooming like morning light through a veil of pure serenity.',
    tagline: 'Ethereal Vanilla / White Floral',
    story:
      'Seroja is the lotus, a flower of grace and calm. That grace comes through in soft white florals, vanilla orchid, neroli and lily of the valley, resting on creamy vanilla and sandalwood. Serene and gentle.',
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
    price: 35,
    size: '30 ml',
    notes: {
      top: ['Vanilla Orchid', 'Neroli', 'Soft Pear'],
      heart: ['Lily of the Valley', 'Jasmine Petals', 'White Floral Accord'],
      base: ['Vanilla', 'White Musk', 'Sandalwood'],
    },
    image: lilyValleyImg,
    render: renders.seroja,
    tone: ['#e5e7df', '#d3dacb'],
    imageAlt: 'Seroja perfume bottle with a black cap and a navy label with red and pink flowers',
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

/** The two collections, in display order. */
export const categories = [
  { key: 'him', label: 'For Him', anchor: 'for-him', intro: 'Fresh, woody and warm: breeze, clarity, dusk and ocean.' },
  { key: 'her', label: 'For Her', anchor: 'for-her', intro: 'Fruity, floral and luminous: moonlight, ripeness, jewels and lotus.' },
]

/** Families that at least one perfume actually uses (drives the finder). */
export const usedFamilies = Object.keys(fragranceFamilies).filter((key) =>
  perfumes.some((p) => p.family === key),
)

export const hasPlaceholderProducts = perfumes.some((p) => p.isPlaceholder)
