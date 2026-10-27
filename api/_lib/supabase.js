import { createClient } from '@supabase/supabase-js'
import { HttpError } from './http.js'

/**
 * SERVER-ONLY Supabase clients. The service-role key bypasses RLS, so
 * it is read from server environment variables that are never
 * prefixed with VITE_ and never reach the browser bundle.
 */
const env = (...names) => names.map((n) => process.env[n]).find(Boolean)

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
let service

export function supabaseUrl() {
  return env('SUPABASE_URL', 'VITE_SUPABASE_URL')
}

export function serviceClient() {
  const url = supabaseUrl()
  const key = env('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY')
  if (!url || !key) throw new HttpError(503, 'not_configured', 'Online ordering is not connected yet. Please contact us on WhatsApp to order.')
  service ??= createClient(url, key, options)
  return service
}

/** A fresh client with the public key, used to sign an admin in. */
export function anonClient() {
  const url = supabaseUrl()
  const key = env('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY')
  if (!url || !key) throw new HttpError(503, 'not_configured', 'Sign-in is not configured yet.')
  return createClient(url, key, options)
}

/** Turns a database exception raised by our SQL functions into a clear API error. */
const messages = {
  invalid_promo_code: [400, 'That promo code is not valid or is no longer active.'],
  campaign_closed: [409, 'Orders are closed for this campaign.'],
  invalid_name: [400, 'Please enter your full name.'],
  invalid_phone: [400, 'Please enter a valid phone number.'],
  invalid_email: [400, 'Please enter a valid email address, or leave it empty.'],
  invalid_address: [400, 'Please enter your delivery address.'],
  invalid_notes: [400, 'Order notes are too long.'],
  invalid_items: [400, 'Your cart could not be read. Please refresh and try again.'],
  invalid_token: [400, 'Your order session is invalid. Please start checkout again.'],
  order_not_found: [404, 'We could not find that order. Please start checkout again.'],
  order_cancelled: [409, 'This order was cancelled. Please place a new order.'],
  payment_already_submitted: [409, 'Payment for this order has already been submitted.'],
  invalid_transfer_reference: [400, 'Please enter the transfer reference from your banking app.'],
  invalid_paid_on: [400, 'Please check the payment date.'],
}

export function dbError(error) {
  const known = messages[error?.message]
  if (known) return new HttpError(known[0], error.message, known[1])
  console.error('[db]', error)
  return new HttpError(500, 'server_error', 'Something went wrong on our side. Please try again.')
}
