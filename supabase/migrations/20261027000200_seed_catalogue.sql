-- Existing catalogue IDs stay identical to the React catalogue.
-- Prices/sizes are unknown: no product can be purchased yet.
begin;
insert into public.products (id, name, family, description, sort_order) values
  ('bayu', 'Bayu', 'fresh', 'A revitalizing breath of cool clarity. Verdius captures freshly washed skin, chilled green apple, and morning air with effortless polish.', 1),
  ('nirmala', 'Nirmala', 'woody', 'Precision, composure, command. Cool mint meets warm vanilla and timeless woods, crafted for ambition without compromise.', 2),
  ('senja', 'Senja', 'amber', 'An evocative blend of warmth and sophistication: rum, spices, rich tobacco, smooth leather, vanilla, and amber.', 3),
  ('samudera', 'Samudera', 'fresh', 'A surge of marine freshness. Sunlit citrus meets crystalline sea salt and airy waves: pure, invigorating, and clear.', 4),
  ('purnama', 'Purnama', 'fruity', 'A bold, magnetic fragrance where juicy dark fruits meet luxurious florals and smoldering base notes.', 5),
  ('ratna', 'Ratna', 'floral', 'Frozen petals and luminous freshness. Rose and lotus meet crystalline air in an icy floral haute couture composition.', 6),
  ('ranum', 'Ranum', 'fruity', 'A luscious celebration of whole frosted grapes and velvety sweetness with plush fruit and deep, indulgent warmth.', 7),
  ('seroja', 'Seroja', 'floral', 'A soft radiance of white florals and creamy vanilla blooming like morning light through a veil of pure serenity.', 8);

insert into public.inventory (product_id) select id from public.products;
commit;
