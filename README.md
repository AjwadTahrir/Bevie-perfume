# Beavie Perfume

Storefront and fundraising console for the Beavie Perfume outbound-programme campaign.
React 19 + Vite + Tailwind CSS v4, Lucide icons, Supabase (Postgres, Auth, Storage, Realtime),
Vercel Functions for the server API.

| Part | URL | Code |
| --- | --- | --- |
| Storefront (catalogue, cart, checkout) | `/` | `index.html`, `src/` |
| Admin console | `/admin` | `admin/index.html`, `src/admin/` |
| Server API (service role, never in the browser) | `/api/*` | `api/` |
| Database schema, RLS, functions, storage | – | `supabase/migrations/` |
| AJK members and promo codes (idempotent) | – | `supabase/seed.sql` |
| Campaign rules shared by server and UI | – | `shared/campaign.js` |

```bash
npm install
npm run dev        # http://localhost:5173 (storefront) and /admin; /api runs locally too
npm test           # database, API and pricing tests (embedded Postgres, no setup needed)
npm run build      # production build into dist/
```

## How the campaign works

- Every bottle sells at **RM 35**, or **RM 30** with one of the 36 AJK promo codes. Each code belongs to exactly one member.
- Campaign profit is **RM 10 per verified bottle**. Discounts are shown separately and never subtracted from profit again.
- Targets: **5 bottles per AJK member**, **180 bottles** overall. All of these live in the `campaign_settings` table
  and are edited in **Admin → Settings**.
- When an order is created the database stores its unit price, discount, final amount and profit per bottle. Changing
  settings later never rewrites past orders.
- Only orders with `payment_status = 'verified'` (and not cancelled) count as sales, towards targets, revenue and
  profit. Awaiting/submitted payments are shown separately as pending. Rejected, cancelled and refunded orders never count.
- A verified order cannot be cancelled. It must be **refunded**, which removes it from every total.
- Verification is a human check against the bank account. A screenshot is not proof that money arrived.

### Customer flow

Cart → promo code (checked by `/api/promo/validate`) → details → **order created** by `/api/orders`
(reference like `BEV-2026-0001` from a database sequence) → pay by transfer → enter the transfer reference, payment
date and proof (JPG/PNG/WebP/PDF ≤ 4 MB, identified from its bytes by `/api/orders/payment`) → confirmation.
The browser only sends perfume ids and quantities. Prices, discount and AJK attribution are decided by the
`create_order` database function.

### Admin flow

Payments → review the proof (opened through a 5-minute signed URL) → **Verify** / **Reject** (reason required) → later
**Mark fulfilled**, **Cancel** (unpaid only) or **Refund**. Each change is recorded in the status history with the admin's
username. Transfer references used on more than one order are flagged. The dashboard updates through Supabase Realtime
and falls back to polling every 20 to 60 seconds.

## Security model

- `anon` (the public key) has **no access** to any campaign table. Customers act only through `/api`, which uses the
  service-role key on the server.
- Admins read through Row Level Security (`is_admin()` = listed in `admin_profiles`) and change data only through
  `admin_*` database functions that check `is_admin()` again and lock the row (so a payment can't be verified twice).
- Payment proofs sit in the **private** `payment-proofs` bucket. Only admins can read them, and nobody can upload directly.
- Admin sign-in goes through `/api/admin/login`: username → Supabase Auth account (bcrypt-hashed password), with a
  rate limit of 5 failures per username / 20 per IP in 15 minutes. Sessions end after 30 minutes of inactivity.
- The service-role key is read only from server env vars (never `VITE_`-prefixed). `npm run build` output was checked to
  contain no secret.

## Setup

### 1. Supabase project

Create a project at supabase.com (or reuse one), then collect from **Project Settings → API**: the project URL, the
`anon`/publishable key and the `service_role`/secret key. From **Project Settings → Database → Connection string**, take
the session-pooler URI.

### 2. Database

```bash
DATABASE_URL="postgresql://postgres.<ref>:<db-password>@<host>:5432/postgres" npm run db:apply
```

This applies `supabase/migrations/*.sql` once each (tracked in `bevie_schema_migrations`), then runs the seed, which is
safe to repeat. It should finish with `seed 36 AJK members`. With the Supabase CLI instead: `supabase db push`, then run
`supabase/seed.sql` in the SQL editor. Pasting both files into the SQL editor also works.

### 3. Admin account

```bash
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
ADMIN_USERNAME=<username> ADMIN_PASSWORD='<initial password>' npm run admin:create
```

This creates a confirmed Supabase Auth user (`<username>@admin.bevie.local`; set `ADMIN_EMAIL` to use a real address) and
its `admin_profiles` row. Running it again for the same username resets the password. After the first sign-in, change
the password in **Admin → Settings → Your password**. To add another admin, run it with a different username.

To do it by hand instead, add a user under **Authentication → Users → Add user** (auto-confirm), then run in the SQL editor:
`insert into admin_profiles (user_id, username) select id, 'dahulu' from auth.users where email = '<that email>';`

### 4. Environment variables

Copy `.env.example` to `.env.local` for local work, and set the same values in **Vercel → Project → Settings →
Environment Variables**:

| Variable | Where it is used | Secret? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | admin console (browser) | no |
| `VITE_SUPABASE_ANON_KEY` | admin console (browser) | no (public key, RLS applies) |
| `SUPABASE_URL` | `/api` functions | no |
| `SUPABASE_ANON_KEY` | `/api/admin/login` | no |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api` functions, `admin:create` | **yes, server only** |
| `LOGIN_HASH_SALT` | login rate limiting (any random string) | yes |
| `DATABASE_URL` | `db:apply` only, not needed on Vercel | yes |

`VITE_` variables are compiled into the build, so redeploy after changing them.

### 5. Deploy to Vercel

The repository deploys as-is: framework preset **Vite**, build `npm run build`, output `dist`. Files in `api/` become
functions, and `vercel.json` routes `/admin/*` to the console and adds no-index/no-frame headers. After deploying:

1. Open `/admin`, sign in, and check that Overview shows 36 members, all at 0.
2. Place a test order on the storefront with a promo code, verify it in **Payments**, and watch the leaderboard update.
   Then **Refund** it so it doesn't count.
3. In Supabase **Database → Publications**, make sure `supabase_realtime` includes `orders` and `payment_submissions`
   (the migration adds them when the publication exists). The **Live** indicator in the console turns green when this works.

## Still to configure

- Payment QR image and bank account name: `shop.payment` in `src/config/brand.js` (the checkout shows a marked placeholder until then).
- WhatsApp number, Instagram and email: `src/config/brand.js`.
- Delivery fee (`shop.shippingFee`); currently "arranged after checkout".
- Perfume sizes are placeholders (`src/data/perfumes.js`). If the catalogue changes, update `shared/catalogue.js` as well (a test checks they match).

## Where things live

| What | File |
| --- | --- |
| Contact details, payment display, upload limits | `src/config/brand.js` |
| Marketing copy | `src/config/content.js` |
| The eight perfumes | `src/data/perfumes.js` |
| Storefront colours, fonts, motion | `src/styles/index.css` |
| Admin console tokens | `src/admin/admin.css` |
| Checkout | `src/components/CartDrawer.jsx`, `src/lib/orders.js`, `src/lib/campaign.jsx` |
| Admin data access and actions | `src/admin/lib/api.js` |
| Tests | `tests/db` (SQL, RLS, storage), `tests/api` (handlers), `tests/shared.test.js` |
