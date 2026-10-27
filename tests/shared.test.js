import { describe, expect, it } from 'vitest'
import { DEFAULT_CAMPAIGN, memberStatus, normalizePromoCode, priceOrder } from '../shared/campaign'
import { catalogue } from '../shared/catalogue'
import { perfumes } from '../src/data/perfumes'

describe('shared pricing preview', () => {
  it.each([
    [1, true, 35, 5, 30],
    [1, false, 35, 0, 35],
    [3, true, 105, 15, 90],
    [3, false, 105, 0, 105],
  ])('%i bottle(s), promo %s', (qty, promo, subtotal, discount, final) => {
    expect(priceOrder(qty, promo)).toMatchObject({ originalSubtotal: subtotal, discountTotal: discount, finalAmount: final })
  })
  it('uses the configured campaign values', () => {
    expect(priceOrder(2, true, { ...DEFAULT_CAMPAIGN, sellingPrice: 40, discountedPrice: 32 }).finalAmount).toBe(64)
  })
  it('normalises codes and classifies member status', () => {
    expect(normalizePromoCode(' dmt 9t ')).toBe('DMT9T')
    expect([0, 1, 4, 5, 9].map((b) => memberStatus(b, 5))).toEqual(['not_started', 'in_progress', 'in_progress', 'target_reached', 'target_reached'])
  })
})

describe('catalogue', () => {
  it('matches the storefront perfumes', () => {
    expect(catalogue).toEqual(perfumes.map((p) => ({ id: p.id, name: p.name })))
  })
})
