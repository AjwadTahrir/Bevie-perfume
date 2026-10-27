-- Run after 001-005. Safe to re-run.
-- Backs the admin dashboard (/admin, src/admin) on this project's existing
-- shop tables. It only ADDS: one settings table, read-only views shaped the
-- way the dashboard reads them, and admin-only functions for the actions.
-- Checkout tables, functions and constraints are not changed.
--
-- Vocabulary: the dashboard speaks in its own statuses; the views translate.
--   orders.payment_status      dashboard payment_status
--     awaiting_payment          awaiting_payment
--     awaiting_verification     submitted
--     paid                      verified
--     proof_rejected            rejected
--     refunded                  refunded
--   orders.fulfillment_status  dashboard order_status
--     distributed               fulfilled
--     cancelled                 cancelled
--     anything else             pending
-- An AJK member is a row of committee_codes; the member id is its code.
-- Admins are the users in shop_admins (is_shop_admin()).
begin;

-- ---------------------------------------------------------------- campaign settings
create table if not exists public.campaign_settings (
  id smallint primary key default 1 check (id = 1),
  campaign_name text not null default 'Beavie Perfume Outbound Fundraiser',
  -- Display only: checkout charges products.price_sen and RM5 off per bottle with
  -- a committee code (migrations 004-005). Shown read-only in the dashboard.
  selling_price numeric(10, 2) not null default 35,
  discounted_price numeric(10, 2) not null default 30,
  profit_per_bottle numeric(10, 2) not null default 10 check (profit_per_bottle >= 0),
  campaign_target integer not null default 180 check (campaign_target > 0),
  member_target integer not null default 5 check (member_target > 0),
  starts_on date,
  ends_on date,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  check (starts_on is null or ends_on is null or starts_on <= ends_on)
);
insert into public.campaign_settings (id) values (1) on conflict (id) do nothing;

alter table public.campaign_settings enable row level security;
revoke all on public.campaign_settings from anon, authenticated;
grant select on public.campaign_settings to authenticated;
drop policy if exists campaign_settings_admin_read on public.campaign_settings;
create policy campaign_settings_admin_read on public.campaign_settings
  for select to authenticated using ((select public.is_shop_admin()));

-- ---------------------------------------------------------------- helpers

-- Raises not_authorized unless the caller is a shop admin; returns the label
-- (their email) recorded against every change they make.
create or replace function public.require_shop_admin()
returns text
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_label text;
begin
  if not public.is_shop_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  select coalesce(u.email, 'admin') into v_label from auth.users u where u.id = auth.uid();
  return coalesce(v_label, 'admin');
end;
$$;

create or replace function public.dashboard_payment_status(p text)
returns text language sql immutable set search_path = '' as $$
  select case p
    when 'awaiting_verification' then 'submitted'
    when 'paid' then 'verified'
    when 'proof_rejected' then 'rejected'
    else p end
$$;

create or replace function public.dashboard_order_status(p text)
returns text language sql immutable set search_path = '' as $$
  select case p when 'distributed' then 'fulfilled' when 'cancelled' then 'cancelled' else 'pending' end
$$;

-- ---------------------------------------------------------------- read views
-- security_invoker: each view runs with the caller's rights, so the existing
-- admin-only RLS policies on orders, order_items, payment_submissions,
-- order_events and committee_codes still decide who sees anything.

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
  null::text as delivery_address,
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
  end as display_status
from public.orders o
cross join lateral (
  select greatest(coalesce(sum(i.quantity), 0), 1)::integer as quantity
  from public.order_items i where i.order_id = o.id
) q
left join public.campaign_settings s on s.id = 1;

create or replace view public.admin_orders
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

create or replace view public.admin_order_items
with (security_invoker = true)
as
select i.id, i.order_id, i.product_id as perfume_id, i.product_name as perfume_name, i.quantity,
  i.unit_price_sen::numeric / 100 as unit_price
from public.order_items i;

create or replace view public.admin_payment_submissions
with (security_invoker = true)
as
select ps.id, ps.order_id, ps.bank_reference as transfer_reference, null::date as paid_on,
  ps.receipt_path as proof_path, ps.content_type as proof_mime, ps.file_size_bytes as proof_size,
  null::text as proof_original_name, ps.status, ps.rejection_reason, ps.submitted_at as created_at
from public.payment_submissions ps;

create or replace view public.order_status_history
with (security_invoker = true)
as
select
  e.id, e.order_id,
  case e.event_type when 'order_created' then 'created' when 'receipt_submitted' then 'payment_submitted' else e.event_type end as action,
  e.details ->> 'from_payment_status' as from_payment_status,
  e.details ->> 'to_payment_status' as to_payment_status,
  e.details ->> 'from_order_status' as from_order_status,
  e.details ->> 'to_order_status' as to_order_status,
  e.details ->> 'note' as note,
  e.actor_id,
  coalesce(e.details ->> 'actor_label', case when e.actor_id is null then 'Customer' else 'admin' end) as actor_label,
  e.created_at
from public.order_events e
where e.event_type <> 'note';

create or replace view public.order_notes
with (security_invoker = true)
as
select e.id, e.order_id, e.details ->> 'body' as body, e.actor_id as author_id,
  coalesce(e.details ->> 'actor_label', 'admin') as author_label, e.created_at
from public.order_events e
where e.event_type = 'note';

revoke all on public.order_facts, public.admin_orders, public.admin_order_items, public.admin_payment_submissions,
  public.order_status_history, public.order_notes from anon;
grant select on public.order_facts, public.admin_orders, public.admin_order_items, public.admin_payment_submissions,
  public.order_status_history, public.order_notes to authenticated;

-- ---------------------------------------------------------------- admin actions
-- Each locks the order row (two admins clicking at once are serialised), checks
-- the transition, updates the order and its receipt, and records an
-- order_events entry with the old and new statuses, all in one transaction.

create or replace function public.admin_log_event(
  p_order public.orders, p_event text, p_payment text, p_fulfillment text, p_note text, p_label text
) returns void
language sql volatile security definer
set search_path = ''
as $$
  insert into public.order_events (order_id, actor_id, event_type, details)
  values (p_order.id, auth.uid(), p_event, jsonb_strip_nulls(jsonb_build_object(
    'from_payment_status', public.dashboard_payment_status(p_order.payment_status),
    'to_payment_status', public.dashboard_payment_status(coalesce(p_payment, p_order.payment_status)),
    'from_order_status', public.dashboard_order_status(p_order.fulfillment_status),
    'to_order_status', public.dashboard_order_status(coalesce(p_fulfillment, p_order.fulfillment_status)),
    'note', nullif(btrim(coalesce(p_note, '')), ''),
    'actor_label', p_label)));
$$;

create or replace function public.admin_verify_payment(p_order_id uuid, p_note text default null)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_label text := public.require_shop_admin();
  o public.orders;
begin
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.payment_status = 'paid' then raise exception 'already_verified'; end if;
  if o.payment_status = 'refunded' or o.fulfillment_status = 'cancelled' then raise exception 'invalid_transition'; end if;
  perform public.admin_log_event(o, 'payment_verified', 'paid', null, p_note, v_label);
  update public.payment_submissions
     set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
   where order_id = o.id and status = 'pending_review';
  update public.orders set payment_status = 'paid', paid_at = now() where id = o.id returning * into o;
  return to_jsonb(o);
end;
$$;

create or replace function public.admin_reject_payment(p_order_id uuid, p_reason text)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_label text := public.require_shop_admin();
  o public.orders;
begin
  if length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.payment_status not in ('awaiting_payment', 'awaiting_verification') or o.fulfillment_status = 'cancelled' then
    raise exception 'invalid_transition';
  end if;
  perform public.admin_log_event(o, 'payment_rejected', 'proof_rejected', null, p_reason, v_label);
  update public.payment_submissions
     set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), rejection_reason = btrim(p_reason)
   where order_id = o.id and status = 'pending_review';
  -- The customer can upload a new receipt for a rejected payment (checkout_record_receipt).
  update public.orders set payment_status = 'proof_rejected' where id = o.id returning * into o;
  return to_jsonb(o);
end;
$$;

create or replace function public.admin_cancel_order(p_order_id uuid, p_reason text)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_label text := public.require_shop_admin();
  o public.orders;
begin
  if length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.fulfillment_status = 'cancelled' then raise exception 'invalid_transition'; end if;
  -- Money has been received: it must be refunded instead.
  if o.payment_status = 'paid' then raise exception 'refund_required'; end if;
  perform public.admin_log_event(o, 'order_cancelled', null, 'cancelled', p_reason, v_label);
  update public.orders set fulfillment_status = 'cancelled' where id = o.id returning * into o;
  return to_jsonb(o);
end;
$$;

create or replace function public.admin_refund_order(p_order_id uuid, p_reason text)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_label text := public.require_shop_admin();
  o public.orders;
begin
  if length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.payment_status <> 'paid' then raise exception 'invalid_transition'; end if;
  perform public.admin_log_event(o, 'refunded', 'refunded', 'cancelled', p_reason, v_label);
  update public.orders set payment_status = 'refunded', fulfillment_status = 'cancelled' where id = o.id returning * into o;
  return to_jsonb(o);
end;
$$;

create or replace function public.admin_mark_fulfilled(p_order_id uuid)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_label text := public.require_shop_admin();
  o public.orders;
begin
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.payment_status <> 'paid' or o.fulfillment_status in ('distributed', 'cancelled') then raise exception 'invalid_transition'; end if;
  perform public.admin_log_event(o, 'fulfilled', null, 'distributed', null, v_label);
  update public.orders set fulfillment_status = 'distributed', distributed_at = now() where id = o.id returning * into o;
  return to_jsonb(o);
end;
$$;

create or replace function public.admin_add_note(p_order_id uuid, p_body text)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_label text := public.require_shop_admin();
  e public.order_events;
begin
  if length(btrim(coalesce(p_body, ''))) not between 1 and 2000 then raise exception 'note_length'; end if;
  if not exists (select 1 from public.orders where id = p_order_id) then raise exception 'order_not_found'; end if;
  insert into public.order_events (order_id, actor_id, event_type, details)
  values (p_order_id, auth.uid(), 'note', jsonb_build_object('body', btrim(p_body), 'actor_label', v_label))
  returning * into e;
  return to_jsonb(e);
end;
$$;

create or replace function public.admin_set_member_active(p_member_id text, p_active boolean)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_label text := public.require_shop_admin();
  c public.committee_codes;
begin
  update public.committee_codes set is_active = p_active where code = p_member_id returning * into c;
  if c.code is null then raise exception 'member_not_found'; end if;
  return to_jsonb(c);
end;
$$;

-- Prices are not editable here (see campaign_settings); everything else is.
create or replace function public.admin_update_settings(p jsonb)
returns public.campaign_settings
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_label text := public.require_shop_admin();
  s public.campaign_settings;
begin
  if length(btrim(coalesce(p ->> 'campaign_name', ''))) not between 3 and 120 then raise exception 'invalid_campaign_name'; end if;
  if coalesce((p ->> 'profit_per_bottle')::numeric, -1) not between 0 and 10000 then raise exception 'invalid_price'; end if;
  if coalesce((p ->> 'campaign_target')::integer, 0) not between 1 and 100000
     or coalesce((p ->> 'member_target')::integer, 0) not between 1 and 10000 then
    raise exception 'invalid_target';
  end if;
  if nullif(p ->> 'starts_on', '')::date > nullif(p ->> 'ends_on', '')::date then raise exception 'invalid_dates'; end if;
  update public.campaign_settings set
    campaign_name = btrim(p ->> 'campaign_name'),
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

-- ---------------------------------------------------------------- reports
-- Only verified (paid, not cancelled) orders count as sales, towards targets,
-- revenue and profit. Dates filter on the order's creation time.

drop function if exists public.admin_member_performance(timestamptz, timestamptz);
create function public.admin_member_performance(p_from timestamptz default null, p_to timestamptz default null)
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
      coalesce(sum(f.final_amount) filter (where f.is_verified), 0) as rev,
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

drop function if exists public.admin_sales_timeseries(timestamptz, timestamptz, text);
create function public.admin_sales_timeseries(
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

-- ---------------------------------------------------------------- privileges
revoke all on function
  public.require_shop_admin(), public.dashboard_payment_status(text), public.dashboard_order_status(text),
  public.admin_log_event(public.orders, text, text, text, text, text),
  public.admin_verify_payment(uuid, text), public.admin_reject_payment(uuid, text),
  public.admin_cancel_order(uuid, text), public.admin_refund_order(uuid, text),
  public.admin_mark_fulfilled(uuid), public.admin_add_note(uuid, text),
  public.admin_set_member_active(text, boolean), public.admin_update_settings(jsonb),
  public.admin_member_performance(timestamptz, timestamptz), public.admin_dashboard(timestamptz, timestamptz),
  public.admin_sales_timeseries(timestamptz, timestamptz, text)
from public, anon;
-- The views call these two status helpers with the caller's rights.
grant execute on function public.dashboard_payment_status(text), public.dashboard_order_status(text) to authenticated;
-- Every admin_* function checks is_shop_admin() itself before doing anything.
grant execute on function
  public.admin_verify_payment(uuid, text), public.admin_reject_payment(uuid, text),
  public.admin_cancel_order(uuid, text), public.admin_refund_order(uuid, text),
  public.admin_mark_fulfilled(uuid), public.admin_add_note(uuid, text),
  public.admin_set_member_active(text, boolean), public.admin_update_settings(jsonb),
  public.admin_member_performance(timestamptz, timestamptz), public.admin_dashboard(timestamptz, timestamptz),
  public.admin_sales_timeseries(timestamptz, timestamptz, text)
to authenticated;

-- ---------------------------------------------------------------- receipts
-- Admins may read receipts (and so create short-lived signed links to them).
-- There is still no upload policy: only the checkout function stores receipts.
drop policy if exists payment_receipts_admin_read on storage.objects;
create policy payment_receipts_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'payment_receipts' and (select public.is_shop_admin()));

-- ---------------------------------------------------------------- live updates
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

commit;
