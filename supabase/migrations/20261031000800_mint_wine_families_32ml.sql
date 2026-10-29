-- Run after 007. Safe to re-run.
-- Keeps the catalogue in step with src/data/perfumes.js: Nirmala is now Mint,
-- Senja is now Wine, and every bottle is 32 ml. Past orders keep the size
-- they were placed with.
begin;

alter table public.products drop constraint if exists products_family_check;
alter table public.products add constraint products_family_check
  check (family in ('floral', 'fruity', 'woody', 'fresh', 'amber', 'mint', 'wine'));

update public.products set family = 'mint' where id = 'nirmala';
update public.products set family = 'wine' where id = 'senja';
update public.products set size = '32 ml';

commit;
