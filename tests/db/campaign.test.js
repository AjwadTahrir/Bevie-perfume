import { beforeEach, describe, expect, it } from 'vitest'
import { as, createAdmin, createDb, placeOrder, rpc, seed, submitPayment, tokenHash } from './harness'
import { ajkMembers } from '../fixtures/ajkMembers'

let db
let admin

beforeEach(async () => {
  db = await createDb()
  admin = await createAdmin(db)
})

const memberByCode = async (code) =>
  (await rpc(db, admin, 'select * from public.admin_member_performance() where promo_code = $1', [code])).rows[0]
const dashboard = async () => (await rpc(db, admin, 'select public.admin_dashboard() d')).rows[0].d
const verify = (order) => rpc(db, admin, 'select public.admin_verify_payment($1)', [order.order_id])
const bottles = (n, id = 'verdius') => [{ perfume_id: id, perfume_name: id, quantity: n }]
const errorOf = async (promise) => {
  try {
    await promise
  } catch (e) {
    return e.message
  }
  return null
}

describe('AJK seed', () => {
  it('seeds all 36 members with the exact names, roles and codes', async () => {
    const { rows } = await db.query('select member_no, committee_role, full_name, promo_code, is_active from public.ajk_members order by member_no')
    expect(rows).toHaveLength(36)
    expect(rows.map((r) => [r.member_no, r.committee_role, r.full_name, r.promo_code])).toEqual(ajkMembers)
    expect(rows.every((r) => r.is_active)).toBe(true)
  })

  it('can be re-run without duplicates and keeps member ids stable', async () => {
    const before = (await db.query('select id, member_no from public.ajk_members order by member_no')).rows
    await db.exec(seed())
    await db.exec(seed())
    const after = (await db.query('select id, member_no from public.ajk_members order by member_no')).rows
    expect(after).toEqual(before)
  })

  it('rejects a duplicate promo code', async () => {
    const msg = await errorOf(db.query(`insert into public.ajk_members (member_no, committee_role, full_name, promo_code) values (99, 'X', 'Y', 'DMT9T')`))
    expect(msg).toMatch(/duplicate key/)
  })

  it('maps every code to its member through the server lookup', async () => {
    for (const [, role, name, code] of ajkMembers) {
      const { rows } = await as(db, 'service_role', null, (tx) => tx.query('select * from public.lookup_promo_code($1)', [code.toLowerCase()]))
      expect(rows[0]).toMatchObject({ full_name: name, committee_role: role, promo_code: code })
    }
  })
})

describe('pricing', () => {
  it.each([
    [1, 'DMT9T', 35, 5, 30],
    [1, null, 35, 0, 35],
    [3, 'X69D7', 105, 15, 90],
    [3, null, 105, 0, 105],
  ])('%i bottle(s), code %s', async (qty, promo, subtotal, discount, final) => {
    const o = await placeOrder(db, { items: bottles(qty), promo })
    expect(Number(o.original_subtotal)).toBe(subtotal)
    expect(Number(o.discount_total)).toBe(discount)
    expect(Number(o.final_amount)).toBe(final)
  })

  it('sums quantities across several perfumes in one order', async () => {
    const o = await placeOrder(db, { items: [...bottles(2, 'verdius'), ...bottles(1, 'tonvira')], promo: 'H7WWU' })
    expect(o.quantity).toBe(3)
    expect(Number(o.final_amount)).toBe(90)
    const items = await db.query('select perfume_id, quantity from public.order_items where order_id = $1 order by id', [o.order_id])
    expect(items.rows).toEqual([{ perfume_id: 'verdius', quantity: 2 }, { perfume_id: 'tonvira', quantity: 1 }])
  })

  it('normalises case and spaces in codes', async () => {
    const o = await placeOrder(db, { promo: ' dmt 9t ' })
    expect(o.promo_code).toBe('DMT9T')
    expect(o.member_name).toBe('NUR AMIRAH BINTI JUNAIDI')
  })

  it('refuses invalid and inactive codes instead of silently charging full price', async () => {
    expect(await errorOf(placeOrder(db, { promo: 'ZZZZZ' }))).toBe('invalid_promo_code')
    await db.query(`update public.ajk_members set is_active = false where promo_code = 'DMT9T'`)
    expect(await errorOf(placeOrder(db, { promo: 'DMT9T' }))).toBe('invalid_promo_code')
  })

  it('keeps historical amounts when settings change later', async () => {
    const old = await placeOrder(db, { items: bottles(2), promo: 'DMT9T' })
    await rpc(db, admin, 'select public.admin_update_settings($1)', [
      { campaign_name: 'Changed', selling_price: 40, discounted_price: 32, profit_per_bottle: 12, campaign_target: 200, member_target: 6 },
    ])
    const fresh = await placeOrder(db, { items: bottles(2), promo: 'DMT9T' })
    const { rows } = await db.query('select final_amount, profit_per_bottle from public.orders where id = $1', [old.order_id])
    expect(Number(rows[0].final_amount)).toBe(60)
    expect(Number(rows[0].profit_per_bottle)).toBe(10)
    expect(Number(fresh.final_amount)).toBe(64)
  })

  it('validates settings on the server', async () => {
    const bad = { campaign_name: 'Camp', selling_price: 30, discounted_price: 35, profit_per_bottle: 10, campaign_target: 180, member_target: 5 }
    expect(await errorOf(rpc(db, admin, 'select public.admin_update_settings($1)', [bad]))).toBe('discount_above_price')
  })

  it('issues unique sequential references in the BEV-YYYY-NNNN format', async () => {
    const a = await placeOrder(db)
    const b = await placeOrder(db)
    expect(a.reference).toMatch(/^BEV-\d{4}-0001$/)
    expect(b.reference).toMatch(/^BEV-\d{4}-0002$/)
  })

  it('rejects malformed customer details and quantities', async () => {
    expect(await errorOf(placeOrder(db, { items: bottles(0) }))).toBe('invalid_items')
    expect(await errorOf(placeOrder(db, { items: [] }))).toBe('invalid_items')
  })
})

describe('sales attribution and lifecycle', () => {
  it('attributes five verified bottles to the right member and marks the target reached', async () => {
    const o1 = await placeOrder(db, { items: bottles(3), promo: '6W7SP' })
    const o2 = await placeOrder(db, { items: bottles(2), promo: '6W7SP' })
    await submitPayment(db, o1)
    await verify(o1)
    await verify(o2)
    const m = await memberByCode('6W7SP')
    expect(m).toMatchObject({ verified_bottles: 5, verified_orders: 2, remaining: 0, status: 'target_reached', rank: 1 })
    expect(Number(m.revenue)).toBe(150)
    expect(Number(m.profit)).toBe(50)
    expect(Number(m.discounts)).toBe(25)
  })

  it('does not count pending orders as sales', async () => {
    const o = await placeOrder(db, { items: bottles(4), promo: 'DMT9T' })
    await submitPayment(db, o)
    const m = await memberByCode('DMT9T')
    expect(m).toMatchObject({ verified_bottles: 0, pending_bottles: 4, status: 'not_started' })
    const d = await dashboard()
    expect(d.verified.bottles).toBe(0)
    expect(d.pending).toMatchObject({ bottles: 4, amount: 120, submitted_orders: 1 })
  })

  it('refuses a second verification and never double counts', async () => {
    const o = await placeOrder(db, { items: bottles(2), promo: 'DMT9T' })
    await verify(o)
    expect(await errorOf(verify(o))).toBe('already_verified')
    const d = await dashboard()
    expect(d.verified).toMatchObject({ bottles: 2, orders: 1, net: 60, profit: 20 })
    const history = await db.query(`select count(*)::int n from public.order_status_history where order_id = $1 and action = 'payment_verified'`, [o.order_id])
    expect(history.rows[0].n).toBe(1)
  })

  it('requires a refund (not a cancel) for verified orders, and a refund removes the sale', async () => {
    const o = await placeOrder(db, { items: bottles(3), promo: 'DMT9T' })
    await verify(o)
    expect(await errorOf(rpc(db, admin, 'select public.admin_cancel_order($1, $2)', [o.order_id, 'Changed mind']))).toBe('refund_required')
    await rpc(db, admin, 'select public.admin_refund_order($1, $2)', [o.order_id, 'Customer returned item'])
    const m = await memberByCode('DMT9T')
    expect(m.verified_bottles).toBe(0)
    const d = await dashboard()
    expect(d.verified.bottles).toBe(0)
    expect(d.status_counts.refunded).toBe(1)
  })

  it('cancelled and rejected orders count neither as sales nor as pending', async () => {
    const a = await placeOrder(db, { items: bottles(2), promo: 'DMT9T' })
    const b = await placeOrder(db, { items: bottles(1), promo: 'DMT9T' })
    await submitPayment(db, b)
    await rpc(db, admin, 'select public.admin_cancel_order($1, $2)', [a.order_id, 'Duplicate order'])
    expect(await errorOf(rpc(db, admin, 'select public.admin_reject_payment($1, $2)', [b.order_id, '']))).toBe('reason_required')
    await rpc(db, admin, 'select public.admin_reject_payment($1, $2)', [b.order_id, 'Amount does not match'])
    const m = await memberByCode('DMT9T')
    expect(m).toMatchObject({ verified_bottles: 0, pending_bottles: 0, total_orders: 2 })
    const d = await dashboard()
    expect(d.pending.orders).toBe(0)
    expect(d.status_counts).toMatchObject({ cancelled: 1, rejected: 1 })
  })

  it('re-ranks the leaderboard as verified sales change, sharing ranks on ties', async () => {
    const a = await placeOrder(db, { items: bottles(2), promo: 'DMT9T' })
    const b = await placeOrder(db, { items: bottles(2), promo: 'X69D7' })
    const c = await placeOrder(db, { items: bottles(1), promo: 'H7WWU' })
    await verify(a)
    await verify(b)
    await verify(c)
    expect((await memberByCode('DMT9T')).rank).toBe(1)
    expect((await memberByCode('X69D7')).rank).toBe(1)
    expect((await memberByCode('H7WWU')).rank).toBe(3)

    const extra = await placeOrder(db, { items: bottles(3), promo: 'H7WWU' })
    await verify(extra)
    expect((await memberByCode('H7WWU')).rank).toBe(1)
    expect((await memberByCode('DMT9T')).rank).toBe(2)

    await rpc(db, admin, 'select public.admin_refund_order($1, $2)', [extra.order_id, 'Refund test'])
    expect((await memberByCode('H7WWU')).rank).toBe(3)
  })

  it('dashboard totals match the underlying orders, including orders without a code', async () => {
    const orders = [
      await placeOrder(db, { items: bottles(3), promo: 'DMT9T' }),
      await placeOrder(db, { items: bottles(1) }),
      await placeOrder(db, { items: bottles(2), promo: 'X69D7' }),
      await placeOrder(db, { items: bottles(5) }), // stays pending
    ]
    for (const o of orders.slice(0, 3)) await verify(o)
    const d = await dashboard()
    // 3x30 + 1x35 + 2x30 = 185, gross 6x35 = 210, discounts 25, profit 6x10
    expect(d.verified).toMatchObject({ orders: 3, bottles: 6, gross: 210, discounts: 25, net: 185, profit: 60, promo_orders: 2, direct_orders: 1, direct_bottles: 1 })
    expect(d.pending).toMatchObject({ orders: 1, bottles: 5, amount: 175 })
    expect(d.target).toMatchObject({ campaign_target: 180, remaining: 174, completion_pct: 3.3 })
    expect(d.members).toMatchObject({ total: 36, reached: 0, in_progress: 2, not_started: 34 })

    const sum = await db.query('select sum(final_amount)::numeric s from public.orders where payment_status = $1', ['verified'])
    expect(Number(sum.rows[0].s)).toBe(d.verified.net)

    const perf = (await rpc(db, admin, 'select * from public.admin_member_performance()')).rows
    expect(perf).toHaveLength(36)
    expect(perf.reduce((n, r) => n + r.verified_bottles, 0)).toBe(5) // the direct sale belongs to no member
  })

  it('caps remaining bottles at zero once the campaign target is passed', async () => {
    await rpc(db, admin, 'select public.admin_update_settings($1)', [
      { campaign_name: 'Small test', selling_price: 35, discounted_price: 30, profit_per_bottle: 10, campaign_target: 2, member_target: 5 },
    ])
    const o = await placeOrder(db, { items: bottles(3) })
    await verify(o)
    const d = await dashboard()
    expect(d.target).toMatchObject({ remaining: 0, completion_pct: 150 })
  })

  it('flags a transfer reference reused on another order', async () => {
    const a = await placeOrder(db)
    const b = await placeOrder(db)
    expect((await submitPayment(db, a, 'MBB 123-456')).duplicate_transfer_reference).toBe(false)
    expect((await submitPayment(db, b, 'mbb123456')).duplicate_transfer_reference).toBe(true)
    const { rows } = await rpc(db, admin, 'select reference, duplicate_transfer_reference from public.admin_orders order by reference')
    expect(rows.every((r) => r.duplicate_transfer_reference)).toBe(true)
  })

  it('records who changed what in the status history', async () => {
    const o = await placeOrder(db)
    await submitPayment(db, o)
    await verify(o)
    const { rows } = await rpc(db, admin, 'select action, actor_label, from_payment_status, to_payment_status from public.order_status_history where order_id = $1 order by id', [o.order_id])
    expect(rows).toEqual([
      { action: 'created', actor_label: 'customer', from_payment_status: null, to_payment_status: 'awaiting_payment' },
      { action: 'payment_submitted', actor_label: 'customer', from_payment_status: 'awaiting_payment', to_payment_status: 'submitted' },
      { action: 'payment_verified', actor_label: 'dahulu', from_payment_status: 'submitted', to_payment_status: 'verified' },
    ])
  })

  it('lets only the ordering browser attach a payment or withdraw its order', async () => {
    const o = await placeOrder(db)
    const wrong = { ...o, token: 'not-the-token' }
    expect(await errorOf(submitPayment(db, wrong))).toBe('order_not_found')
    const res = await as(db, 'service_role', null, (tx) => tx.query('select public.cancel_unpaid_order($1, $2) ok', [o.order_id, tokenHash(o.token)]))
    expect(res.rows[0].ok).toBe(true)
    expect(await errorOf(submitPayment(db, o))).toBe('order_cancelled')
  })
})

describe('access control (RLS and grants)', () => {
  const tables = ['orders', 'order_items', 'payment_submissions', 'order_status_history', 'order_notes', 'ajk_members', 'campaign_settings', 'admin_login_attempts', 'admin_orders', 'order_facts']

  beforeEach(async () => {
    const o = await placeOrder(db, { promo: 'DMT9T' })
    await submitPayment(db, o)
    await db.query(`insert into storage.objects (bucket_id, name) values ('payment-proofs', $1)`, [`${o.order_id}/proof.png`])
  })

  it.each(tables)('anonymous visitors cannot read %s', async (table) => {
    const msg = await errorOf(as(db, 'anon', null, (tx) => tx.query(`select * from public.${table}`)))
    expect(msg).toMatch(/permission denied/)
  })

  it('a signed-in non-admin sees no campaign rows', async () => {
    const user = '00000000-0000-0000-0000-00000000beef'
    await db.query('insert into auth.users (id) values ($1)', [user])
    for (const table of tables.filter((t) => t !== 'admin_login_attempts')) {
      const { rows } = await as(db, 'authenticated', user, (tx) => tx.query(`select * from public.${table}`))
      expect(rows, table).toHaveLength(0)
    }
    expect(await errorOf(rpc(db, user, 'select public.admin_dashboard()'))).toBe('not_authorized')
    const o = (await db.query('select id from public.orders limit 1')).rows[0]
    expect(await errorOf(rpc(db, user, 'select public.admin_verify_payment($1)', [o.id]))).toBe('not_authorized')
  })

  it('public roles cannot write tables or call the server-only functions', async () => {
    expect(await errorOf(as(db, 'anon', null, (tx) => tx.query(`update public.ajk_members set promo_code = 'AAAAA'`)))).toMatch(/permission denied/)
    expect(await errorOf(as(db, 'authenticated', admin, (tx) => tx.query(`update public.orders set payment_status = 'verified'`)))).toMatch(/permission denied/)
    expect(await errorOf(as(db, 'anon', null, (tx) => tx.query(`select * from public.create_order('{}', '[]', null, 'x')`)))).toMatch(/permission denied/)
    expect(await errorOf(as(db, 'anon', null, (tx) => tx.query(`select * from public.lookup_promo_code('DMT9T')`)))).toMatch(/permission denied/)
    expect(await errorOf(as(db, 'anon', null, (tx) => tx.query(`select public.admin_dashboard()`)))).toMatch(/permission denied/)
  })

  it('payment proofs are readable by admins only', async () => {
    const user = '00000000-0000-0000-0000-00000000cafe'
    const sql = `select name from storage.objects where bucket_id = 'payment-proofs'`
    expect((await as(db, 'anon', null, (tx) => tx.query(sql))).rows).toHaveLength(0)
    expect((await as(db, 'authenticated', user, (tx) => tx.query(sql))).rows).toHaveLength(0)
    expect((await as(db, 'authenticated', admin, (tx) => tx.query(sql))).rows).toHaveLength(1)
    const bucket = await db.query(`select public from storage.buckets where id = 'payment-proofs'`)
    expect(bucket.rows[0].public).toBe(false)
  })

  it('admins can read campaign data', async () => {
    const { rows } = await rpc(db, admin, 'select reference, member_name, transfer_reference from public.admin_orders')
    expect(rows).toHaveLength(1)
    expect(rows[0].member_name).toBe('NUR AMIRAH BINTI JUNAIDI')
  })

  it('the migration can be applied twice', async () => {
    const { migrations } = await import('./harness')
    for (const sql of migrations()) await db.exec(sql)
    expect((await db.query('select count(*)::int n from public.ajk_members')).rows[0].n).toBe(36)
  })
})
