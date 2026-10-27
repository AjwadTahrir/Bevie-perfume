/**
 * ORDERS
 * ---------------------------------------------------------------
 * Talks to the /api functions, which validate everything again on the
 * server: the promo code, the prices and the AJK attribution are
 * decided by the database, never by this browser.
 *
 *   validatePromo(code)            -> { code, member: { name, role } }
 *   createOrder({ customer, items, promoCode })
 *                                  -> { orderId, reference, token, finalAmount, ... }
 *   submitPayment({ orderId, token, transferReference, paidOn, file })
 *   withdrawOrder({ orderId, token })  (unpaid orders only)
 */

async function call(path, init) {
  let res
  try {
    res = await fetch(path, init)
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body.message || 'Something went wrong. Please try again.')
    err.code = body.error
    throw err
  }
  return body
}

const post = (path, data) => call(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })

export const validatePromo = (code) => post('/api/promo/validate', { code })

export const createOrder = ({ customer, items, promoCode }) =>
  post('/api/orders', {
    customer,
    items: items.map((l) => ({ id: l.id, quantity: l.quantity })),
    promoCode: promoCode || null,
  })

export function submitPayment({ orderId, token, transferReference, paidOn, file }) {
  const form = new FormData()
  form.set('orderId', orderId)
  form.set('token', token)
  form.set('transferReference', transferReference)
  if (paidOn) form.set('paidOn', paidOn)
  form.set('file', file)
  return call('/api/orders/payment', { method: 'POST', body: form })
}

/** Best effort: withdraws an unpaid order the customer replaced by changing their cart. */
export const withdrawOrder = ({ orderId, token }) => post('/api/orders/cancel', { orderId, token }).catch(() => {})
