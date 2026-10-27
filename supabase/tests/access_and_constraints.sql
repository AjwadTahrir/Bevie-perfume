-- Run after all four migrations in Supabase SQL Editor (as postgres).
-- Success: no exception; everything, including the Auth fixture, is rolled back.
begin;

insert into public.products (id, name, family, is_active)
values ('schema-test-hidden', 'Hidden test product', 'fresh', false);
insert into public.inventory (product_id) values ('schema-test-hidden');

insert into public.committee_codes (code, committee_name)
values ('SCHEMA_TEST_CODE', 'Test committee');

-- Name + phone are sufficient: no email or shipping address provided.
insert into public.orders (
  guest_token_hash, checkout_request_id, customer_name, customer_phone,
  subtotal_sen, payment_due_at, reservation_expires_at
) values (
  encode(sha256(gen_random_uuid()::text::bytea), 'hex'), gen_random_uuid(),
  'Schema test buyer', '0123456789', 2000, now() + interval '1 day', now() + interval '1 day'
);

do $$
declare test_order uuid;
begin
  select id into strict test_order from public.orders where customer_name = 'Schema test buyer';
  if not exists (select 1 from public.orders where id = test_order and total_sen = 2000 and discount_sen = 0) then
    raise exception 'FAIL: no-code order total is incorrect';
  end if;
  update public.orders set committee_code = 'SCHEMA_TEST_CODE', committee_name = 'Test committee', discount_sen = 500
    where id = test_order;
  if not exists (select 1 from public.orders where id = test_order and total_sen = 1500 and discount_sen = 500) then
    raise exception 'FAIL: committee discount snapshot is incorrect';
  end if;
  update public.orders set subtotal_sen = 10500, discount_sen = 1500 where id = test_order;
  if not exists (select 1 from public.orders where id = test_order and total_sen = 9000) then
    raise exception 'FAIL: three bottles with code must cost RM90';
  end if;
  begin
    update public.orders set subtotal_sen = 499 where id = test_order;
    raise exception 'FAIL: discount exceeds order subtotal';
  exception when check_violation then null;
  end;
  begin
    update public.orders set fulfillment_status = 'distributed' where id = test_order;
    raise exception 'FAIL: unpaid order can be distributed';
  exception when check_violation then null;
  end;
end;
$$;

do $$
begin
  begin
    update public.products set is_purchasable = true where id = 'schema-test-hidden';
    raise exception 'FAIL: a product without price/size became purchasable';
  exception when check_violation then null;
  end;
  begin
    update public.inventory set stock_reserved = 1 where product_id = 'schema-test-hidden';
    raise exception 'FAIL: reserved stock exceeded physical stock';
  exception when check_violation then null;
  end;
end;
$$;

set local role anon;
do $$
begin
  if exists (select 1 from public.products where id = 'schema-test-hidden') then
    raise exception 'FAIL: anonymous visitor can see inactive products';
  end if;
  if not exists (select 1 from public.products where id = 'verdius') then
    raise exception 'FAIL: anonymous visitor cannot read seeded catalogue';
  end if;
  begin
    perform 1 from public.orders;
    raise exception 'FAIL: anonymous visitor has order read privileges';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.products set price_sen = 1 where id = 'verdius';
    raise exception 'FAIL: anonymous visitor can change prices';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Simulate a normal signed-in caller without creating a permanent user.
select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
set local role authenticated;
do $$
begin
  if public.is_shop_admin() then raise exception 'FAIL: ordinary user is an admin'; end if;
  if exists (select 1 from public.inventory) then
    raise exception 'FAIL: ordinary user can read inventory';
  end if;
  if exists (select 1 from public.orders where customer_name = 'Schema test buyer') then
    raise exception 'FAIL: ordinary user can read customer orders';
  end if;
  if exists (select 1 from public.committee_codes) then
    raise exception 'FAIL: ordinary user can enumerate committee codes';
  end if;
  if exists (select 1 from public.products where id = 'schema-test-hidden') then
    raise exception 'FAIL: ordinary user can read inactive products';
  end if;
  begin
    insert into public.shop_admins (user_id) values (auth.uid());
    raise exception 'FAIL: user can grant themselves admin';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.orders set payment_status = 'paid';
    raise exception 'FAIL: user has payment update privileges';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Temporary admin fixture. All changes roll back at the end.
insert into auth.users (id) values (current_setting('request.jwt.claim.sub')::uuid);
insert into public.shop_admins (user_id) values (current_setting('request.jwt.claim.sub')::uuid);
set local role authenticated;
do $$
begin
  if not public.is_shop_admin() then raise exception 'FAIL: admin membership not detected'; end if;
  if not exists (select 1 from public.orders where customer_name = 'Schema test buyer') then
    raise exception 'FAIL: admin cannot read customer orders';
  end if;
  if not exists (select 1 from public.committee_codes where code = 'SCHEMA_TEST_CODE') then
    raise exception 'FAIL: admin cannot read committee codes';
  end if;
  if not exists (select 1 from public.inventory where product_id = 'schema-test-hidden') then
    raise exception 'FAIL: admin cannot read inventory';
  end if;
  if not exists (select 1 from public.products where id = 'schema-test-hidden') then
    raise exception 'FAIL: admin cannot read inactive products';
  end if;
  begin
    update public.orders set payment_status = 'paid';
    raise exception 'FAIL: browser admin can bypass backend payment workflow';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
