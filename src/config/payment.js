/**
 * PAYMENT QR
 * ---------------------------------------------------------------
 * The DuitNow (Malaysia National QR) code customers scan to pay.
 * The image lives in public/payment/. recipientName must match the
 * account holder name the banking app shows after scanning.
 *
 * The real QR is only shown once the checkout backend is connected
 * (see src/lib/orders.js): until then orders would not be saved, so
 * checkout shows a placeholder and nobody can pay into the account.
 * Set isConfigured to false to switch real payments off at any time.
 */
export const payment = {
  qrImagePath: '/payment/bank-qr.jpg',
  recipientName: 'ANIQ AISAR BIN MOHD FAIZUL',
  method: 'DuitNow QR · Touch ’n Go eWallet',
  isConfigured: true,
}
