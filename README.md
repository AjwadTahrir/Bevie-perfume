# Beavie Perfume

Single-page catalogue for Beavie Perfume: contemporary perfumery inspired by Malaysian batik.
React 19 + Vite + Tailwind CSS v4, Lucide icons, self-hosted fonts. No backend, cart or payments.

```bash
npm install      # install dependencies
npm run dev      # local development (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Where things live

| What | File |
| --- | --- |
| WhatsApp number, Instagram, email, placeholder notices | `src/config/brand.js` |
| All marketing copy (proposed, not verified) | `src/config/content.js` |
| The eight perfumes and fragrance families | `src/data/perfumes.js` |
| Colours, fonts, type scale, motion tokens | `src/styles/index.css` (`@theme`) |
| WhatsApp link builder | `src/lib/whatsapp.js` |
| Batik artwork (original SVG, generated from shared geometry) | `src/assets/batik/` |
| Placeholder bottle illustration | `src/assets/products/BottleIllustration.jsx` |
| Page sections | `src/components/` |

## Configure WhatsApp

In `src/config/brand.js` set `whatsappNumber` to the business number in international format,
digits only, with no `+` and no spaces (Malaysia example: `'60123456789'`).
While it is empty or invalid, every WhatsApp button is disabled and links nowhere.
Product messages read: *"Hi Beavie! I'm interested in [Perfume Name]. Could you share the ordering details?"*

## Replace the eight perfumes

Edit the records in `src/data/perfumes.js` (each field is documented at the top of the file):

1. Set `name`, `family` (one of the keys in `fragranceFamilies`, add a family there if needed) and `description`.
2. Set `price` as a number in ringgit (e.g. `189`), `size` (e.g. `'50 ml Eau de Parfum'`) and `notes`
   (`{ top: ['...'], heart: ['...'], base: ['...'] }`).
3. For a photo: put the file in `src/assets/products/`, import it at the top of `perfumes.js`
   (`import melurImg from '../assets/products/melur.webp'`), then set `image: melurImg` and a descriptive `imageAlt`.
   Transparent or light-background images around 900 x 1200 px (WebP) suit the arched frames.
4. Remove `isPlaceholder: true`. When all are real, set `showPlaceholderNotices: false` in `brand.js`.

The cards, the fragrance finder and the detail modal all update automatically.
The finder only offers families that at least one perfume uses.

## Still placeholder

- Wordmark `BEAVIE` (typographic stand-in for the logo)
- Hero product image (`src/components/Hero.jsx`, marked `TODO`)
- All eight perfume records: names, families, descriptions, prices, sizes, notes, photos
- WhatsApp number, Instagram URL/handle, email
- Marketing copy in `src/config/content.js` (proposed, needs brand approval)

## Notes

- Fonts: Cormorant Garamond and Outfit, both SIL Open Font License, bundled via Fontsource (no Google Fonts requests).
- Illustrations are original artwork inspired by batik florals. They do not reproduce any specific traditional motif.
- Motion respects `prefers-reduced-motion`. The page is light-theme only by design (ivory is the brand background).
