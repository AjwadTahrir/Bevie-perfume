-- Run after 011. Safe to re-run.
-- Puts the two Unisex scents on sale, same terms as the other eight: RM35, unlimited stock,
-- purchasable. The committee (referral) code discount needs nothing here: checkout_create_order
-- takes RM5 (500 sen) off every bottle in an order with a valid code, whatever the scent.
-- IDs match src/data/perfumes.js (unisex-1 = Mango Dolce, unisex-2 = Velvet Peach).
begin;

insert into public.products (id, name, family, description, price_sen, size, notes_top, notes_heart, notes_base,
  is_active, is_purchasable, sort_order, track_stock)
values
  ('unisex-1', 'Mango Dolce', 'fruity',
   'A unisex island escape: juicy mango, pink guava and hibiscus over a Mai Tai and sea breeze, settling on warm sandalwood and musk.',
   3500, '32 ml', '{Mango,Guava,Hibiscus}', '{"Mai Tai Cocktail","Sea Notes",Driftwood}', '{Ylang-Ylang,Sandalwood,Musk}',
   true, true, 9, false),
  ('unisex-2', 'Velvet Peach', 'floral',
   'Soft unisex luxury: velvety peach and mandarin over creamy tuberose and orange blossom, wrapped in vanilla bean and tonka.',
   3500, '32 ml', '{Peach,Mandarin}', '{Tuberose,"Ylang Ylang","Orange Blossom"}', '{"Vanilla Bean",Musk,Sandalwood,"Tonka Bean",Cedarwood}',
   true, true, 10, false)
on conflict (id) do update set
  name = excluded.name, family = excluded.family, description = excluded.description,
  price_sen = excluded.price_sen, size = excluded.size, notes_top = excluded.notes_top,
  notes_heart = excluded.notes_heart, notes_base = excluded.notes_base,
  is_active = true, is_purchasable = true, sort_order = excluded.sort_order, track_stock = false;

insert into public.inventory (product_id) values ('unisex-1'), ('unisex-2') on conflict (product_id) do nothing;

commit;

-- Check: both rows should show 3500, purchasable, active.
-- select id, name, price_sen, is_purchasable, is_active from public.products where id like 'unisex-%';
