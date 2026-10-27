-- Apply after 001 and 002, including on projects that already ran them.
-- Preserve legacy contact/shipping data; new checkout needs name and phone only.
begin;

create table public.committee_codes (
  code text primary key check (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
  committee_name text not null check (length(trim(committee_name)) between 1 and 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.committee_codes enable row level security;
revoke all on public.committee_codes from anon, authenticated;
grant select on public.committee_codes to authenticated;
grant all on public.committee_codes to service_role;
create policy committee_codes_admin_read on public.committee_codes
  for select to authenticated using ((select public.is_shop_admin()));
create trigger committee_codes_updated_at before update on public.committee_codes
  for each row execute function public.set_shop_updated_at();

alter table public.orders
  alter column customer_email drop not null,
  alter column shipping_address_line1 drop not null,
  alter column shipping_city drop not null,
  alter column shipping_state drop not null,
  alter column shipping_postcode drop not null,
  alter column shipping_sen set default 0,
  add column committee_code text references public.committee_codes(code) on update restrict on delete restrict,
  -- Snapshot the distributor name so changing their name does not rewrite history.
  add column committee_name text,
  add column discount_sen integer generated always as (
    case when committee_code is null then 0 else 500 end
  ) stored,
  add column distributed_at timestamptz,
  add constraint orders_committee_snapshot check (
    (committee_code is null and committee_name is null)
    or (committee_code is not null and committee_name is not null and length(trim(committee_name)) > 0)
  ),
  add constraint orders_discount_within_subtotal check (subtotal_sen >= discount_sen);

-- Replace the generated total; no stored customer data is removed.
alter table public.orders drop column total_sen;
alter table public.orders add column total_sen bigint
  -- PostgreSQL generated columns cannot reference another generated column.
  generated always as (
    subtotal_sen + shipping_sen - case when committee_code is null then 0 else 500 end
  ) stored;

-- Replace the original inline fulfilment checks without relying on auto-generated names.
do $$
declare constraint_row record;
begin
  for constraint_row in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%fulfillment_status%'
  loop
    execute format('alter table public.orders drop constraint %I', constraint_row.conname);
  end loop;
end;
$$;

update public.orders set fulfillment_status = case fulfillment_status
  when 'shipped' then 'ready_for_distribution'
  when 'delivered' then 'distributed'
  else fulfillment_status end;

alter table public.orders
  add constraint orders_distribution_status check (
    fulfillment_status in ('unfulfilled', 'processing', 'ready_for_distribution', 'distributed', 'cancelled')
  ),
  add constraint orders_distribution_requires_payment check (
    fulfillment_status not in ('processing', 'ready_for_distribution', 'distributed')
    or payment_status in ('paid', 'refunded')
  );
create index orders_committee_code on public.orders(committee_code);

comment on column public.orders.committee_code is
  'Optional discount attribution. Backend must normalize and validate an active code before inserting. Code remains valid historically after deactivation.';
comment on column public.orders.discount_sen is
  'RM5 once per order with a committee code, not per bottle. Subtotal must be at least RM5.';
comment on column public.orders.shipping_sen is
  'Legacy shipping support. New committee-distribution checkout must use zero.';
comment on column public.orders.committee_name is
  'Snapshot of code owner. Without a code, admin assigns distribution operationally; no buyer address is required.';
commit;
