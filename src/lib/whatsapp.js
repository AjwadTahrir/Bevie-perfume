import { brand } from '../config/brand'

/** Prefilled message used when a visitor orders a specific perfume. */
export function orderMessage(productName) {
  return `Hi Beavie! I'm interested in ${productName}. Could you share the ordering details?`
}

/** Prefilled message for general enquiries from the contact section. */
export const enquiryMessage = "Hi Beavie! I'd like to know more about your perfumes."

/**
 * Returns a wa.me-ready number (digits only) or null when the value
 * is missing or does not look like an international phone number.
 * Accepts common formatting such as "+60 12-345 6789".
 */
export function normalizeWhatsAppNumber(raw) {
  if (!raw) return null
  const digits = String(raw).replace(/[\s\-().+]/g, '')
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null
}

/**
 * Builds a WhatsApp click-to-chat URL with a prefilled message.
 * Returns null when no valid number is configured, so callers can
 * render a disabled control instead of a broken link.
 */
export function buildWhatsAppUrl(message, number = brand.whatsappNumber) {
  const n = normalizeWhatsAppNumber(number)
  if (!n) return null
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`
}

/** Convenience wrapper: order URL for a product name. */
export function buildOrderUrl(productName, number = brand.whatsappNumber) {
  return buildWhatsAppUrl(orderMessage(productName), number)
}
