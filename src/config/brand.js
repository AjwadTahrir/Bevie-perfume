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
  showPlaceholderNotices: true,

  currency: 'MYR',
  locale: 'en-MY',
}

/** Section anchors used by the navigation and in-page links. */
export const sections = {
  story: 'our-story',
  collection: 'collection',
  finder: 'find-your-scent',
  philosophy: 'philosophy',
  contact: 'contact',
}
