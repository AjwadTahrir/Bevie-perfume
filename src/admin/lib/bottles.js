/** The eight scents, so one with no sales yet still shows in the buying list. */
export const SCENTS = [
  { id: 'bayu', name: 'Bayu', category: 'For Him' },
  { id: 'nirmala', name: 'Nirmala', category: 'For Him' },
  { id: 'senja', name: 'Senja', category: 'For Him' },
  { id: 'samudera', name: 'Samudera', category: 'For Him' },
  { id: 'purnama', name: 'Purnama', category: 'For Her' },
  { id: 'ranum', name: 'Ranum', category: 'For Her' },
  { id: 'ratna', name: 'Ratna', category: 'For Her' },
  { id: 'seroja', name: 'Seroja', category: 'For Her' },
]

/**
 * Bottles per scent from orders and their items. Verified orders are paid;
 * pending ones have a receipt waiting for review. Anything else (rejected,
 * cancelled, refunded) isn't in either count.
 */
export function bottleSales(orders, items) {
  const rows = new Map(SCENTS.map((s) => [s.id, { ...s, verified: 0, pending: 0 }]))
  const byId = new Map((orders || []).map((o) => [o.id, o]))
  for (const item of items || []) {
    const order = byId.get(item.order_id)
    if (!order) continue
    if (!rows.has(item.perfume_id)) rows.set(item.perfume_id, { id: item.perfume_id, name: item.perfume_name, category: '—', verified: 0, pending: 0 })
    const row = rows.get(item.perfume_id)
    if (order.is_verified) row.verified += item.quantity
    else if (order.is_pending) row.pending += item.quantity
  }
  return [...rows.values()]
}

/** Litres to buy: bottles × ml per bottle, plus the spare percentage. */
export const litresFor = (bottles, mlPerBottle, sparePct) => (bottles * mlPerBottle * (1 + sparePct / 100)) / 1000
