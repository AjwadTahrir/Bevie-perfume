/**
 * THE BEAVIE COLLECTION
 * ---------------------------------------------------------------
 * PLACEHOLDER DATA. The real eight perfumes have not been supplied
 * yet. Every record below is a stand-in, marked with
 * `isPlaceholder: true`. Names, families and descriptions are sample
 * values for layout only. Prices, sizes and notes are deliberately
 * null and show as "to be announced" on the site.
 *
 * HOW TO REPLACE A PERFUME (one record = one card + its modal)
 *   id            unique, url-safe text, e.g. 'melur-noir'
 *   name          the perfume's name as it should appear on the site
 *   family        one key from `fragranceFamilies` below
 *   description   one or two short sentences for the card and modal
 *   price         number in ringgit, e.g. 189 (or null if unknown)
 *   size          e.g. '50 ml Eau de Parfum' (or null)
 *   notes         { top: [...], heart: [...], base: [...] } arrays of
 *                 strings, or null for any tier that is unknown
 *   image         optional product photo: put the file in
 *                 src/assets/products/, import it at the top of this
 *                 file and assign it here. Leave null to keep the
 *                 illustrated bottle.
 *   imageAlt      describe the photo for screen readers
 *   bottle        illustration settings used while `image` is null
 *                 shape:  'arch' | 'flask' | 'column' | 'facet'
 *                 liquid: 'sage' | 'amber' | 'forest' | 'smoke'
 *                 cap:    'gold' | 'forest' | 'espresso'
 *   motif         small batik ornament on the card:
 *                 'bloom' | 'sprig' | 'seed' | 'tendril'
 *   motifPlacement 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
 *   isPlaceholder  set to false (or delete) once the record is real
 */

export const fragranceFamilies = {
  floral: { label: 'Floral', blurb: 'Built around flowers, from soft petals to heady blooms.' },
  woody: { label: 'Woody', blurb: 'Dry, warm structures with the depth of timber.' },
  fresh: { label: 'Fresh', blurb: 'Bright and airy, leaning citrus or green.' },
  amber: { label: 'Amber', blurb: 'Rounded and warm, with resinous softness.' },
}

const pendingNotes = { top: null, heart: null, base: null }

export const perfumes = [
  {
    id: 'scent-i',
    name: 'Scent I',
    family: 'floral', // SAMPLE family
    description: 'Paired with the open-bloom motif. The story of this scent will be added once its details are confirmed.',
    price: null, // TODO: real price (MYR)
    size: null, // TODO
    notes: pendingNotes, // TODO
    image: null,
    imageAlt: '',
    bottle: { shape: 'arch', liquid: 'sage', cap: 'gold' },
    motif: 'bloom',
    motifPlacement: 'top-right',
    isPlaceholder: true,
  },
  {
    id: 'scent-ii',
    name: 'Scent II',
    family: 'woody',
    description: 'Paired with the leaf-sprig motif. A description will follow when the final formula is shared.',
    price: null,
    size: null,
    notes: pendingNotes,
    image: null,
    imageAlt: '',
    bottle: { shape: 'column', liquid: 'smoke', cap: 'espresso' },
    motif: 'sprig',
    motifPlacement: 'bottom-left',
    isPlaceholder: true,
  },
  {
    id: 'scent-iii',
    name: 'Scent III',
    family: 'fresh',
    description: 'Paired with the tendril motif. Scent details are still to be confirmed.',
    price: null,
    size: null,
    notes: pendingNotes,
    image: null,
    imageAlt: '',
    bottle: { shape: 'flask', liquid: 'sage', cap: 'forest' },
    motif: 'tendril',
    motifPlacement: 'top-left',
    isPlaceholder: true,
  },
  {
    id: 'scent-iv',
    name: 'Scent IV',
    family: 'amber',
    description: 'Paired with the seed-cluster motif. The full description arrives with the product launch.',
    price: null,
    size: null,
    notes: pendingNotes,
    image: null,
    imageAlt: '',
    bottle: { shape: 'facet', liquid: 'amber', cap: 'gold' },
    motif: 'seed',
    motifPlacement: 'bottom-right',
    isPlaceholder: true,
  },
  {
    id: 'scent-v',
    name: 'Scent V',
    family: 'floral',
    description: 'Paired with the leaf-sprig motif. The story of this scent will be added once its details are confirmed.',
    price: null,
    size: null,
    notes: pendingNotes,
    image: null,
    imageAlt: '',
    bottle: { shape: 'flask', liquid: 'amber', cap: 'espresso' },
    motif: 'sprig',
    motifPlacement: 'top-right',
    isPlaceholder: true,
  },
  {
    id: 'scent-vi',
    name: 'Scent VI',
    family: 'fresh',
    description: 'Paired with the open-bloom motif. A description will follow when the final formula is shared.',
    price: null,
    size: null,
    notes: pendingNotes,
    image: null,
    imageAlt: '',
    bottle: { shape: 'arch', liquid: 'forest', cap: 'gold' },
    motif: 'bloom',
    motifPlacement: 'bottom-left',
    isPlaceholder: true,
  },
  {
    id: 'scent-vii',
    name: 'Scent VII',
    family: 'woody',
    description: 'Paired with the seed-cluster motif. Scent details are still to be confirmed.',
    price: null,
    size: null,
    notes: pendingNotes,
    image: null,
    imageAlt: '',
    bottle: { shape: 'facet', liquid: 'forest', cap: 'espresso' },
    motif: 'seed',
    motifPlacement: 'top-left',
    isPlaceholder: true,
  },
  {
    id: 'scent-viii',
    name: 'Scent VIII',
    family: 'amber',
    description: 'Paired with the tendril motif. The full description arrives with the product launch.',
    price: null,
    size: null,
    notes: pendingNotes,
    image: null,
    imageAlt: '',
    bottle: { shape: 'column', liquid: 'amber', cap: 'forest' },
    motif: 'tendril',
    motifPlacement: 'bottom-right',
    isPlaceholder: true,
  },
]

/** Families that at least one perfume actually uses (drives the finder). */
export const usedFamilies = Object.keys(fragranceFamilies).filter((key) =>
  perfumes.some((p) => p.family === key),
)

export const hasPlaceholderProducts = perfumes.some((p) => p.isPlaceholder)
