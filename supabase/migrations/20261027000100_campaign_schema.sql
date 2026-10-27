-- =====================================================================
-- BEVIE FUNDRAISING CAMPAIGN: schema, rules and security
-- ---------------------------------------------------------------------
-- Every money figure on an order is a snapshot taken when the order is
-- created, so changing campaign_settings never rewrites history.
--
-- Counting rule (the single definition used by every report):
--   verified sale  = payment_status = 'verified' and order_status <> 'cancelled'
--   pending        = payment_status in ('awaiting_payment','submitted')
--                    and order_status <> 'cancelled'
-- Rejected, refunded and cancelled orders never count.
--
-- Writes happen only through the security-definer functions below.
-- Public (anon) users get no direct table access at all: customer
-- orders are created by the server (/api) with the service role.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Campaign settings (one row)
-- ---------------------------------------------------------------------
create table if not exists public.campaign_settings (
  id smallint primary key default 1 check (id = 1),
  campaign_name text not null default 'Bevie Perfume Outbound Fundraiser',
  selling_price numeric(10, 2) not null default 35 check (selling_price > 0),
  discounted_price numeric(10, 2) not null default 30 check (discounted_price > 0),
  profit_per_bottle numeric(10, 2) not null default 10 check (profit_per_bottle >= 0),
  campaign_target integer not null default 180 check (campaign_target > 0),
  member_target integer not null default 5 check (member_target > 0),
  starts_on date,
  ends_on date,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint discounted_not_above_selling check (discounted_price <= selling_price),
  constraint dates_in_order check (starts_on is null or ends_on is null or starts_on <= ends_on)
);

insert into public.campaign_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Admins: maps a username to a Supabase Auth user
-- ---------------------------------------------------------------------
create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_.-]{3,32}$'),
  display_name text,
  created_at timestamptz not null default now()
);

-- Failed and successful login attempts, for rate limiting (service role only).
create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  username text not null,
  ip_hash text not null,
  succeeded boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_login_attempts_recent on public.admin_login_attempts (created_at desc);

-- ---------------------------------------------------------------------
-- AJK members and their promo codes
-- ---------------------------------------------------------------------
create table if not exists public.ajk_members (
  id uuid primary key default gen_random_uuid(),
  member_no integer not null unique check (member_no > 0),
  full_name text not null check (length(trim(full_name)) > 0),
  committee_role text not null check (length(trim(committee_role)) > 0),
  promo_code text not null unique check (promo_code ~ '^[A-Z0-9]{5}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create sequence if not exists public.order_reference_seq;

-- BEV-2026-0001: year in Malaysian time plus an atomic sequence number.
create or replace function public.next_order_reference()
returns text
language sql
volatile
set search_path = public
as $$
  select 'BEV-' || to_char(now() at time zone 'Asia/Kuala_Lumpur', 'YYYY') || '-'
         || lpad(nextval('public.order_reference_seq')::text, 4, '0');
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.next_order_reference(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address text not null,
  customer_notes text,

  quantity integer not null check (quantity > 0),

  -- Attribution: stable id plus snapshots of what applied at order time.
  promo_code text,
  ajk_member_id uuid references public.ajk_members (id),
  ajk_member_name text,

  original_unit_price numeric(10, 2) not null check (original_unit_price >= 0),
  applied_unit_price numeric(10, 2) not null check (applied_unit_price >= 0),
  discount_per_bottle numeric(10, 2) not null check (discount_per_bottle >= 0),
  original_subtotal numeric(10, 2) not null,
  discount_total numeric(10, 2) not null,
  final_amount numeric(10, 2) not null,
  profit_per_bottle numeric(10, 2) not null check (profit_per_bottle >= 0),

  payment_method text not null default 'bank_transfer',
  payment_status text not null default 'awaiting_payment'
    check (payment_status in ('awaiting_payment', 'submitted', 'verified', 'rejected', 'refunded')),
  order_status text not null default 'pending'
    check (order_status in ('pending', 'fulfilled', 'cancelled')),

  -- sha256 of the secret the customer's browser holds, so only that
  -- browser can attach a payment to this order.
  access_token_hash text not null,

  payment_submitted_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references auth.users (id),
  rejected_at timestamptz,
  rejection_reason text,
  cancelled_at timestamptz,
  cancellation_reason text,
  refunded_at timestamptz,
  refund_reason text,
  fulfilled_at timestamptz,

  constraint promo_matches_member check ((promo_code is null) = (ajk_member_id is null)),
  constraint subtotal_consistent check (original_subtotal = quantity * original_unit_price),
  constraint discount_consistent check (discount_total = quantity * discount_per_bottle),
  constraint final_consistent check (final_amount = original_subtotal - discount_total),
  constraint applied_consistent check (applied_unit_price = original_unit_price - discount_per_bottle),
  constraint verified_has_timestamp check (payment_status <> 'verified' or verified_at is not null),
  constraint verified_not_cancelled check (not (payment_status = 'verified' and order_status = 'cancelled'))
);

create index if not exists orders_created_at on public.orders (created_at desc);
create index if not exists orders_member on public.orders (ajk_member_id);
create index if not exists orders_payment_status on public.orders (payment_status);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  perfume_id text not null,
  perfume_name text not null,
  quantity integer not null check (quantity > 0)
);
create index if not exists order_items_order on public.order_items (order_id);

create table if not exists public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  transfer_reference text not null check (length(trim(transfer_reference)) between 3 and 80),
  transfer_reference_normalized text generated always as (upper(regexp_replace(transfer_reference, '[^A-Za-z0-9]', '', 'g'))) stored,
  paid_on date,
  proof_path text not null,
  proof_mime text not null check (proof_mime in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  proof_size integer not null check (proof_size > 0),
  proof_original_name text,
  created_at timestamptz not null default now()
);
create index if not exists payment_submissions_order on public.payment_submissions (order_id, created_at desc);
create index if not exists payment_submissions_ref on public.payment_submissions (transfer_reference_normalized);

create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  action text not null,
  from_payment_status text,
  to_payment_status text,
  from_order_status text,
  to_order_status text,
  note text,
  actor_id uuid references auth.users (id),
  actor_label text not null,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order on public.order_status_history (order_id, created_at);

create table if not exists public.order_notes (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  author_id uuid references auth.users (id),
  author_label text not null,
  created_at timestamptz not null default now()
);
create index if not exists order_notes_order on public.order_notes (order_id, created_at);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid());
$$;

create or replace function public.normalize_promo_code(raw text)
returns text
language sql
immutable
as $$
  select nullif(upper(regexp_replace(coalesce(raw, ''), '\s', '', 'g')), '');
$$;

create or replace function public.require_admin()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  select username into v_username from public.admin_profiles where user_id = auth.uid();
  if v_username is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return v_username;
end;
$$;

-- One row per order with the counting flags every report uses.
create or replace view public.order_facts
with (security_invoker = true)
as
select
  o.*,
  (o.payment_status = 'verified' and o.order_status <> 'cancelled') as is_verified,
  (o.payment_status in ('awaiting_payment', 'submitted') and o.order_status <> 'cancelled') as is_pending,
  (o.quantity * o.profit_per_bottle) as profit_amount,
  case
    when o.payment_status = 'refunded' then 'refunded'
    when o.order_status = 'cancelled' then 'cancelled'
    else o.payment_status
  end as display_status
from public.orders o;

-- What the admin order table shows: order, member, latest payment and
-- a flag when the same transfer reference appears on another order.
create or replace view public.admin_orders
with (security_invoker = true)
as
select
  f.*,
  m.full_name as member_name,
  m.committee_role as member_role,
  s.id as submission_id,
  s.transfer_reference,
  s.paid_on,
  s.proof_path,
  s.proof_mime,
  s.created_at as submission_at,
  coalesce(dup.n, 0) > 0 as duplicate_transfer_reference,
  (select string_agg(i.perfume_name || ' × ' || i.quantity, ', ' order by i.id)
     from public.order_items i where i.order_id = f.id) as items_summary
from public.order_facts f
left join public.ajk_members m on m.id = f.ajk_member_id
left join lateral (
  select ps.* from public.payment_submissions ps
  where ps.order_id = f.id order by ps.created_at desc limit 1
) s on true
left join lateral (
  select count(*) as n from public.payment_submissions other
  where s.transfer_reference_normalized is not null
    and other.transfer_reference_normalized = s.transfer_reference_normalized
    and other.order_id <> f.id
) dup on true;

-- ---------------------------------------------------------------------
-- Customer flow (called by the server with the service role)
-- ---------------------------------------------------------------------

-- Validates a promo code. Returns the member, or nothing.
create or replace function public.lookup_promo_code(p_code text)
returns table (member_id uuid, full_name text, committee_role text, promo_code text)
language sql
stable
security definer
set search_path = public
as $$
  select id, full_name, committee_role, promo_code
  from public.ajk_members
  where promo_code = public.normalize_promo_code(p_code) and is_active;
$$;

create or replace function public.create_order(
  p_customer jsonb,
  p_items jsonb,
  p_promo_code text,
  p_token_hash text
)
returns table (
  order_id uuid,
  reference text,
  quantity integer,
  original_unit_price numeric,
  applied_unit_price numeric,
  discount_per_bottle numeric,
  original_subtotal numeric,
  discount_total numeric,
  final_amount numeric,
  promo_code text,
  member_name text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  s public.campaign_settings;
  v_code text := public.normalize_promo_code(p_promo_code);
  v_member public.ajk_members;
  v_qty integer := 0;
  v_item jsonb;
  v_item_qty integer;
  v_discount numeric(10, 2) := 0;
  v_name text := trim(coalesce(p_customer ->> 'name', ''));
  v_phone text := trim(coalesce(p_customer ->> 'phone', ''));
  v_email text := nullif(trim(coalesce(p_customer ->> 'email', '')), '');
  v_address text := trim(coalesce(p_customer ->> 'address', ''));
  v_notes text := nullif(trim(coalesce(p_customer ->> 'notes', '')), '');
  v_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  o public.orders;
begin
  select * into s from public.campaign_settings where id = 1;
  if (s.starts_on is not null and v_today < s.starts_on) or (s.ends_on is not null and v_today > s.ends_on) then
    raise exception 'campaign_closed';
  end if;

  if length(v_name) not between 2 and 120 then raise exception 'invalid_name'; end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) not between 9 and 13 then raise exception 'invalid_phone'; end if;
  if v_email is not null and (length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'invalid_email'; end if;
  if length(v_address) not between 5 and 500 then raise exception 'invalid_address'; end if;
  if v_notes is not null and length(v_notes) > 1000 then raise exception 'invalid_notes'; end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'invalid_items';
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    if coalesce(v_item ->> 'perfume_id', '') = '' or coalesce(v_item ->> 'perfume_name', '') = ''
       or coalesce(v_item ->> 'quantity', '') !~ '^\d{1,3}$' then
      raise exception 'invalid_items';
    end if;
    v_item_qty := (v_item ->> 'quantity')::integer;
    if v_item_qty not between 1 and 50 then raise exception 'invalid_items'; end if;
    v_qty := v_qty + v_item_qty;
  end loop;
  if v_qty > 100 then raise exception 'invalid_items'; end if;

  if v_code is not null then
    select * into v_member from public.ajk_members m where m.promo_code = v_code and m.is_active;
    if v_member.id is null then raise exception 'invalid_promo_code'; end if;
    v_discount := s.selling_price - s.discounted_price;
  end if;

  if coalesce(length(p_token_hash), 0) <> 64 then raise exception 'invalid_token'; end if;

  insert into public.orders (
    customer_name, customer_phone, customer_email, delivery_address, customer_notes,
    quantity, promo_code, ajk_member_id, ajk_member_name,
    original_unit_price, applied_unit_price, discount_per_bottle,
    original_subtotal, discount_total, final_amount, profit_per_bottle,
    access_token_hash
  ) values (
    v_name, v_phone, v_email, v_address, v_notes,
    v_qty, case when v_member.id is null then null else v_code end, v_member.id, v_member.full_name,
    s.selling_price, s.selling_price - v_discount, v_discount,
    v_qty * s.selling_price, v_qty * v_discount, v_qty * (s.selling_price - v_discount), s.profit_per_bottle,
    p_token_hash
  )
  returning * into o;

  insert into public.order_items (order_id, perfume_id, perfume_name, quantity)
  select o.id, e ->> 'perfume_id', e ->> 'perfume_name', (e ->> 'quantity')::integer
  from jsonb_array_elements(p_items) e;

  insert into public.order_status_history (order_id, action, to_payment_status, to_order_status, actor_label)
  values (o.id, 'created', o.payment_status, o.order_status, 'customer');

  return query select o.id, o.reference, o.quantity, o.original_unit_price, o.applied_unit_price,
    o.discount_per_bottle, o.original_subtotal, o.discount_total, o.final_amount, o.promo_code, o.ajk_member_name;
end;
$$;

-- Records the customer's transfer reference and uploaded proof.
create or replace function public.submit_payment(
  p_order_id uuid,
  p_token_hash text,
  p_transfer_reference text,
  p_paid_on date,
  p_proof_path text,
  p_proof_mime text,
  p_proof_size integer,
  p_proof_name text
)
returns table (reference text, payment_status text, duplicate_transfer_reference boolean)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  o public.orders;
  v_dup boolean;
  v_ref text := trim(coalesce(p_transfer_reference, ''));
begin
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null or o.access_token_hash <> p_token_hash then raise exception 'order_not_found'; end if;
  if o.order_status = 'cancelled' then raise exception 'order_cancelled'; end if;
  if o.payment_status not in ('awaiting_payment', 'rejected') then raise exception 'payment_already_submitted'; end if;
  if length(v_ref) not between 3 and 80 then raise exception 'invalid_transfer_reference'; end if;
  if p_paid_on is not null and (p_paid_on > (now() at time zone 'Asia/Kuala_Lumpur')::date + 1
                                or p_paid_on < (o.created_at at time zone 'Asia/Kuala_Lumpur')::date - 30) then
    raise exception 'invalid_paid_on';
  end if;

  insert into public.payment_submissions (order_id, transfer_reference, paid_on, proof_path, proof_mime, proof_size, proof_original_name)
  values (o.id, v_ref, p_paid_on, p_proof_path, p_proof_mime, p_proof_size, left(p_proof_name, 200));

  update public.orders
     set payment_status = 'submitted', payment_submitted_at = now(), updated_at = now()
   where id = o.id;

  insert into public.order_status_history (order_id, action, from_payment_status, to_payment_status, actor_label, note)
  values (o.id, 'payment_submitted', o.payment_status, 'submitted', 'customer', 'Transfer reference ' || v_ref);

  select exists (
    select 1 from public.payment_submissions ps
    where ps.transfer_reference_normalized = upper(regexp_replace(v_ref, '[^A-Za-z0-9]', '', 'g'))
      and ps.order_id <> o.id
  ) into v_dup;

  return query select o.reference, 'submitted'::text, v_dup;
end;
$$;

-- Lets the customer's browser withdraw an order it never paid for
-- (they changed the cart before paying).
create or replace function public.cancel_unpaid_order(p_order_id uuid, p_token_hash text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null or o.access_token_hash <> p_token_hash then raise exception 'order_not_found'; end if;
  if o.payment_status <> 'awaiting_payment' or o.order_status = 'cancelled' then return false; end if;
  update public.orders set order_status = 'cancelled', cancelled_at = now(), cancellation_reason = 'Withdrawn by customer before payment', updated_at = now()
   where id = o.id;
  insert into public.order_status_history (order_id, action, from_order_status, to_order_status, actor_label, note)
  values (o.id, 'cancelled', o.order_status, 'cancelled', 'customer', 'Withdrawn before payment');
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin actions (called from the dashboard with the admin's session)
-- ---------------------------------------------------------------------
create or replace function public.admin_log(
  o public.orders, p_action text, p_payment text, p_order text, p_note text, p_admin text
) returns void
language sql
volatile
security definer
set search_path = public
as $$
  insert into public.order_status_history (
    order_id, action, from_payment_status, to_payment_status, from_order_status, to_order_status, note, actor_id, actor_label
  ) values (
    o.id, p_action,
    o.payment_status, coalesce(p_payment, o.payment_status),
    o.order_status, coalesce(p_order, o.order_status),
    nullif(trim(coalesce(p_note, '')), ''), auth.uid(), p_admin
  );
$$;

create or replace function public.admin_verify_payment(p_order_id uuid, p_note text default null)
returns public.orders
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_admin text := public.require_admin();
  o public.orders;
begin
  -- Row lock: two admins clicking Verify at once are serialised, and the
  -- second sees 'already_verified' instead of counting the sale twice.
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.payment_status = 'verified' then raise exception 'already_verified'; end if;
  if o.order_status = 'cancelled' or o.payment_status = 'refunded' then raise exception 'invalid_transition'; end if;
  perform public.admin_log(o, 'payment_verified', 'verified', null, p_note, v_admin);
  update public.orders
     set payment_status = 'verified', verified_at = now(), verified_by = auth.uid(),
         rejected_at = null, rejection_reason = null, updated_at = now()
   where id = o.id
  returning * into o;
  return o;
end;
$$;

create or replace function public.admin_reject_payment(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_admin text := public.require_admin();
  o public.orders;
begin
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.payment_status not in ('awaiting_payment', 'submitted') or o.order_status = 'cancelled' then
    raise exception 'invalid_transition';
  end if;
  perform public.admin_log(o, 'payment_rejected', 'rejected', null, p_reason, v_admin);
  update public.orders
     set payment_status = 'rejected', rejected_at = now(), rejection_reason = trim(p_reason), updated_at = now()
   where id = o.id
  returning * into o;
  return o;
end;
$$;

create or replace function public.admin_cancel_order(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_admin text := public.require_admin();
  o public.orders;
begin
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.order_status = 'cancelled' then raise exception 'invalid_transition'; end if;
  -- A verified order has money attached: it must be refunded instead.
  if o.payment_status = 'verified' then raise exception 'refund_required'; end if;
  perform public.admin_log(o, 'order_cancelled', null, 'cancelled', p_reason, v_admin);
  update public.orders
     set order_status = 'cancelled', cancelled_at = now(), cancellation_reason = trim(p_reason), updated_at = now()
   where id = o.id
  returning * into o;
  return o;
end;
$$;

create or replace function public.admin_refund_order(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_admin text := public.require_admin();
  o public.orders;
begin
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.payment_status <> 'verified' then raise exception 'invalid_transition'; end if;
  perform public.admin_log(o, 'refunded', 'refunded', 'cancelled', p_reason, v_admin);
  update public.orders
     set payment_status = 'refunded', order_status = 'cancelled', refunded_at = now(), refund_reason = trim(p_reason),
         cancelled_at = now(), cancellation_reason = 'Refunded', updated_at = now()
   where id = o.id
  returning * into o;
  return o;
end;
$$;

create or replace function public.admin_mark_fulfilled(p_order_id uuid)
returns public.orders
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_admin text := public.require_admin();
  o public.orders;
begin
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.payment_status <> 'verified' or o.order_status <> 'pending' then raise exception 'invalid_transition'; end if;
  perform public.admin_log(o, 'fulfilled', null, 'fulfilled', null, v_admin);
  update public.orders set order_status = 'fulfilled', fulfilled_at = now(), updated_at = now()
   where id = o.id
  returning * into o;
  return o;
end;
$$;

create or replace function public.admin_add_note(p_order_id uuid, p_body text)
returns public.order_notes
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_admin text := public.require_admin();
  n public.order_notes;
begin
  if not exists (select 1 from public.orders where id = p_order_id) then raise exception 'order_not_found'; end if;
  insert into public.order_notes (order_id, body, author_id, author_label)
  values (p_order_id, trim(p_body), auth.uid(), v_admin)
  returning * into n;
  return n;
end;
$$;

create or replace function public.admin_set_member_active(p_member_id uuid, p_active boolean)
returns public.ajk_members
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_admin text := public.require_admin();
  m public.ajk_members;
begin
  update public.ajk_members set is_active = p_active, updated_at = now() where id = p_member_id returning * into m;
  if m.id is null then raise exception 'member_not_found'; end if;
  return m;
end;
$$;

create or replace function public.admin_update_settings(p jsonb)
returns public.campaign_settings
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_admin text := public.require_admin();
  s public.campaign_settings;
begin
  if length(trim(coalesce(p ->> 'campaign_name', ''))) not between 3 and 120 then raise exception 'invalid_campaign_name'; end if;
  if (p ->> 'selling_price')::numeric not between 1 and 10000
     or (p ->> 'discounted_price')::numeric not between 1 and 10000
     or (p ->> 'profit_per_bottle')::numeric not between 0 and 10000 then
    raise exception 'invalid_price';
  end if;
  if (p ->> 'discounted_price')::numeric > (p ->> 'selling_price')::numeric then raise exception 'discount_above_price'; end if;
  if (p ->> 'campaign_target')::integer not between 1 and 100000 or (p ->> 'member_target')::integer not between 1 and 10000 then
    raise exception 'invalid_target';
  end if;

  update public.campaign_settings set
    campaign_name = trim(p ->> 'campaign_name'),
    selling_price = (p ->> 'selling_price')::numeric,
    discounted_price = (p ->> 'discounted_price')::numeric,
    profit_per_bottle = (p ->> 'profit_per_bottle')::numeric,
    campaign_target = (p ->> 'campaign_target')::integer,
    member_target = (p ->> 'member_target')::integer,
    starts_on = nullif(p ->> 'starts_on', '')::date,
    ends_on = nullif(p ->> 'ends_on', '')::date,
    updated_at = now(),
    updated_by = auth.uid()
  where id = 1
  returning * into s;
  return s;
end;
$$;

-- ---------------------------------------------------------------------
-- Reporting (admin only). Dates filter on the order's creation time.
-- ---------------------------------------------------------------------
create or replace function public.admin_member_performance(p_from timestamptz default null, p_to timestamptz default null)
returns table (
  member_id uuid,
  member_no integer,
  full_name text,
  committee_role text,
  promo_code text,
  is_active boolean,
  verified_bottles integer,
  pending_bottles integer,
  verified_orders integer,
  total_orders integer,
  revenue numeric,
  gross numeric,
  discounts numeric,
  profit numeric,
  last_order_at timestamptz,
  target integer,
  remaining integer,
  status text,
  rank integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_target integer;
begin
  perform public.require_admin();
  select member_target into v_target from public.campaign_settings where id = 1;
  return query
  with agg as (
    select
      m.id, m.member_no, m.full_name, m.committee_role, m.promo_code, m.is_active,
      coalesce(sum(f.quantity) filter (where f.is_verified), 0)::integer as vb,
      coalesce(sum(f.quantity) filter (where f.is_pending), 0)::integer as pb,
      count(f.id) filter (where f.is_verified)::integer as vo,
      count(f.id)::integer as tot,
      coalesce(sum(f.final_amount) filter (where f.is_verified), 0) as rev,
      coalesce(sum(f.original_subtotal) filter (where f.is_verified), 0) as gr,
      coalesce(sum(f.discount_total) filter (where f.is_verified), 0) as disc,
      coalesce(sum(f.profit_amount) filter (where f.is_verified), 0) as prof,
      max(f.created_at) as last_at
    from public.ajk_members m
    left join public.order_facts f
      on f.ajk_member_id = m.id
     and (p_from is null or f.created_at >= p_from)
     and (p_to is null or f.created_at < p_to)
    group by m.id
  )
  select a.id, a.member_no, a.full_name, a.committee_role, a.promo_code, a.is_active,
    a.vb, a.pb, a.vo, a.tot, a.rev, a.gr, a.disc, a.prof, a.last_at,
    v_target, greatest(0, v_target - a.vb),
    case when a.vb = 0 then 'not_started' when a.vb < v_target then 'in_progress' else 'target_reached' end,
    -- Standard competition ranking: equal bottle counts share a rank (1, 1, 3).
    (rank() over (order by a.vb desc))::integer
  from agg a
  order by a.vb desc, a.rev desc, a.member_no;
end;
$$;

create or replace function public.admin_dashboard(p_from timestamptz default null, p_to timestamptz default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s public.campaign_settings;
  v jsonb;
  p jsonb;
  sc jsonb;
  mem jsonb;
  v_bottles integer;
begin
  perform public.require_admin();
  select * into s from public.campaign_settings where id = 1;

  select jsonb_build_object(
    'orders', count(*),
    'bottles', coalesce(sum(quantity), 0),
    'gross', coalesce(sum(original_subtotal), 0),
    'discounts', coalesce(sum(discount_total), 0),
    'net', coalesce(sum(final_amount), 0),
    'profit', coalesce(sum(profit_amount), 0),
    'promo_orders', count(*) filter (where promo_code is not null),
    'promo_bottles', coalesce(sum(quantity) filter (where promo_code is not null), 0),
    'direct_orders', count(*) filter (where promo_code is null),
    'direct_bottles', coalesce(sum(quantity) filter (where promo_code is null), 0)
  ) into v
  from public.order_facts
  where is_verified and (p_from is null or created_at >= p_from) and (p_to is null or created_at < p_to);

  select jsonb_build_object(
    'orders', count(*),
    'bottles', coalesce(sum(quantity), 0),
    'amount', coalesce(sum(final_amount), 0),
    'submitted_orders', count(*) filter (where payment_status = 'submitted'),
    'awaiting_orders', count(*) filter (where payment_status = 'awaiting_payment')
  ) into p
  from public.order_facts
  where is_pending and (p_from is null or created_at >= p_from) and (p_to is null or created_at < p_to);

  select coalesce(jsonb_object_agg(display_status, n), '{}'::jsonb) into sc
  from (
    select display_status, count(*) as n from public.order_facts
    where (p_from is null or created_at >= p_from) and (p_to is null or created_at < p_to)
    group by display_status
  ) x;

  select jsonb_build_object(
    'total', count(*),
    'reached', count(*) filter (where status = 'target_reached'),
    'in_progress', count(*) filter (where status = 'in_progress'),
    'not_started', count(*) filter (where status = 'not_started')
  ) into mem
  from public.admin_member_performance(p_from, p_to);

  v_bottles := (v ->> 'bottles')::integer;

  return jsonb_build_object(
    'settings', to_jsonb(s),
    'verified', v,
    'pending', p,
    'status_counts', sc,
    'members', mem,
    'target', jsonb_build_object(
      'campaign_target', s.campaign_target,
      'completion_pct', round(v_bottles::numeric * 100 / s.campaign_target, 1),
      'remaining', greatest(0, s.campaign_target - v_bottles)
    ),
    'generated_at', now()
  );
end;
$$;

-- Daily series in Malaysian dates. Optionally for one member.
create or replace function public.admin_sales_timeseries(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_member_id uuid default null
)
returns table (
  day date,
  verified_bottles integer,
  verified_orders integer,
  revenue numeric,
  profit numeric,
  pending_bottles integer,
  orders integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_admin();
  return query
  select
    (f.created_at at time zone 'Asia/Kuala_Lumpur')::date as d,
    coalesce(sum(f.quantity) filter (where f.is_verified), 0)::integer,
    count(*) filter (where f.is_verified)::integer,
    coalesce(sum(f.final_amount) filter (where f.is_verified), 0),
    coalesce(sum(f.profit_amount) filter (where f.is_verified), 0),
    coalesce(sum(f.quantity) filter (where f.is_pending), 0)::integer,
    count(*)::integer
  from public.order_facts f
  where (p_from is null or f.created_at >= p_from)
    and (p_to is null or f.created_at < p_to)
    and (p_member_id is null or f.ajk_member_id = p_member_id)
  group by d
  order by d;
end;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.campaign_settings enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.admin_login_attempts enable row level security;
alter table public.ajk_members enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_submissions enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_notes enable row level security;

-- Admins read everything; nobody writes directly (functions do).
drop policy if exists "admins read settings" on public.campaign_settings;
create policy "admins read settings" on public.campaign_settings for select to authenticated using (public.is_admin());

drop policy if exists "admins read own profile" on public.admin_profiles;
create policy "admins read own profile" on public.admin_profiles for select to authenticated using (user_id = auth.uid());

drop policy if exists "admins read members" on public.ajk_members;
create policy "admins read members" on public.ajk_members for select to authenticated using (public.is_admin());

drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders for select to authenticated using (public.is_admin());

drop policy if exists "admins read order items" on public.order_items;
create policy "admins read order items" on public.order_items for select to authenticated using (public.is_admin());

drop policy if exists "admins read payment submissions" on public.payment_submissions;
create policy "admins read payment submissions" on public.payment_submissions for select to authenticated using (public.is_admin());

drop policy if exists "admins read status history" on public.order_status_history;
create policy "admins read status history" on public.order_status_history for select to authenticated using (public.is_admin());

drop policy if exists "admins read notes" on public.order_notes;
create policy "admins read notes" on public.order_notes for select to authenticated using (public.is_admin());

-- Belt and braces: the public roles hold no write privileges at all.
revoke insert, update, delete, truncate on
  public.campaign_settings, public.admin_profiles, public.admin_login_attempts, public.ajk_members,
  public.orders, public.order_items, public.payment_submissions, public.order_status_history, public.order_notes
from anon, authenticated;
revoke all on public.admin_login_attempts from anon, authenticated;
revoke all on public.orders, public.order_items, public.payment_submissions, public.order_status_history,
  public.order_notes, public.ajk_members, public.campaign_settings, public.admin_profiles from anon;
grant select on public.campaign_settings, public.admin_profiles, public.ajk_members, public.orders, public.order_items,
  public.payment_submissions, public.order_status_history, public.order_notes to authenticated;
revoke all on public.order_facts, public.admin_orders from anon;
grant select on public.order_facts, public.admin_orders to authenticated;
revoke all on sequence public.order_reference_seq from anon, authenticated;

-- Function privileges: nothing is callable by default.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.normalize_promo_code(text) to anon, authenticated;
grant execute on function
  public.require_admin(),
  public.admin_verify_payment(uuid, text),
  public.admin_reject_payment(uuid, text),
  public.admin_cancel_order(uuid, text),
  public.admin_refund_order(uuid, text),
  public.admin_mark_fulfilled(uuid),
  public.admin_add_note(uuid, text),
  public.admin_set_member_active(uuid, boolean),
  public.admin_update_settings(jsonb),
  public.admin_member_performance(timestamptz, timestamptz),
  public.admin_dashboard(timestamptz, timestamptz),
  public.admin_sales_timeseries(timestamptz, timestamptz, uuid)
to authenticated;
grant execute on function
  public.lookup_promo_code(text),
  public.create_order(jsonb, jsonb, text, text),
  public.submit_payment(uuid, text, text, date, text, text, integer, text),
  public.cancel_unpaid_order(uuid, text)
to service_role;

-- ---------------------------------------------------------------------
-- Private storage for payment proofs
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Only admins can read (and so create signed URLs for) proofs. There is
-- no insert policy: the server uploads with the service role after
-- checking the file's bytes.
drop policy if exists "admins read payment proofs" on storage.objects;
create policy "admins read payment proofs" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- ---------------------------------------------------------------------
-- Realtime: the dashboard listens for order and payment changes
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
      alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'payment_submissions') then
      alter publication supabase_realtime add table public.payment_submissions;
    end if;
  end if;
end;
$$;
