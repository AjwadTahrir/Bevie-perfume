-- Run after 006. Safe to re-run.
-- The brand is now JETHA. Renames the campaign shown in the admin dashboard,
-- but only if it still has the old default: a name an admin already chose in
-- Settings is left alone. Nothing else changes.
begin;

alter table public.campaign_settings
  alter column campaign_name set default 'Titian Serantau Fundraiser';

update public.campaign_settings
   set campaign_name = 'Titian Serantau Fundraiser', updated_at = now()
 where id = 1 and campaign_name = 'Beavie Perfume Outbound Fundraiser';

commit;
