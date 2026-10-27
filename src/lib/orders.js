/**
 * ORDERS (PLACEHOLDER)
 * ---------------------------------------------------------------
 * Nothing here is saved yet. When the database is ready, replace the
 * body of submitOrder with real calls, for example:
 *   1. upload the proof file to storage (S3, Supabase Storage,
 *      Firebase Storage...) and keep its URL
 *   2. insert the order row: reference, customer, items, totals,
 *      referral code, proof URL, status 'pending_verification'
 *   3. check the referral code on the server, not only in the browser
 * Keep the same return shape and the checkout UI needs no changes.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O or 1/I lookalikes

/**
 * Short reference the customer adds to their bank transfer, e.g.
 * "BV-251027-K7Q2", so a payment can be matched to its order.
 * Not guaranteed unique: the database should enforce that later.
 */
export function createOrderReference(date = new Date()) {
  const ymd = date.toISOString().slice(2, 10).replaceAll('-', '')
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ALPHABET[b % ALPHABET.length]).join('')
  return `BV-${ymd}-${rand}`
}

/**
 * Submits an order. PLACEHOLDER: only validates and pretends to save.
 * @returns {Promise<{ reference: string, status: 'pending_verification' }>}
 */
export async function submitOrder({ reference, customer, items, totals, referralCode, proofFile }) {
  if (!reference || !customer?.name || !customer?.phone || !items?.length || !proofFile) {
    throw new Error('Order is missing required details.')
  }

  // TODO(db): upload proofFile and insert the order here.
  const order = {
    reference,
    customer,
    items: items.map((l) => ({ id: l.id, name: l.perfume.name, unitPrice: l.perfume.price, quantity: l.quantity })),
    totals,
    referralCode: referralCode || null,
    proof: { name: proofFile.name, type: proofFile.type, size: proofFile.size },
    status: 'pending_verification',
    createdAt: new Date().toISOString(),
  }
  if (import.meta.env.DEV) console.info('[Beavie] Placeholder order (not saved):', order)

  await new Promise((r) => setTimeout(r, 700))
  return { reference, status: order.status }
}
