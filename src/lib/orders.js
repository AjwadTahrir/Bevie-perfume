import { isValidReferralCode, normalizeReferralCode } from '../data/referralCodes'
import { payment } from '../config/payment'
import { shop } from '../config/brand'

/**
 * ORDERS
 * ---------------------------------------------------------------
 * Talks to the Supabase Edge Function in supabase/functions/checkout.
 * Connect it by setting two values in a .env file (see .env.example):
 *   VITE_SUPABASE_URL       https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY  the project's anon (public) key
 * The anon key is safe in the browser: the database only accepts
 * orders through the Edge Function, which holds the secret key.
 *
 * Three modes:
 *   live    backend connected and payment configured: real QR, real orders
 *   demo    local development without a backend: placeholder QR, nothing saved
 *   closed  a public build without a backend: checkout explains it opens soon
 */

const URL_ = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const ENDPOINT = URL_ && KEY ? `${URL_.replace(/\/$/, '')}/functions/v1/checkout` : null

export const checkoutMode = ENDPOINT && payment.isConfigured ? 'live' : import.meta.env.DEV ? 'demo' : 'closed'

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

async function call(body) {
  const isForm = body instanceof FormData
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: isForm ? headers : { ...headers, 'Content-Type': 'application/json' },
      body: isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the shop. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.')
    err.code = data.code
    throw err
  }
  return data
}

/** Checks a committee (referral) code. Live: asks the backend. Otherwise: the local list. */
export async function validateReferralCode(raw) {
  const code = normalizeReferralCode(raw)
  if (checkoutMode !== 'live') return isValidReferralCode(code)
  const { valid } = await call({ action: 'validate-code', code })
  return valid
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const demoReference = () =>
  `DEMO-${Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ALPHABET[b % ALPHABET.length]).join('')}`

/**
 * Creates the order before payment, so the QR shows the backend's final total.
 * requestId makes retries safe: the same id always returns the same order.
 * @returns {Promise<{ orderId, reference, guestToken, subtotal, discount, total, committeeApplied }>}
 */
export async function createOrder({ requestId, customer, code, items }) {
  if (checkoutMode === 'closed') throw new Error('Online ordering opens soon. Please order through WhatsApp for now.')
  if (checkoutMode === 'demo') {
    await new Promise((r) => setTimeout(r, 400))
    const subtotal = items.reduce((s, l) => s + (l.perfume.price ?? 0) * l.quantity, 0)
    const count = items.reduce((n, l) => n + l.quantity, 0)
    const discount = code ? shop.committeeDiscountPerBottle * count : 0
    return { orderId: null, reference: demoReference(), guestToken: null, subtotal, discount, total: subtotal - discount, committeeApplied: !!code }
  }
  const data = await call({
    action: 'create-order',
    requestId,
    code: code || null,
    customer: { name: customer.name, phone: customer.phone, note: customer.notes },
    items: items.map((l) => ({ id: l.id, quantity: l.quantity })),
  })
  return {
    orderId: data.orderId,
    reference: `BV-${String(data.orderNumber).padStart(5, '0')}`,
    guestToken: data.guestToken,
    subtotal: data.subtotalSen / 100,
    discount: data.discountSen / 100,
    total: data.totalSen / 100,
    committeeApplied: data.committeeApplied,
  }
}

/** Uploads the proof of payment for an order created by createOrder. */
export async function submitReceipt({ order, file, bankReference }) {
  if (checkoutMode !== 'live') {
    if (import.meta.env.DEV) console.info('[JETHA] Demo checkout: order and receipt are not saved.', { order, file: file?.name })
    await new Promise((r) => setTimeout(r, 600))
    return { status: 'awaiting_verification' }
  }
  const form = new FormData()
  form.set('action', 'submit-receipt')
  form.set('orderId', order.orderId)
  form.set('guestToken', order.guestToken)
  if (bankReference) form.set('bankReference', bankReference)
  form.set('file', file)
  return call(form)
}
