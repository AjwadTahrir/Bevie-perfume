# Supabase database setup

This is the backend for guest checkout with bank QR payment and manual receipt review: the database (migrations 001-005), the `checkout` Edge Function the website talks to, and the frontend connection in `src/lib/orders.js`. Admin review of receipts is not built yet (see the end of this file).

## Apply to a new Supabase project

1. Create a Supabase project and open **SQL Editor → New query**.
2. Paste and run `migrations/20261027000100_create_shop_tables.sql`.
3. In a new query, paste and run `migrations/20261027000200_seed_catalogue.sql`.
4. Run `migrations/20261027000300_committee_distribution.sql`. Confirm the eight tables appear in Table Editor. Run each migration only once. If you already ran 001 and 002, run only 003.
5. Run `migrations/20261027000400_fixed_prices_unlimited_stock.sql` (if 001-003 are already applied, run only 004). Then run `tests/access_and_constraints.sql` in SQL Editor. It rolls back its test data; an error means a check failed.
6. Run `migrations/20261027000500_align_catalogue_and_checkout.sql` (if 001-004 are already applied, run only 005). It puts the RM35 price on the Malay catalogue IDs seeded by 002 (`bayu`, `nirmala`, ...; 004 targeted English IDs that were never created), and adds the checkout functions. The website (`src/data/perfumes.js`) uses the same IDs and names.
7. Load the committee codes: run `private/committee_codes.sql`. That file holds members' names, so it is kept out of git; ask for it rather than committing it.
8. Create the receipt bucket (see **Create receipt storage** below).

## Connect the website (checkout Edge Function)

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then `supabase login` and `supabase link --project-ref <your project ref>`.
2. Deploy: `supabase functions deploy checkout --no-verify-jwt`. Guests have no account, so the function authorises each order by its private guest token instead of a login. Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function automatically; never put the service-role key in the website.
3. Optional: `supabase secrets set ALLOWED_ORIGINS=https://your-site.example` to accept requests only from the live site (default: any origin).
4. Copy `.env.example` to `.env` in the project root and fill in the project URL and the **anon** (public) key from **Project Settings -> API**. Rebuild the site (and set the same two variables on your host).
5. Checkout is now live: the real QR from `src/config/payment.js` appears and orders are saved. Without these variables, local development runs a demo checkout (placeholder QR, nothing saved) and a public build says ordering opens soon.

The function (`functions/checkout/index.ts`) offers three actions: `validate-code`, `create-order` (prices and the RM5-per-bottle discount come from the database; retries with the same request id return the same order) and `submit-receipt` (checks the order token, file size and the image's real type from its bytes, stores it privately at `<order>/<submission>.<ext>`, sets the order to `awaiting_verification`).

No local CLI, Node.js or Docker installation is needed for this dashboard workflow. These files assume Supabase's existing `auth` schema and roles, not plain PostgreSQL. They have not been applied to a hosted project from this workspace.

If later adopting the Supabase CLI, reconcile migrations already run in SQL Editor with CLI migration history before pushing; do not replay these migrations against existing tables.

## Tables

| Table | Purpose |
| --- | --- |
| `shop_admins` | Trusted admin user IDs from Supabase Auth |
| `products` | Catalogue, prices in sen, availability |
| `inventory` | Physical stock and reserved stock |
| `orders` | Customer name/phone, optional committee code, totals, payment/distribution statuses |
| `committee_codes` | Private committee codes and the member responsible for each code |
| `order_items` | Purchase-time product name, size and price snapshots |
| `payment_submissions` | Private receipt paths and review history |
| `order_events` | Order/payment audit history |

The seed imports the eight names, IDs, families and descriptions. Notes and image paths remain empty; current frontend images and notes remain in `src/data/perfumes.js` until the catalogue integration. Migration 004 sets all eight perfumes to RM35 (`3500` sen), enables purchasing for active products, and sets `track_stock = false` for unlimited stock. Size stays unknown and is optional. The frontend catalogue also displays RM35; checkout must use database prices.

## Add an admin

Create your admin user in **Authentication → Users**. Copy its UUID and run this in SQL Editor, replacing the example UUID:

```sql
insert into public.shop_admins (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

This UUID must belong to an existing Auth user. Admin membership is stored in a protected table, never user-editable metadata. Authenticated admins can read shop data. All writes will go through backend functions; Table Editor/SQL Editor can manage the initial data using trusted database access.

## Create receipt storage

In **Storage**, create a bucket:

- Name: `payment-receipts`
- Public: **off**
- File size limit: **5 MB** (5,242,880 bytes)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

Do not add public upload/read policies. The future backend will authorize an order before issuing a signed upload URL for exactly `<order UUID>/<submission UUID>.<extension>`, without overwrite permission. It must verify the uploaded object's existence, actual type and size before recording a submission. Admin receipt viewing also goes through an authorized backend that issues short-lived signed read URLs. Database metadata checks do not inspect uploaded bytes.

The bank QR can be a public frontend asset. Receipts must stay private.

## Security and remaining backend work

RLS is enabled on every shop table. Visitors can read active products only. Ordinary signed-in users cannot see orders, stock, receipts or audit events. No browser role, including admins, has direct write access. Keep Supabase secret/service-role credentials exclusively on the server.

Guest checkout intentionally has no direct order-read policy. Backend endpoints must generate a cryptographically random guest token (at least 32 random bytes), save only its SHA-256 hash, and validate it before returning a safe order summary or authorizing uploads. Never return the hash or use an order number as a credential. Rate-limit guest endpoints.

Status: 1 and 2 below are implemented (migration 005 and `functions/checkout`). 3 (admin approval) and the expiry scheduling in 4 are still to build.

The transactional backend operations:

1. Create orders idempotently using `checkout_request_id`, validate quantities and an optional active committee code, calculate authoritative product totals, snapshot items, and skip inventory checks/reservations for products with `track_stock = false`. Use zero shipping fees for committee distribution. The database does not yet enforce that `subtotal_sen` equals the sum of the items; the checkout transaction must do so.
2. Record verified receipt uploads and change payment status to `awaiting_verification`. Unlimited-stock orders do not need reservation windows.
3. Require admin authorization to approve/reject a pending receipt, update order/payment/stock and append audit events in one transaction. Receipt submission is not payment approval.
4. Do not reserve, decrement or check inventory for unlimited-stock products. Payment deadlines may still expire unpaid orders; stock does not constrain checkout.
5. Preserve item/receipt history and control valid status transitions. Current constraints check basic row integrity; they do not implement the workflow or cross-table consistency.

Do not enable checkout until those operations are implemented. Retention/refund handling and automatic expiry scheduling also require application logic.

## Committee ordering workflow

1. Buyer selects perfumes and quantities.
2. Buyer provides name and phone, and optionally enters a committee code.
3. Backend creates an order with the final total. Show the bank QR and accept payment proof.
4. Show "Order submitted - payment awaiting verification" only after receipt submission succeeds.

Email and delivery address are not required. The committee distributes the perfume. Distribution statuses are `unfulfilled`, `processing`, `ready_for_distribution`, `distributed`, and `cancelled`. Payment still requires manual approval before processing/distribution.

The discount is **RM5 per bottle** with an active committee code: RM35 normally, RM30 with a code. Three bottles cost RM105 normally or RM90 with a code. The backend must calculate `discount_sen = 500 * total quantity` and save that snapshot with the items. No code means zero discount. The database checks discount bounds, but cross-table quantity validation still requires the checkout transaction. Historical orders retain their previous discount. Before showing the QR, the backend must trim/uppercase the entered code, verify that it exists and is active, and copy its `committee_name` into the order. Invalid/inactive codes should display an error and let the buyer correct or remove the code. Do not silently remove an expected discount.

Create real codes through SQL Editor (example only; replace before running):

```sql
insert into public.committee_codes (code, committee_name)
values ('AISHA01', 'Aisha');
```

Codes are not publicly listable. A future rate-limited backend endpoint will validate one entered code. Deactivate codes with `is_active = false` rather than deleting them; existing orders keep their original discount and attribution. Active-code validation and name snapshots require backend logic; the foreign key only checks code existence.

For orders without a code, admins arrange committee distribution using the customer's phone. This is independent of the optional discount code. Legacy email/address/courier columns remain for existing data but new checkout will not collect them.


## QR and development fixture

See public/payment/README.md for the QR placeholder and replacement steps. Configure the image and account holder in src/config/payment.js; real payment must stay disabled until configured. No QR/account holder was provided yet.

supabase/tests/manual_checkout_fixture.json contains Aniq Faizul as a development buyer name, a dummy phone number, and a three-bottle RM90 example using ANIQ_TEST. This is an input fixture only, not an inserted customer or working committee code. In a test project you can create that code with committee name 'Aniq Faizul'. No personal phone was supplied. Do not create test orders in production.
