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
 * SHOP AND CHECKOUT (PLACEHOLDERS)
 * ---------------------------------------------------------------
 * Customers pay by scanning a QR code with their banking app, then
 * upload a screenshot of the payment. Nothing here is a payment
 * gateway. Orders are not saved anywhere yet: src/lib/orders.js is
 * the single place to connect a database and file storage.
 */
export const shop = {
  payment: {
    // QR image to scan, e.g. a DuitNow QR exported from the business bank
    // account. Put the file in src/assets/ and import it here. While null,
    // checkout shows a clearly marked placeholder instead.
    qrImage: null,
    method: 'DuitNow QR',
    accountName: '', // e.g. 'BEAVIE PERFUME' (shown under the QR)
    bankName: '', // e.g. 'Maybank'
  },

  // Flat delivery fee in ringgit, or null to show "Calculated after checkout".
  shippingFee: null,

  // Referral codes come from src/data/referralCodes.js. A valid code is
  // recorded with the order; set a percentage here to also give a discount.
  referralDiscountPercent: 0,

  // Proof of payment upload limits.
  proof: {
    maxSizeMB: 5,
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
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
