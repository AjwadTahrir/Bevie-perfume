import { randomUUID } from 'node:crypto'
import { HttpError, UUID, clientIp, json, limit, route } from '../_lib/http.js'
import { dbError, serviceClient } from '../_lib/supabase.js'
import { hashToken } from '../_lib/token.js'
import { sniffProof } from '../_lib/proof.js'
import { PROOF_MAX_BYTES } from '../../shared/campaign.js'

const BUCKET = 'payment-proofs'

/**
 * POST /api/orders/payment (multipart/form-data)
 *   orderId, token, transferReference, paidOn (YYYY-MM-DD, optional), file
 * Checks the order token, identifies the file from its bytes, stores it
 * in the private bucket and records the submission.
 */
export const POST = route(async (request) => {
  limit(`pay:${clientIp(request)}`, 10, 60_000)
  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > PROOF_MAX_BYTES + 64 * 1024) throw new HttpError(413, 'too_large', 'The file must be 4 MB or smaller.')

  let form
  try {
    form = await request.formData()
  } catch {
    throw new HttpError(400, 'bad_request', 'Upload could not be read. Please try again.')
  }
  const orderId = String(form.get('orderId') || '')
  const token = String(form.get('token') || '')
  const transferReference = String(form.get('transferReference') || '').trim()
  const paidOn = String(form.get('paidOn') || '').trim() || null
  const file = form.get('file')

  if (!UUID.test(orderId) || !token) throw new HttpError(400, 'order_not_found', 'We could not find that order. Please start checkout again.')
  if (paidOn && !/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) throw new HttpError(400, 'invalid_paid_on', 'Please check the payment date.')
  if (transferReference.length < 3 || transferReference.length > 80) {
    throw new HttpError(400, 'invalid_transfer_reference', 'Please enter the transfer reference from your banking app.')
  }
  if (!file || typeof file === 'string') throw new HttpError(400, 'missing_file', 'Please attach your proof of payment.')
  if (file.size > PROOF_MAX_BYTES) throw new HttpError(413, 'too_large', 'The file must be 4 MB or smaller.')

  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniffProof(bytes)
  if (!kind) throw new HttpError(415, 'unsupported_file', 'Please upload a JPG, PNG, WebP or PDF file.')

  const db = serviceClient()
  const tokenHash = hashToken(token)

  // Check ownership before storing anything, so strangers can't fill the bucket.
  const { data: order, error: lookupError } = await db
    .from('orders')
    .select('id, access_token_hash, payment_status, order_status')
    .eq('id', orderId)
    .maybeSingle()
  if (lookupError) throw dbError(lookupError)
  if (!order || order.access_token_hash !== tokenHash) throw new HttpError(404, 'order_not_found', 'We could not find that order. Please start checkout again.')
  if (order.order_status === 'cancelled') throw new HttpError(409, 'order_cancelled', 'This order was cancelled. Please place a new order.')
  if (!['awaiting_payment', 'rejected'].includes(order.payment_status)) {
    throw new HttpError(409, 'payment_already_submitted', 'Payment for this order has already been submitted.')
  }

  const path = `${orderId}/${randomUUID()}.${kind.ext}`
  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: kind.mime, upsert: false })
  if (uploadError) {
    console.error('[storage]', uploadError)
    throw new HttpError(502, 'upload_failed', 'Your file could not be uploaded. Please try again.')
  }

  const { data, error } = await db.rpc('submit_payment', {
    p_order_id: orderId,
    p_token_hash: tokenHash,
    p_transfer_reference: transferReference,
    p_paid_on: paidOn,
    p_proof_path: path,
    p_proof_mime: kind.mime,
    p_proof_size: bytes.length,
    p_proof_name: typeof file.name === 'string' ? file.name : null,
  })
  if (error) {
    await db.storage.from(BUCKET).remove([path])
    throw dbError(error)
  }
  return json(200, { reference: data[0].reference, paymentStatus: data[0].payment_status })
})
