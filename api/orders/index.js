import { HttpError, clientIp, json, limit, readJson, route } from '../_lib/http.js'
import { dbError, serviceClient } from '../_lib/supabase.js'
import { hashToken, newOrderToken } from '../_lib/token.js'
import { catalogueById } from '../../shared/catalogue.js'

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/**
 * POST /api/orders: creates an order awaiting payment.
 * The client sends perfume ids and quantities only; prices, discount
 * and AJK attribution are decided by public.create_order.
 */
export const POST = route(async (request) => {
  limit(`order:${clientIp(request)}`, 10, 60_000)
  const body = await readJson(request)

  const quantities = new Map()
  for (const line of Array.isArray(body.items) ? body.items : []) {
    const product = catalogueById.get(line?.id)
    const qty = Number(line?.quantity)
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 50) throw new HttpError(400, 'invalid_items', 'Your cart could not be read. Please refresh and try again.')
    quantities.set(product.id, (quantities.get(product.id) || 0) + qty)
  }
  if (!quantities.size) throw new HttpError(400, 'invalid_items', 'Your cart is empty.')
  const items = [...quantities].map(([id, quantity]) => ({ perfume_id: id, perfume_name: catalogueById.get(id).name, quantity }))

  const c = body.customer || {}
  const customer = { name: text(c.name, 120), phone: text(c.phone, 30), email: text(c.email, 200), address: text(c.address, 500), notes: text(c.notes, 1000) }
  const promo = text(body.promoCode, 20) || null

  const token = newOrderToken()
  const { data, error } = await serviceClient().rpc('create_order', {
    p_customer: customer,
    p_items: items,
    p_promo_code: promo,
    p_token_hash: hashToken(token),
  })
  if (error) throw dbError(error)
  const o = data[0]

  return json(201, {
    orderId: o.order_id,
    reference: o.reference,
    token,
    quantity: o.quantity,
    originalUnitPrice: Number(o.original_unit_price),
    appliedUnitPrice: Number(o.applied_unit_price),
    discountPerBottle: Number(o.discount_per_bottle),
    originalSubtotal: Number(o.original_subtotal),
    discountTotal: Number(o.discount_total),
    finalAmount: Number(o.final_amount),
    promoCode: o.promo_code,
    memberName: o.member_name,
  })
})
