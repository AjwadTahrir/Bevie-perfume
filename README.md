# JETHA Perfume

Storefront and fundraising console for JETHA Perfume, sold to support **Titian Serantau: Thailand Mobility Programme**
(KK10, Universiti Malaya × Chulalongkorn University, Bangkok, 30 Nov – 5 Dec 2026).
React 19 + Vite + Tailwind CSS v4, Lucide icons, self-hosted fonts, Supabase backend.

```bash
npm install      # install dependencies
npm run dev      # local development (http://localhost:5173, /about, /admin)
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Pages

| URL | What | Entry |
| --- | --- | --- |
| `/` | The store: hero, Our Story, the collection (For Him / For Her), fragrance finder, contact | `src/App.jsx` |
| `/about` | The fundraising programme and why JETHA is sold | `src/components/AboutPage.jsx` |
| `/admin` | Fundraising console (Supabase sign-in, admins only) | `src/admin/` |

`vercel.json` rewrites `/about` and `/admin/*` to their HTML entries.

## Where things live

| What | File |
| --- | --- |
| Brand name, wordmark, WhatsApp, Instagram, checkout display rules | `src/config/brand.js` |
| All site copy, including the About page (`copy.about`) | `src/config/content.js` |
| The eight perfumes, their collection (`category`) and descriptions (`story`) | `src/data/perfumes.js` |
| Bottle renders from the Blender models (4:5 WebP, 480 and 960 px) | `src/assets/products/renders/` |
| Bottle models for the card's hover 3D (Draco GLB) and their decoder | `public/models/`, `public/draco/` |
| Card bottle: float, pointer tilt and hover 3D (one shared WebGL canvas, loaded on first hover) | `src/components/FloatingBottle.jsx`, `src/lib/bottleStage.js` |
| Payment QR and bank details | `src/config/payment.js` |
| Colours, fonts, type scale, motion tokens | `src/styles/index.css` (`@theme`) |
| Admin colours and type (grey canvas, black, lime) | `src/admin/admin.css` (`@theme`) |
| Checkout backend, database, admin views | `supabase/` (see `supabase/README.md`) |

## The collection

Each perfume in `src/data/perfumes.js` has a `category`: `'him'` (Bayu, Nirmala, Senja, Samudera) or `'her'`
(Purnama, Ranum, Ratna, Seroja). The collection section shows both groups with an All / For Him / For Her filter, and
`#for-him` / `#for-her` link straight to a group (used by the navigation, footer and About page).

`story` is the short description shown in each perfume's pop-up under "Why …". The current text is a **draft written
only from the recorded notes**; confirm or edit it in `perfumes.js`. The `notes` stay in the data as the source for
these descriptions but are no longer displayed.

## Admin console

Overview (greeting, campaign fund, bottles this week/month/quarter, target, sales trend, top three, recent orders),
Analytics (sales by bureau, bottles per week/month/quarter, top AJK sellers), Orders, Payments, AJK Performance,
Leaderboard, Promo Codes, Reports and Settings. Every figure comes from the Supabase views and `admin_*` functions in
`supabase/migrations/20261027000600_admin_dashboard.sql`; only verified payments count as sales.
The top-bar search (⌘K) searches orders.

Run `supabase/migrations/20261028000700_rename_campaign_jetha.sql` once after 006: it renames the stored campaign from
"Beavie Perfume Outbound Fundraiser" to "Titian Serantau Fundraiser" (only if it still has that old default).

## Still to confirm

- The `story` descriptions for all eight perfumes (drafts).
- Bottle photographs still print the old **BEAVIE** name on the labels (`src/assets/products/`); replace them when
  JETHA-labelled photos are ready.
- The wordmark `JETHA` is typographic; swap in the real logo when there is one.

## Notes

- Internal identifiers keep their old names on purpose (`beavie-perfume` package, `beavie-cart-v1` cart storage,
  `bevie-admin-session`): renaming them would empty customers' carts and sign admins out, and nobody sees them.
- Fonts: Playfair Display and DM Sans on the store, Inter in the admin; all SIL Open Font License, bundled via Fontsource.
- Illustrations are original artwork inspired by batik florals. They do not reproduce any specific traditional motif.
- Motion respects `prefers-reduced-motion`.
