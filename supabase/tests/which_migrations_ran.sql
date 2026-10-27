-- Which migrations has this project already run? Paste into Supabase SQL Editor.
-- Read-only. Each row says whether that migration's changes are present.
-- Then run every migration marked "not yet", in order (005 is always safe to run).
with checks as (
  select
    to_regclass('public.products') is not null as products_table,
    to_regclass('public.committee_codes') is not null as committee_table,
    exists (select 1 from information_schema.columns
            where table_schema = 'public' and table_name = 'products' and column_name = 'track_stock') as track_stock_col,
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname = 'checkout_create_order') as checkout_fn
),
data as (
  select c.*,
    -- Only reads the products table when it exists, so this never errors.
    case when c.products_table then (xpath('//n/text()',
      query_to_xml($q$select count(*) as n from public.products
                     where id in ('bayu','nirmala','senja','samudera','purnama','ratna','ranum','seroja')$q$, false, false, '')))[1]::text::int
    end as malay_products,
    case when c.products_table then (xpath('//n/text()',
      query_to_xml($q$select count(*) as n from public.products
                     where id in ('bayu','nirmala','senja','samudera','purnama','ratna','ranum','seroja')
                       and price_sen = 3500 and is_purchasable$q$, false, false, '')))[1]::text::int
    end as malay_priced,
    case when c.products_table then (xpath('//n/text()',
      query_to_xml($q$select count(*) as n from public.products
                     where id in ('verdius','tonvira','chestnut-rush','wavekiss','seductress','celestia-rose','berry-tease','lily-valley')$q$, false, false, '')))[1]::text::int
    end as english_products,
    case when c.committee_table then (xpath('//n/text()',
      query_to_xml($q$select count(*) as n from public.committee_codes$q$, false, false, '')))[1]::text::int
    end as committee_codes
  from checks c
)
select step, status from data, lateral (values
  ('001 create_shop_tables',            case when products_table then 'done' else 'not yet' end),
  ('002 seed_catalogue',                case when coalesce(malay_products, 0) + coalesce(english_products, 0) >= 8 then 'done' else 'not yet' end),
  ('003 committee_distribution',        case when committee_table then 'done' else 'not yet' end),
  ('004 fixed_prices_unlimited_stock',  case when track_stock_col then 'done' else 'not yet' end),
  ('005 align_catalogue_and_checkout',  case
      when checkout_fn and malay_priced = 8 and coalesce(english_products, 0) = 0 then 'done'
      when checkout_fn and coalesce(english_products, 0) > 0 then 'older draft ran: run 005 again'
      else 'not yet' end),
  ('committee codes loaded',            coalesce(committee_codes, 0)::text || ' codes'),
  ('receipts bucket',                   case when exists (select 1 from storage.buckets where id = 'payment_receipts')
                                          then 'created' else 'not created yet' end)
) as t(step, status);
