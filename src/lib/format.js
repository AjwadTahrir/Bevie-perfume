import { brand } from '../config/brand'

const currency = new Intl.NumberFormat(brand.locale, {
  style: 'currency',
  currency: brand.currency,
  maximumFractionDigits: 0,
})

/** "RM 180" for a number, or a clear fallback while the price is unknown. */
export function formatPrice(price, fallback = 'Price to be announced') {
  if (typeof price !== 'number') return fallback
  // Intl renders "RM180"; add the conventional space.
  return currency.format(price).replace(/^RM\s?/, 'RM ')
}
