import { HttpError, UUID, json, readJson, route } from '../_lib/http.js'
import { dbError, serviceClient } from '../_lib/supabase.js'
import { hashToken } from '../_lib/token.js'

/** POST /api/orders/cancel { orderId, token }: withdraws an order that was never paid. */
export const POST = route(async (request) => {
  const { orderId, token } = await readJson(request)
  if (!UUID.test(String(orderId)) || typeof token !== 'string') throw new HttpError(400, 'bad_request', 'Invalid order.')
  const { data, error } = await serviceClient().rpc('cancel_unpaid_order', { p_order_id: orderId, p_token_hash: hashToken(token) })
  if (error) throw dbError(error)
  return json(200, { cancelled: data === true })
})
