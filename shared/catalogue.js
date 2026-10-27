/**
 * The perfume ids and names the server accepts on an order. The
 * storefront's full records live in src/data/perfumes.js; a test
 * keeps the two lists in step.
 */
export const catalogue = [
  { id: 'verdius', name: 'Verdius' },
  { id: 'tonvira', name: 'Tonvira' },
  { id: 'chestnut-rush', name: 'Chestnut Rush' },
  { id: 'wavekiss', name: 'Wavekiss' },
  { id: 'seductress', name: 'Seductress' },
  { id: 'celestia-rose', name: 'Celestia Rose' },
  { id: 'berry-tease', name: 'Berry Tease' },
  { id: 'lily-valley', name: 'Lily in the Valley' },
]

export const catalogueById = new Map(catalogue.map((p) => [p.id, p]))
