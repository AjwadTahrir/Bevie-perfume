/** Labels and badge tones for every status the database uses. */
export const PAYMENT_STATUS = {
  awaiting_payment: { label: 'Awaiting payment', tone: 'neutral' },
  submitted: { label: 'Payment submitted', tone: 'info' },
  verified: { label: 'Verified · Paid', tone: 'good' },
  rejected: { label: 'Rejected', tone: 'bad' },
  refunded: { label: 'Refunded', tone: 'warn' },
}

export const ORDER_STATUS = {
  pending: { label: 'Pending', tone: 'neutral' },
  fulfilled: { label: 'Fulfilled', tone: 'good' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
}

export const DISPLAY_STATUS = {
  ...PAYMENT_STATUS,
  cancelled: { label: 'Cancelled', tone: 'bad' },
}

export const MEMBER_STATUS = {
  not_started: { label: 'Not started', tone: 'neutral' },
  in_progress: { label: 'In progress', tone: 'warn' },
  target_reached: { label: 'Target reached', tone: 'good' },
}

export const HISTORY_LABEL = {
  created: 'Order placed',
  order_updated: 'Details changed by customer',
  payment_submitted: 'Payment submitted',
  payment_verified: 'Payment verified',
  payment_rejected: 'Payment rejected',
  order_cancelled: 'Order cancelled',
  cancelled: 'Order withdrawn',
  refunded: 'Refunded',
  fulfilled: 'Marked fulfilled',
}
