/**
 * PAYMENT QR
 * ---------------------------------------------------------------
 * The DuitNow (Malaysia National QR) code customers scan to pay.
 * The image lives in public/payment/. recipientName, when set, must match
 * the account holder name the banking app shows after scanning; leave it
 * empty to show no "Pay to" line.
 *
 * The real QR is only shown once the checkout backend is connected
 * (see src/lib/orders.js): until then orders would not be saved, so
 * checkout shows a placeholder and nobody can pay into the account.
 * Set isConfigured to false to switch real payments off at any time.
 */
export const payment = {
  qrImagePath: '/payment/bank-qr.png',
  recipientName: 'MUHAMMAD AKIF ZAFRAN BIN MOHD ZULKIFLY',
  method: 'DuitNow QR',
  isConfigured: true,
}
