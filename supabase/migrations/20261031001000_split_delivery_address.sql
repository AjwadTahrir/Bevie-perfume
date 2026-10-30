-- Run after 009. Safe to re-run.
-- The one address box at checkout becomes separate fields, stored in the existing
-- shipping_address_line1, shipping_address_line2, shipping_postcode, shipping_city
-- and shipping_state columns. Orders placed through the box keep their whole address
-- in shipping_address_line1, so the other fields are required here in checkout rather
-- than by a table constraint, which those orders would fail on every update.
-- Deploy the checkout Edge Function straight after this: the one deployed before
-- it calls the old signature, so orders fail until the new one is live.
begin;

comment on column public.orders.shipping_address_line1 is
  'First address line. On orders placed through the single address box (migration 009), the whole address. Null for collection.';

-- ---------------------------------------------------------------- checkout
drop function if exists public.checkout_create_order(uuid, text, text, text, text, text, jsonb, text, text);
drop function if exists public.checkout_create_order(uuid, text, text, text, text, text, jsonb, text, text, text, text, text, text);

create function public.checkout_create_order(
  p_request_id uuid,
  p_guest_token_hash text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_note text,
  p_committee_code text,
  p_items jsonb,
  p_fulfillment_method text,
  p_address_line1 text,
  p_address_line2 text,
  p_postcode text,
  p_city text,
  p_state text
)
returns table (order_id uuid, order_number bigint, subtotal_sen bigint, shipping_sen integer, discount_sen integer, total_sen bigint, committee_applied boolean)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_code text := nullif(upper(btrim(coalesce(p_committee_code, ''))), '');
  v_committee_name text;
  v_line1 text := nullif(btrim(coalesce(p_address_line1, '')), '');
  v_line2 text := nullif(btrim(coalesce(p_address_line2, '')), '');
  v_postcode text := nullif(btrim(coalesce(p_postcode, '')), '');
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_state text := nullif(btrim(coalesce(p_state, '')), '');
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
    if v_line1 is null or length(v_line1) > 200 or length(v_line2) > 200 then
      raise exception 'Please enter your address.' using errcode = 'P0001';
    end if;
    if v_postcode is null or v_postcode !~ '^[0-9]{5}$' then
      raise exception 'Please enter your 5-digit postcode.' using errcode = 'P0001';
    end if;
    if v_city is null or length(v_city) > 100 then
      raise exception 'Please enter your city.' using errcode = 'P0001';
    end if;
    if v_state is null or v_state not in ('Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka', 'Negeri Sembilan',
      'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu') then
      raise exception 'Please choose your state.' using errcode = 'P0001';
    end if;
    v_shipping := 700;
  elsif p_fulfillment_method = 'collection' then
    v_line1 := null;
    v_line2 := null;
    v_postcode := null;
    v_city := null;
    v_state := null;
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
    fulfillment_method, shipping_address_line1, shipping_address_line2, shipping_postcode, shipping_city, shipping_state,
    subtotal_sen, shipping_sen, discount_sen, committee_code, committee_name,
    payment_due_at, reservation_expires_at
  ) values (
    p_guest_token_hash, p_request_id, btrim(p_customer_name), btrim(p_customer_phone),
    nullif(btrim(coalesce(p_customer_note, '')), ''),
    p_fulfillment_method, v_line1, v_line2, v_postcode, v_city, v_state,
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

revoke all on function public.checkout_create_order(uuid, text, text, text, text, text, jsonb, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.checkout_create_order(uuid, text, text, text, text, text, jsonb, text, text, text, text, text, text) to service_role;

-- ---------------------------------------------------------------- admin views
-- Same columns as 009, with the address joined up and its parts at the end for the CSV.
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
  nullif(concat_ws(', ', o.shipping_address_line1, o.shipping_address_line2,
    nullif(concat_ws(' ', o.shipping_postcode, o.shipping_city), ''), o.shipping_state), '') as delivery_address,
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
  (o.total_sen - o.shipping_sen)::numeric / 100 as sales_amount,
  o.shipping_address_line1 as address_line1,
  o.shipping_address_line2 as address_line2,
  o.shipping_postcode as postcode,
  o.shipping_city as city,
  o.shipping_state as state
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

commit;
