/**
 * BEAVIE BRAND CONFIGURATION
 * ---------------------------------------------------------------
 * The single place to edit contact details and site-wide switches.
 * Colours, fonts and the type scale live in src/styles/index.css
 * (the @theme block) so Tailwind and the SVG artwork share them.
 */

export const brand = {
  name: 'Beavie Perfume',

  // Temporary typographic wordmark. Replace with the real logo when available.
  wordmark: 'BEAVIE',

  /**
   * WHATSAPP BUSINESS NUMBER
   * International format, digits only: country code + number,
   * no "+", no spaces, no leading zero after the country code.
   *   Malaysian example: '60123456789'
   *
   * While this is empty (or invalid), every WhatsApp button renders
   * as a disabled control and never links to an invalid wa.me URL.
   */
  whatsappNumber: '',

  /**
   * OFFICIAL CONTACT CHANNELS
   * Leave a value empty until it is confirmed. Empty channels are
   * shown as "to be announced" text, never as a clickable link.
   */
  contact: {
    instagram: '', // full URL, e.g. 'https://www.instagram.com/<handle>/'
    email: '', // e.g. 'hello@<domain>'
  },

  // Display handle shown next to Instagram once the URL is set, e.g. '@beavie'.
  instagramHandle: '',

  /**
   * Development notices that flag sample data on the page
   * ("Placeholder catalogue", "Demonstration families").
   * Set to false once the real product data has been entered.
   */
  showPlaceholderNotices: false,

  currency: 'MYR',
  locale: 'en-MY',
}

/**
 * SHOP AND CHECKOUT
 * ---------------------------------------------------------------
 * Customers pay by scanning a QR code (src/config/payment.js) and
 * upload a screenshot of the payment. Orders, prices, committee codes
 * and receipts are handled by the Supabase backend (src/lib/orders.js,
 * supabase/README.md); the values here only drive what the site shows,
 * and must match the backend.
 */
export const shop = {
  // RM off each bottle with an active committee (referral) code.
  // Matches the backend rule: discount_sen = 500 x total quantity.
  committeeDiscountPerBottle: 5,

  // The committee distributes orders: no delivery fee, no address needed.
  distributionNote: 'Free · arranged by the committee',

  // Proof of payment: images only, as the receipts bucket accepts.
  proof: {
    maxSizeMB: 5,
    accept: 'image/jpeg,image/png,image/webp',
  },

  maxQuantityPerItem: 10,
}

/** Section anchors used by the navigation and in-page links. */
export const sections = {
  story: 'our-story',
  collection: 'collection',
  finder: 'find-your-scent',
  contact: 'contact',
}
