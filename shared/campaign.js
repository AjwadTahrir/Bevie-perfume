/**
 * CAMPAIGN RULES SHARED BY THE SERVER, THE STOREFRONT AND THE DASHBOARD
 * ---------------------------------------------------------------
 * The live values (prices, profit, targets) are stored in the
 * campaign_settings table and edited from the admin Settings page.
 * DEFAULT_CAMPAIGN only covers the moment before they have loaded,
 * and the database computes every amount that is actually charged.
 */
export const DEFAULT_CAMPAIGN = {
  campaignName: 'Bevie Perfume Outbound Fundraiser',
  sellingPrice: 35,
  discountedPrice: 30,
  profitPerBottle: 10,
  campaignTarget: 180,
  memberTarget: 5,
  startsOn: null,
  endsOn: null,
}

/** Maps a campaign_settings row to the camelCase shape above. */
export function campaignFromRow(row) {
  if (!row) return DEFAULT_CAMPAIGN
  return {
    campaignName: row.campaign_name,
    sellingPrice: Number(row.selling_price),
    discountedPrice: Number(row.discounted_price),
    profitPerBottle: Number(row.profit_per_bottle),
    campaignTarget: Number(row.campaign_target),
    memberTarget: Number(row.member_target),
    startsOn: row.starts_on ?? null,
    endsOn: row.ends_on ?? null,
  }
}

/**
 * Price preview for a number of bottles. Mirrors public.create_order:
 * a valid promo code takes every bottle from the selling price to the
 * discounted price; nothing else stacks on top.
 */
export function priceOrder(quantity, hasPromo, campaign = DEFAULT_CAMPAIGN) {
  const qty = Math.max(0, Math.floor(quantity) || 0)
  const discountPerBottle = hasPromo ? campaign.sellingPrice - campaign.discountedPrice : 0
  const originalSubtotal = qty * campaign.sellingPrice
  const discountTotal = qty * discountPerBottle
  return {
    quantity: qty,
    originalUnitPrice: campaign.sellingPrice,
    appliedUnitPrice: campaign.sellingPrice - discountPerBottle,
    discountPerBottle,
    originalSubtotal,
    discountTotal,
    finalAmount: originalSubtotal - discountTotal,
  }
}

/** Uppercases and strips spaces, so "dmt 9t" matches "DMT9T" (same as normalize_promo_code in SQL). */
export const normalizePromoCode = (raw) => String(raw ?? '').replace(/\s+/g, '').toUpperCase()

export const PROMO_CODE_PATTERN = /^[A-Z0-9]{5}$/

/** Member target status, as admin_member_performance defines it. */
export function memberStatus(verifiedBottles, target) {
  if (verifiedBottles <= 0) return 'not_started'
  return verifiedBottles < target ? 'in_progress' : 'target_reached'
}

/** Proof of payment limits. 4 MB keeps uploads under Vercel's 4.5 MB request limit. */
export const PROOF_MAX_BYTES = 4 * 1024 * 1024
export const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
