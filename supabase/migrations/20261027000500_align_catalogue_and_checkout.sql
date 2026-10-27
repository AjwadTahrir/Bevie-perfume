-- Run after 001-004 (on projects that already ran them, run only this file).
-- 1. Makes the Malay catalogue IDs from 002 (bayu, nirmala, ...) the purchasable
--    products. 004 priced verdius, tonvira, ..., IDs that 002 never created, so its
--    RM35 update matched no rows and nothing was purchasable. If an earlier draft of
--    this file renamed the products to those English IDs, they are renamed back.
-- 2. Makes committee_codes have both is_active and position, then adds the
--    transactional checkout functions the Edge Function calls
--    (supabase/functions/checkout). Only service_role may execute them.
begin;

-- ---------------------------------------------------------------- 1. catalogue IDs
do $$
declare
  m record;
begin
  for m in
    select * from (values
      ('verdius', 'bayu', 'Bayu', 'fresh', 1),
      ('tonvira', 'nirmala', 'Nirmala', 'woody', 2),
      ('chestnut-rush', 'senja', 'Senja', 'amber', 3),
      ('wavekiss', 'samudera', 'Samudera', 'fresh', 4),
      ('seductress', 'purnama', 'Purnama', 'fruity', 5),
      ('celestia-rose', 'ratna', 'Ratna', 'floral', 6),
      ('berry-tease', 'ranum', 'Ranum', 'fruity', 7),
      ('lily-valley', 'seroja', 'Seroja', 'floral', 8)
    ) as t(english_id, id, name, family, sort_order)
  loop
    if exists (select 1 from public.products where id = m.english_id)
       and not exists (select 1 from public.products where id = m.id) then
      -- Primary keys are referenced without ON UPDATE CASCADE: copy, repoint, remove.
      insert into public.products (id, name, family, description, price_sen, size, notes_top, notes_heart,
        notes_base, image_path, image_alt, is_active, is_purchasable, sort_order, track_stock)
      select m.id, m.name, family, description, price_sen, size, notes_top, notes_heart,
        notes_base, image_path, image_alt, is_active, false, sort_order, track_stock
      from public.products where id = m.english_id;
      update public.inventory set product_id = m.id where product_id = m.english_id;
      update public.order_items set product_id = m.id where product_id = m.english_id;
      delete from public.products where id = m.english_id;
    elsif not exists (select 1 from public.products where id = m.id) then
      insert into public.products (id, name, family, sort_order) values (m.id, m.name, m.family, m.sort_order);
      insert into public.inventory (product_id) values (m.id);
    end if;
  end loop;
end;
$$;

-- The seeded description still named the scent by its old name.
update public.products set description = replace(description, 'Verdius captures', 'Bayu captures') where id = 'bayu';

-- What 004 intended: RM35 each, purchasable, unlimited stock.
update public.products set price_sen = 3500, track_stock = false, is_purchasable = is_active
where id in ('bayu', 'nirmala', 'senja', 'samudera', 'purnama', 'ratna', 'ranum', 'seroja');

-- ---------------------------------------------------------------- 2. checkout functions

-- Some projects ran a variant of 003 whose committee_codes has a position column
-- instead of is_active. Add whichever is missing so every project has both.
alter table public.committee_codes add column if not exists is_active boolean not null default true;
alter table public.committee_codes add column if not exists position text;


-- Valid code -> true. Codes are never listed; the Edge Function rate-limits calls.
create or replace function public.checkout_code_is_active(p_code text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.committee_codes
    where code = upper(btrim(p_code)) and is_active
  );
$$;

-- Creates an order atomically and idempotently (same checkout_request_id -> same order).
-- p_items: [{"id": "bayu", "quantity": 2}, ...]. Prices come from public.products only.
create or replace function public.checkout_create_order(
  p_request_id uuid,
  p_guest_token_hash text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_note text,
  p_committee_code text,
  p_items jsonb
)
returns table (order_id uuid, order_number bigint, subtotal_sen bigint, discount_sen integer, total_sen bigint, committee_applied boolean)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_code text := nullif(upper(btrim(coalesce(p_committee_code, ''))), '');
  v_committee_name text;
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
    return query select v_order.id, v_order.order_number, v_order.subtotal_sen, v_order.discount_sen,
      v_order.total_sen, v_order.committee_code is not null;
    return;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty' using errcode = 'P0001';
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
    subtotal_sen, shipping_sen, discount_sen, committee_code, committee_name,
    payment_due_at, reservation_expires_at
  ) values (
    p_guest_token_hash, p_request_id, btrim(p_customer_name), btrim(p_customer_phone),
    nullif(btrim(coalesce(p_customer_note, '')), ''),
    v_subtotal, 0, case when v_code is null then 0 else 500 * v_quantity end, v_code, v_committee_name,
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
    'items', v_quantity, 'subtotal_sen', v_subtotal, 'committee_code', v_code));

  return query select v_order.id, v_order.order_number, v_order.subtotal_sen, v_order.discount_sen,
    v_order.total_sen, v_code is not null;
end;
$$;

-- Records a receipt the Edge Function has already uploaded and checked (type, size, bytes).
-- Proves ownership with the guest token hash; never trusts the order number.
create or replace function public.checkout_record_receipt(
  p_order_id uuid,
  p_guest_token_hash text,
  p_submission_id uuid,
  p_receipt_path text,
  p_content_type text,
  p_file_size_bytes integer,
  p_bank_reference text
)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders o
  where o.id = p_order_id and o.guest_token_hash = p_guest_token_hash
  for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0001';
  end if;
  if v_order.payment_status not in ('awaiting_payment', 'proof_rejected') then
    raise exception 'order is not awaiting payment' using errcode = 'P0001';
  end if;

  insert into public.payment_submissions (id, order_id, receipt_path, content_type, file_size_bytes, bank_reference)
  values (p_submission_id, p_order_id, p_receipt_path, p_content_type, p_file_size_bytes,
    nullif(btrim(coalesce(p_bank_reference, '')), ''));

  update public.orders set payment_status = 'awaiting_verification' where id = p_order_id;

  insert into public.order_events (order_id, event_type, details)
  values (p_order_id, 'receipt_submitted', jsonb_build_object('submission_id', p_submission_id));

  return 'awaiting_verification';
end;
$$;

revoke all on function public.checkout_code_is_active(text) from public, anon, authenticated;
revoke all on function public.checkout_create_order(uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.checkout_record_receipt(uuid, text, uuid, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.checkout_code_is_active(text) to service_role;
grant execute on function public.checkout_create_order(uuid, text, text, text, text, text, jsonb) to service_role;
grant execute on function public.checkout_record_receipt(uuid, text, uuid, text, text, integer, text) to service_role;

commit;
