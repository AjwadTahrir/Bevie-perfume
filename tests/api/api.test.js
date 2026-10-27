import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAdmin, createDb } from '../db/harness'
import { fakeServiceClient } from './fakeSupabase'

let client
vi.mock('../../api/_lib/supabase.js', async (orig) => {
  const real = await orig()
  return { ...real, serviceClient: () => client, anonClient: () => client }
})

const { POST: validatePromo } = await import('../../api/promo/validate.js')
const { POST: createOrder } = await import('../../api/orders/index.js')
const { POST: submitPayment } = await import('../../api/orders/payment.js')
const { POST: login } = await import('../../api/admin/login.js')
const { sniffProof } = await import('../../api/_lib/proof.js')

let db
let ip = 0
const json = (body, extra = {}) =>
  new Request('http://test/api', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${++ip}`, ...extra }, body: JSON.stringify(body) })
const customer = { name: 'Aisyah', phone: '012-345 6789', address: 'Kolej Kediaman 5, Shah Alam' }
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])

beforeEach(async () => {
  db = await createDb()
  const adminId = await createAdmin(db, 'dahulu')
  client = fakeServiceClient(db, { users: { [adminId]: 'dahulu@admin.bevie.local' }, passwords: { 'dahulu@admin.bevie.local': 'test-password-1' } })
})

function paymentForm(order, { file = new File([PNG], 'proof.png', { type: 'image/png' }), token = order.token, ref = 'MBB998877' } = {}) {
  const form = new FormData()
  form.set('orderId', order.orderId)
  form.set('token', token)
  form.set('transferReference', ref)
  form.set('paidOn', '2026-10-27')
  form.set('file', file)
  return new Request('http://test/api/orders/payment', { method: 'POST', headers: { 'x-forwarded-for': `10.1.0.${++ip}` }, body: form })
}

describe('POST /api/promo/validate', () => {
  it('accepts a valid code and names the AJK member', async () => {
    const res = await validatePromo(json({ code: 'dmt9t' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ valid: true, code: 'DMT9T', member: { name: 'NUR AMIRAH BINTI JUNAIDI', role: 'Pengarah' } })
  })
  it('rejects unknown and malformed codes', async () => {
    expect((await validatePromo(json({ code: 'AAAAA' }))).status).toBe(404)
    expect((await validatePromo(json({ code: 'TOO-LONG-CODE' }))).status).toBe(400)
  })
})

describe('POST /api/orders', () => {
  it('prices on the server and ignores anything price-like the client sends', async () => {
    const res = await createOrder(
      json({ customer, promoCode: 'X69D7', items: [{ id: 'verdius', quantity: 2, price: 1 }, { id: 'tonvira', quantity: 1 }], finalAmount: 3, ajkMemberId: 'someone-else' }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ quantity: 3, originalSubtotal: 105, discountTotal: 15, finalAmount: 90, promoCode: 'X69D7', memberName: 'LEE YI MEI' })
    expect(body.reference).toMatch(/^BEV-\d{4}-\d{4}$/)
    expect(body.token).toHaveLength(43)
    const stored = await db.query('select access_token_hash from public.orders')
    expect(stored.rows[0].access_token_hash).not.toBe(body.token)
  })
  it('charges full price without a code', async () => {
    const body = await (await createOrder(json({ customer, items: [{ id: 'verdius', quantity: 3 }] }))).json()
    expect(body.finalAmount).toBe(105)
  })
  it('refuses unknown perfumes, invalid codes and bad details', async () => {
    expect((await createOrder(json({ customer, items: [{ id: 'not-a-perfume', quantity: 1 }] }))).status).toBe(400)
    const bad = await createOrder(json({ customer, promoCode: 'ZZZZZ', items: [{ id: 'verdius', quantity: 1 }] }))
    expect(bad.status).toBe(400)
    expect((await bad.json()).error).toBe('invalid_promo_code')
    expect((await createOrder(json({ customer: { ...customer, phone: '12' }, items: [{ id: 'verdius', quantity: 1 }] }))).status).toBe(400)
  })
})

describe('POST /api/orders/payment', () => {
  const place = async () => (await createOrder(json({ customer, promoCode: 'DMT9T', items: [{ id: 'verdius', quantity: 1 }] }))).json()

  it('stores a real image privately and marks the payment submitted', async () => {
    const order = await place()
    const res = await submitPayment(paymentForm(order))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ reference: order.reference, paymentStatus: 'submitted' })
    const keys = [...client.storage.objects.keys()]
    expect(keys).toHaveLength(1)
    expect(keys[0]).toMatch(new RegExp(`^payment-proofs/${order.orderId}/[0-9a-f-]+\\.png$`))
    const sub = await db.query('select transfer_reference, proof_mime from public.payment_submissions')
    expect(sub.rows[0]).toEqual({ transfer_reference: 'MBB998877', proof_mime: 'image/png' })
  })
  it('rejects a file whose bytes are not an image or PDF, whatever its name and type say', async () => {
    const order = await place()
    const fake = new File([new TextEncoder().encode('<html>not an image</html>')], 'proof.png', { type: 'image/png' })
    expect((await submitPayment(paymentForm(order, { file: fake }))).status).toBe(415)
    expect(client.storage.objects.size).toBe(0)
  })
  it('rejects a wrong order token without storing anything', async () => {
    const order = await place()
    expect((await submitPayment(paymentForm(order, { token: 'guessed' }))).status).toBe(404)
    expect(client.storage.objects.size).toBe(0)
  })
  it('refuses a second submission for the same order', async () => {
    const order = await place()
    await submitPayment(paymentForm(order))
    expect((await submitPayment(paymentForm(order))).status).toBe(409)
  })
})

describe('POST /api/admin/login', () => {
  const attempt = (username, password, from = '10.9.9.9') => login(json({ username, password }, { 'x-forwarded-for': from }))

  it('signs in the admin by username', async () => {
    const res = await attempt('Dahulu', 'test-password-1')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ session: { access_token: 'at', refresh_token: 'rt' }, admin: { username: 'dahulu' } })
  })
  it('rejects a wrong password or unknown user with the same message', async () => {
    const a = await attempt('dahulu', 'wrong')
    const b = await attempt('nobody', 'test-password-1')
    expect(a.status).toBe(401)
    expect(b.status).toBe(401)
    expect((await a.json()).message).toBe((await b.json()).message)
  })
  it('locks a username after 5 failures, even with the right password', async () => {
    for (let i = 0; i < 5; i++) expect((await attempt('dahulu', 'wrong', `10.8.0.${i}`)).status).toBe(401)
    expect((await attempt('dahulu', 'test-password-1', '10.8.1.1')).status).toBe(429)
  })
})

describe('proof sniffing', () => {
  it.each([
    [[0xff, 0xd8, 0xff, 0xe0], 'image/jpeg'],
    [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'image/png'],
    [[0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], 'image/webp'],
    [[0x25, 0x50, 0x44, 0x46, 0x2d, 0x31], 'application/pdf'],
  ])('recognises %j', (bytes, mime) => expect(sniffProof(new Uint8Array(bytes))?.mime).toBe(mime))
  it('rejects anything else', () => {
    expect(sniffProof(new TextEncoder().encode('GIF89a'))).toBeNull()
    expect(sniffProof(new Uint8Array([0x4d, 0x5a]))).toBeNull()
  })
})
