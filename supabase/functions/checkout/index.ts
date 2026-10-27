// BEAVIE CHECKOUT (Supabase Edge Function)
// ---------------------------------------------------------------
// The only door between the website and the shop database. It holds
// the service-role key (provided automatically by Supabase as an
// environment variable, never sent to browsers) and calls the
// transactional functions from migration 005.
//
//   POST application/json { action: "validate-code", code }
//     -> { valid }
//   POST application/json { action: "create-order", requestId, customer: { name, phone, note }, code, items: [{ id, quantity }] }
//     -> { orderId, orderNumber, guestToken, subtotalSen, discountSen, totalSen, committeeApplied }
//   POST multipart/form-data  action=submit-receipt, orderId, guestToken, bankReference?, file
//     -> { status: "awaiting_verification" }
//
// Deploy: supabase functions deploy checkout --no-verify-jwt
// (guests have no account; requests are authorised by the guest token).

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const BUCKET = 'payment-receipts'
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '*').split(',').map((s) => s.trim())

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

// --- small helpers -------------------------------------------------------------

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const allow = ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    Vary: 'Origin',
  }
}

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } })

const fail = (req: Request, message: string, status = 400, code = 'bad_request') => json(req, { error: message, code }, status)

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Identify the real file type from its first bytes; the browser's claim is not trusted.
function sniffImage(bytes: Uint8Array): { type: string; ext: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { type: 'image/png', ext: 'png' }
  const riff = String.fromCharCode(...bytes.slice(0, 4))
  const webp = String.fromCharCode(...bytes.slice(8, 12))
  if (riff === 'RIFF' && webp === 'WEBP') return { type: 'image/webp', ext: 'webp' }
  return null
}

// Best-effort per-instance rate limit (Edge Function instances are short-lived; this
// slows brute-forcing of committee codes rather than guaranteeing a hard cap).
const hits = new Map<string, number[]>()
function rateLimited(req: Request, key: string, limit: number, windowMs: number) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const id = `${key}:${ip}`
  const now = Date.now()
  const recent = (hits.get(id) ?? []).filter((t) => now - t < windowMs)
  recent.push(now)
  hits.set(id, recent)
  return recent.length > limit
}

// --- actions ---------------------------------------------------------------------

async function validateCode(req: Request, body: Record<string, unknown>) {
  if (rateLimited(req, 'code', 10, 60_000)) return fail(req, 'Too many attempts. Please wait a minute.', 429, 'rate_limited')
  const code = typeof body.code === 'string' ? body.code.slice(0, 40) : ''
  if (!code.trim()) return json(req, { valid: false })
  const { data, error } = await db.rpc('checkout_code_is_active', { p_code: code })
  if (error) throw error
  return json(req, { valid: data === true })
}

async function createOrder(req: Request, body: Record<string, unknown>) {
  if (rateLimited(req, 'order', 20, 60_000)) return fail(req, 'Too many attempts. Please wait a minute.', 429, 'rate_limited')
  const customer = (body.customer ?? {}) as Record<string, unknown>
  const name = String(customer.name ?? '').trim()
  const phone = String(customer.phone ?? '').trim()
  const digits = phone.replace(/\D/g, '')
  const requestId = String(body.requestId ?? '')
  const items = Array.isArray(body.items) ? body.items : []

  if (!UUID.test(requestId)) return fail(req, 'Invalid checkout request.')
  if (name.length < 1 || name.length > 200) return fail(req, 'Please enter your name.')
  if (digits.length < 9 || digits.length > 13) return fail(req, 'Please enter a valid phone number.')
  if (!items.length || items.length > 20) return fail(req, 'Your cart is empty.')

  // The browser only states what it wants; prices come from the database.
  const cleanItems = items.map((i) => ({ id: String((i as Record<string, unknown>).id ?? ''), quantity: Number((i as Record<string, unknown>).quantity) }))

  const guestToken = randomToken()
  const { data, error } = await db.rpc('checkout_create_order', {
    p_request_id: requestId,
    p_guest_token_hash: await sha256Hex(guestToken),
    p_customer_name: name,
    p_customer_phone: phone,
    p_customer_note: String(customer.note ?? '').slice(0, 1000),
    p_committee_code: typeof body.code === 'string' ? body.code.slice(0, 40) : null,
    p_items: cleanItems,
  })
  if (error) {
    if (error.code === 'P0002') return fail(req, 'That referral code was not recognised. Check it or remove it.', 400, 'invalid_code')
    if (error.code === 'P0001') return fail(req, error.message, 400, 'rejected')
    throw error
  }
  const row = Array.isArray(data) ? data[0] : data
  return json(req, {
    orderId: row.order_id,
    orderNumber: row.order_number,
    guestToken,
    subtotalSen: row.subtotal_sen,
    discountSen: row.discount_sen,
    totalSen: row.total_sen,
    committeeApplied: row.committee_applied,
  })
}

async function submitReceipt(req: Request, form: FormData) {
  if (rateLimited(req, 'receipt', 10, 60_000)) return fail(req, 'Too many attempts. Please wait a minute.', 429, 'rate_limited')
  const orderId = String(form.get('orderId') ?? '')
  const guestToken = String(form.get('guestToken') ?? '')
  const file = form.get('file')
  if (!UUID.test(orderId) || !/^[a-f0-9]{64}$/.test(guestToken)) return fail(req, 'Invalid order.', 400)
  if (!(file instanceof File)) return fail(req, 'Please attach your proof of payment.')
  if (file.size < 1 || file.size > MAX_RECEIPT_BYTES) return fail(req, 'The file must be 5 MB or smaller.')

  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniffImage(bytes)
  if (!kind) return fail(req, 'Please upload a JPG, PNG or WebP image.')

  const submissionId = crypto.randomUUID()
  const path = `${orderId}/${submissionId}.${kind.ext}`
  const tokenHash = await sha256Hex(guestToken)

  // Check ownership before storing anything.
  const { data: owner, error: ownerError } = await db.from('orders').select('id').eq('id', orderId).eq('guest_token_hash', tokenHash).maybeSingle()
  if (ownerError) throw ownerError
  if (!owner) return fail(req, 'Order not found.', 404, 'not_found')

  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: kind.type, upsert: false })
  if (uploadError) throw uploadError

  const { data, error } = await db.rpc('checkout_record_receipt', {
    p_order_id: orderId,
    p_guest_token_hash: tokenHash,
    p_submission_id: submissionId,
    p_receipt_path: path,
    p_content_type: kind.type,
    p_file_size_bytes: bytes.byteLength,
    p_bank_reference: String(form.get('bankReference') ?? '').slice(0, 120),
  })
  if (error) {
    await db.storage.from(BUCKET).remove([path]) // keep storage and records consistent
    if (error.code === 'P0001') return fail(req, error.message, 409, 'rejected')
    throw error
  }
  return json(req, { status: data })
}

// --- entry point ----------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return fail(req, 'Method not allowed', 405)
  try {
    const type = req.headers.get('content-type') ?? ''
    if (type.startsWith('multipart/form-data')) {
      const form = await req.formData()
      if (form.get('action') === 'submit-receipt') return await submitReceipt(req, form)
      return fail(req, 'Unknown action')
    }
    const body = (await req.json()) as Record<string, unknown>
    if (body.action === 'validate-code') return await validateCode(req, body)
    if (body.action === 'create-order') return await createOrder(req, body)
    return fail(req, 'Unknown action')
  } catch (err) {
    console.error(err)
    return fail(req, 'Something went wrong. Please try again.', 500, 'server_error')
  }
})
