import { supabase } from './supabase'

const messages = {
  not_authorized: 'Your session does not have admin access. Please sign in again.',
  already_verified: 'This payment was already verified. Nothing was counted twice.',
  invalid_transition: 'That action is not available for the order in its current state. It may have just changed; the page has been refreshed.',
  refund_required: 'This order is paid and verified. Mark it as refunded instead of cancelling it.',
  reason_required: 'Please give a reason (at least 3 characters).',
  order_not_found: 'Order not found.',
  member_not_found: 'Member not found.',
  discount_above_price: 'The promo price cannot be higher than the selling price.',
  invalid_price: 'Prices must be between RM 1 and RM 10,000 (profit RM 0 or more).',
  invalid_target: 'Targets must be whole numbers above zero.',
  invalid_campaign_name: 'Campaign name must be 3 to 120 characters.',
  invalid_dates: 'The campaign end date must be after the start date.',
  note_length: 'Notes must be 1 to 2,000 characters.',
}

function friendly(error) {
  const msg = messages[error?.message] || (error?.code === 'PGRST301' ? messages.not_authorized : null)
  const e = new Error(msg || error?.message || 'Something went wrong.')
  e.code = error?.message
  return e
}

export async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw friendly(error)
  return data
}

/** All rows of a table or view, paging past PostgREST's 1000-row cap. */
async function selectAll(build) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999)
    if (error) throw friendly(error)
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

export const range = (r) => ({ p_from: r?.from ?? null, p_to: r?.to ?? null })

export const fetchDashboard = (r) => rpc('admin_dashboard', range(r))
export const fetchMembers = (r) => rpc('admin_member_performance', range(r))
export const fetchTimeseries = (r, memberId = null) => rpc('admin_sales_timeseries', { ...range(r), p_member_id: memberId })

export function fetchOrders({ from, to, memberId } = {}) {
  return selectAll(() => {
    let q = supabase.from('admin_orders').select('*').order('created_at', { ascending: false })
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lt('created_at', to)
    if (memberId) q = q.eq('ajk_member_id', memberId)
    return q
  })
}

export async function fetchOrder(id) {
  const one = async (q) => {
    const { data, error } = await q
    if (error) throw friendly(error)
    return data
  }
  const [order, items, submissions, history, notes] = await Promise.all([
    one(supabase.from('admin_orders').select('*').eq('id', id).maybeSingle()),
    one(supabase.from('admin_order_items').select('*').eq('order_id', id).order('perfume_name')),
    one(supabase.from('admin_payment_submissions').select('*').eq('order_id', id).order('created_at', { ascending: false })),
    one(supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at')),
    one(supabase.from('order_notes').select('*').eq('order_id', id).order('created_at')),
  ])
  return { order, items, submissions, history, notes }
}

export async function fetchSettings() {
  const { data, error } = await supabase.from('campaign_settings').select('*').eq('id', 1).single()
  if (error) throw friendly(error)
  return data
}

/** Short-lived link to a private receipt in the payment_receipts bucket (storage policy: admins only). */
export async function proofUrl(path) {
  const { data, error } = await supabase.storage.from('payment_receipts').createSignedUrl(path, 300)
  if (error) throw new Error('Could not open the proof file.')
  return data.signedUrl
}

export const actions = {
  verify: (id, note) => rpc('admin_verify_payment', { p_order_id: id, p_note: note || null }),
  reject: (id, reason) => rpc('admin_reject_payment', { p_order_id: id, p_reason: reason }),
  cancel: (id, reason) => rpc('admin_cancel_order', { p_order_id: id, p_reason: reason }),
  refund: (id, reason) => rpc('admin_refund_order', { p_order_id: id, p_reason: reason }),
  fulfil: (id) => rpc('admin_mark_fulfilled', { p_order_id: id }),
  note: (id, body) => rpc('admin_add_note', { p_order_id: id, p_body: body }),
  setMemberActive: (id, active) => rpc('admin_set_member_active', { p_member_id: id, p_active: active }),
  updateSettings: (s) => rpc('admin_update_settings', { p: s }),
}
