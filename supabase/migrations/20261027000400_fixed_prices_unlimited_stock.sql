-- RM35 per bottle; an active committee code gives RM5 off EACH bottle.
begin;

alter table public.products add column track_stock boolean not null default false;

-- Size has not been supplied and must not prevent purchasing.
do $$
declare constraint_row record;
begin
  for constraint_row in
    select conname from pg_constraint
    where conrelid = 'public.products'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%is_purchasable%'
  loop
    execute format('alter table public.products drop constraint %I', constraint_row.conname);
  end loop;
end;
$$;
alter table public.products add constraint products_purchasable_requires_price
  check (not is_purchasable or (is_active and price_sen is not null));
alter table public.order_items alter column product_size drop not null;

update public.products set price_sen = 3500, track_stock = false,
  is_purchasable = is_active
where id in ('verdius', 'tonvira', 'chestnut-rush', 'wavekiss',
  'seductress', 'celestia-rose', 'berry-tease', 'lily-valley');

-- Preserve historical discounts. New checkout calculates 500 * total quantity
-- server-side and stores it as a purchase-time snapshot in the order.
alter table public.orders alter column discount_sen drop expression;
alter table public.orders alter column discount_sen set default 0;
alter table public.orders alter column discount_sen set not null;
alter table public.orders add constraint orders_committee_discount check (
  (committee_code is null and discount_sen = 0)
  or (committee_code is not null and discount_sen >= 500 and discount_sen % 500 = 0)
);
alter table public.orders drop column total_sen;
alter table public.orders add column total_sen bigint
  generated always as (subtotal_sen + shipping_sen - discount_sen) stored;
alter table public.orders alter column reservation_expires_at drop not null;

comment on column public.products.track_stock is
  'False means unlimited availability: backend must skip inventory checks, reservations and decrements.';
comment on column public.orders.discount_sen is
  'Purchase-time discount snapshot. New checkout must calculate 500 sen per bottle for an active committee code, otherwise zero, in the same transaction as order_items.';
comment on column public.orders.reservation_expires_at is
  'Nullable: unlimited-stock orders do not require a stock reservation.';
commit;
