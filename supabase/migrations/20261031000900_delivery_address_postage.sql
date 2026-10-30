-- Run after 008. Safe to re-run.
-- Buyers now choose how they receive an order at checkout:
--   delivery    RM7 flat postage anywhere in Malaysia, address required
--   collection  free, collected from the AJK whose code was used
-- The one address box is stored in the existing shipping_address_line1 column.
-- Orders placed before this have no method and keep their zero postage.
-- Postage is part of what the buyer pays (final_amount) but passes through to
-- the courier, so revenue reports count sales_amount, which leaves it out.
begin;

-- ---------------------------------------------------------------- orders
alter table public.orders add column if not exists fulfillment_method text;

alter table public.orders drop constraint if exists orders_fulfillment_method;
alter table public.orders add constraint orders_fulfillment_method check (
  fulfillment_method is null
  or (fulfillment_method = 'delivery' and shipping_address_line1 is not null)
  or (fulfillment_method = 'collection' and shipping_sen = 0 and shipping_address_line1 is null)
);

comment on column public.orders.fulfillment_method is
  'delivery or collection, chosen at checkout. Null on orders placed before the choice existed.';
comment on column public.orders.shipping_address_line1 is
  'The whole delivery address as the buyer typed it (one box at checkout). Null for collection.';
comment on column public.orders.shipping_sen is
  'Postage snapshot: 700 for delivery, 0 for collection. Set by checkout_create_order only.';

-- ---------------------------------------------------------------- checkout
-- p_fulfillment_method defaults to null only so the Edge Function deployed before
-- this migration keeps working until the new one is deployed. The new function
-- always sends a method.
drop function if exists public.checkout_create_order(uuid, text, text, text, text, text, jsonb);
drop function if exists public.checkout_create_order(uuid, text, text, text, text, text, jsonb, text, text);

create function public.checkout_create_order(
  p_request_id uuid,
  p_guest_token_hash text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_note text,
  p_committee_code text,
  p_items jsonb,
  p_fulfillment_method text default null,
  p_delivery_address text default null
)
returns table (order_id uuid, order_number bigint, subtotal_sen bigint, shipping_sen integer, discount_sen integer, total_sen bigint, committee_applied boolean)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_code text := nullif(upper(btrim(coalesce(p_committee_code, ''))), '');
  v_committee_name text;
  v_address text := nullif(btrim(coalesce(p_delivery_address, '')), '');
  v_shipping integer := 0;
  v_subtotal bigint := 0;
  v_quantity integer := 0;
  v_item record;
  v_product public.products%rowtype;
begin
  -- Idempotency: a retried request returns the order it already created.
  select * into v_order from public.orders o where o.checkout_request_id = p_request_id;
  if found then
    if v_order.guest_token_hash <> p_guest_token_hash then
      raise exception 'checkout request already used' using errcode = 'P0001';
    end if;
    return query select v_order.id, v_order.order_number, v_order.subtotal_sen, v_order.shipping_sen, v_order.discount_sen,
      v_order.total_sen, v_order.committee_code is not null;
    return;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty' using errcode = 'P0001';
  end if;

  if p_fulfillment_method = 'delivery' then
    if v_address is null or length(v_address) > 300 then
      raise exception 'a delivery address is required' using errcode = 'P0001';
    end if;
    v_shipping := 700;
  elsif p_fulfillment_method = 'collection' then
    v_address := null;
  elsif p_fulfillment_method is null then
    v_address := null;
  else
    raise exception 'unknown delivery method' using errcode = 'P0001';
  end if;

  if v_code is not null then
    select committee_name into v_committee_name
    from public.committee_codes where code = v_code and is_active;
    if not found then
      raise exception 'invalid committee code' using errcode = 'P0002';
    end if;
  end if;

  -- Validate every line against the catalogue (duplicates are merged).
  for v_item in
    select x.id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(id text, quantity integer)
    group by x.id
  loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 10 then
      raise exception 'quantity must be between 1 and 10' using errcode = 'P0001';
    end if;
    select * into v_product from public.products p where p.id = v_item.id;
    if not found or not v_product.is_active or not v_product.is_purchasable or v_product.price_sen is null then
      raise exception 'product % is not available', v_item.id using errcode = 'P0001';
    end if;
    v_subtotal := v_subtotal + v_product.price_sen::bigint * v_item.quantity;
    v_quantity := v_quantity + v_item.quantity;
  end loop;

  insert into public.orders (
    guest_token_hash, checkout_request_id, customer_name, customer_phone, customer_note,
    fulfillment_method, shipping_address_line1,
    subtotal_sen, shipping_sen, discount_sen, committee_code, committee_name,
    payment_due_at, reservation_expires_at
  ) values (
    p_guest_token_hash, p_request_id, btrim(p_customer_name), btrim(p_customer_phone),
    nullif(btrim(coalesce(p_customer_note, '')), ''),
    p_fulfillment_method, v_address,
    v_subtotal, v_shipping, case when v_code is null then 0 else 500 * v_quantity end, v_code, v_committee_name,
    now() + interval '48 hours', null
  )
  returning * into v_order;

  -- Purchase-time snapshots; unlimited stock (track_stock = false) needs no reservation.
  insert into public.order_items (order_id, product_id, product_name, product_size, unit_price_sen, quantity)
  select v_order.id, p.id, p.name, p.size, p.price_sen, x.quantity
  from (
    select y.id, sum(y.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as y(id text, quantity integer) group by y.id
  ) x
  join public.products p on p.id = x.id;

  insert into public.order_events (order_id, event_type, details)
  values (v_order.id, 'order_created', jsonb_build_object(
    'items', v_quantity, 'subtotal_sen', v_subtotal, 'shipping_sen', v_shipping,
    'fulfillment_method', p_fulfillment_method, 'committee_code', v_code));

  return query select v_order.id, v_order.order_number, v_order.subtotal_sen, v_order.shipping_sen, v_order.discount_sen,
    v_order.total_sen, v_code is not null;
end;
$$;

revoke all on function public.checkout_create_order(uuid, text, text, text, text, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.checkout_create_order(uuid, text, text, text, text, text, jsonb, text, text) to service_role;

-- ---------------------------------------------------------------- admin views
-- Same columns as 006, with the real address and three more at the end.
create or replace view public.order_facts
with (security_invoker = true)
as
select
  o.id,
  'BV-' || lpad(o.order_number::text, 5, '0') as reference,
  o.created_at,
  o.updated_at,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.shipping_address_line1 as delivery_address,
  o.customer_note as customer_notes,
  q.quantity,
  o.committee_code as promo_code,
  o.committee_code as ajk_member_id,
  o.committee_name as ajk_member_name,
  round(o.subtotal_sen::numeric / q.quantity / 100, 2) as original_unit_price,
  round((o.subtotal_sen - o.discount_sen)::numeric / q.quantity / 100, 2) as applied_unit_price,
  round(o.discount_sen::numeric / q.quantity / 100, 2) as discount_per_bottle,
  o.subtotal_sen::numeric / 100 as original_subtotal,
  o.discount_sen::numeric / 100 as discount_total,
  o.total_sen::numeric / 100 as final_amount,
  s.profit_per_bottle,
  'duitnow_qr'::text as payment_method,
  public.dashboard_payment_status(o.payment_status) as payment_status,
  public.dashboard_order_status(o.fulfillment_status) as order_status,
  o.payment_status as shop_payment_status,
  o.fulfillment_status as shop_fulfillment_status,
  o.paid_at as verified_at,
  o.distributed_at as fulfilled_at,
  (select ps.rejection_reason from public.payment_submissions ps
    where ps.order_id = o.id and ps.status = 'rejected' order by ps.reviewed_at desc limit 1) as rejection_reason,
  (o.payment_status = 'paid' and o.fulfillment_status <> 'cancelled') as is_verified,
  (o.payment_status in ('awaiting_payment', 'awaiting_verification') and o.fulfillment_status <> 'cancelled') as is_pending,
  q.quantity * s.profit_per_bottle as profit_amount,
  case
    when o.payment_status = 'refunded' then 'refunded'
    when o.fulfillment_status = 'cancelled' then 'cancelled'
    else public.dashboard_payment_status(o.payment_status)
  end as display_status,
  o.fulfillment_method,
  o.shipping_sen::numeric / 100 as shipping_amount,
  (o.total_sen - o.shipping_sen)::numeric / 100 as sales_amount
from public.orders o
cross join lateral (
  select greatest(coalesce(sum(i.quantity), 0), 1)::integer as quantity
  from public.order_items i where i.order_id = o.id
) q
left join public.campaign_settings s on s.id = 1;

-- f.* now has more columns in the middle of this view, which "or replace" refuses.
drop view if exists public.admin_orders;
create view public.admin_orders
with (security_invoker = true)
as
select
  f.*,
  c.committee_name as member_name,
  coalesce(c.position, '—') as member_role,
  ls.id as submission_id,
  ls.bank_reference as transfer_reference,
  null::date as paid_on,
  ls.receipt_path as proof_path,
  ls.content_type as proof_mime,
  ls.submitted_at as submission_at,
  coalesce(dup.n, 0) > 0 as duplicate_transfer_reference,
  (select string_agg(i.product_name || ' × ' || i.quantity, ', ' order by i.product_name)
     from public.order_items i where i.order_id = f.id) as items_summary
from public.order_facts f
left join public.committee_codes c on c.code = f.ajk_member_id
left join lateral (
  select ps.* from public.payment_submissions ps
  where ps.order_id = f.id order by ps.submitted_at desc limit 1
) ls on true
left join lateral (
  -- The same bank reference on another order is worth a second look.
  select count(*) as n from public.payment_submissions other
  where nullif(upper(regexp_replace(coalesce(ls.bank_reference, ''), '[^A-Za-z0-9]', '', 'g')), '') is not null
    and upper(regexp_replace(coalesce(other.bank_reference, ''), '[^A-Za-z0-9]', '', 'g'))
        = upper(regexp_replace(ls.bank_reference, '[^A-Za-z0-9]', '', 'g'))
    and other.order_id <> f.id
) dup on true;

revoke all on public.order_facts, public.admin_orders from anon;
grant select on public.order_facts, public.admin_orders to authenticated;

-- ---------------------------------------------------------------- reports
-- As in 006, except revenue is sales_amount, and the dashboard also reports postage.

create or replace function public.admin_member_performance(p_from timestamptz default null, p_to timestamptz default null)
returns table (
  member_id text, member_no integer, full_name text, committee_role text, promo_code text, is_active boolean,
  verified_bottles integer, pending_bottles integer, verified_orders integer, total_orders integer,
  revenue numeric, gross numeric, discounts numeric, profit numeric, last_order_at timestamptz,
  target integer, remaining integer, status text, rank integer
)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_target integer;
begin
  perform public.require_shop_admin();
  select member_target into v_target from public.campaign_settings where id = 1;
  return query
  with agg as (
    select
      c.code, c.committee_name, coalesce(c.position, '—') as position, c.is_active,
      (row_number() over (order by c.created_at, c.code))::integer as no,
      coalesce(sum(f.quantity) filter (where f.is_verified), 0)::integer as vb,
      coalesce(sum(f.quantity) filter (where f.is_pending), 0)::integer as pb,
      (count(f.id) filter (where f.is_verified))::integer as vo,
      count(f.id)::integer as tot,
      coalesce(sum(f.sales_amount) filter (where f.is_verified), 0) as rev,
      coalesce(sum(f.original_subtotal) filter (where f.is_verified), 0) as gr,
      coalesce(sum(f.discount_total) filter (where f.is_verified), 0) as disc,
      coalesce(sum(f.profit_amount) filter (where f.is_verified), 0) as prof,
      max(f.created_at) as last_at
    from public.committee_codes c
    left join public.order_facts f
      on f.ajk_member_id = c.code
     and (p_from is null or f.created_at >= p_from)
     and (p_to is null or f.created_at < p_to)
    group by c.code
  )
  select a.code, a.no, a.committee_name, a.position, a.code, a.is_active,
    a.vb, a.pb, a.vo, a.tot, a.rev, a.gr, a.disc, a.prof, a.last_at,
    v_target, greatest(0, v_target - a.vb),
    case when a.vb = 0 then 'not_started' when a.vb < v_target then 'in_progress' else 'target_reached' end,
    (rank() over (order by a.vb desc))::integer
  from agg a
  order by a.vb desc, a.rev desc, a.no;
end;
$$;

create or replace function public.admin_dashboard(p_from timestamptz default null, p_to timestamptz default null)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  s public.campaign_settings;
  v jsonb;
  pend jsonb;
  sc jsonb;
  mem jsonb;
  v_bottles integer;
begin
  perform public.require_shop_admin();
  select * into s from public.campaign_settings where id = 1;

  select jsonb_build_object(
    'orders', count(*),
    'bottles', coalesce(sum(quantity), 0),
    'gross', coalesce(sum(original_subtotal), 0),
    'discounts', coalesce(sum(discount_total), 0),
    'net', coalesce(sum(sales_amount), 0),
    'postage', coalesce(sum(shipping_amount), 0),
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
  ) into pend
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
    'reached', count(*) filter (where m.status = 'target_reached'),
    'in_progress', count(*) filter (where m.status = 'in_progress'),
    'not_started', count(*) filter (where m.status = 'not_started')
  ) into mem
  from public.admin_member_performance(p_from, p_to) m;

  v_bottles := (v ->> 'bottles')::integer;
  return jsonb_build_object(
    'settings', to_jsonb(s),
    'verified', v,
    'pending', pend,
    'status_counts', sc,
    'members', mem,
    'target', jsonb_build_object(
      'campaign_target', s.campaign_target,
      'completion_pct', round(v_bottles::numeric * 100 / s.campaign_target, 1),
      'remaining', greatest(0, s.campaign_target - v_bottles)),
    'generated_at', now());
end;
$$;

create or replace function public.admin_sales_timeseries(
  p_from timestamptz default null, p_to timestamptz default null, p_member_id text default null
)
returns table (
  day date, verified_bottles integer, verified_orders integer, revenue numeric, profit numeric,
  pending_bottles integer, orders integer
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.require_shop_admin();
  return query
  select
    (f.created_at at time zone 'Asia/Kuala_Lumpur')::date as d,
    coalesce(sum(f.quantity) filter (where f.is_verified), 0)::integer,
    (count(*) filter (where f.is_verified))::integer,
    coalesce(sum(f.sales_amount) filter (where f.is_verified), 0),
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

commit;
