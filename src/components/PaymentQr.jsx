import { QrCode } from 'lucide-react'
import { payment } from '../config/payment'
import { checkoutMode } from '../lib/orders'

/**
 * The payment QR code from src/config/payment.js. It is only shown
 * when checkout is live (backend connected); otherwise a clearly
 * marked placeholder, so nobody pays while orders can't be saved.
 */
export default function PaymentQr() {
  if (checkoutMode === 'live') {
    return (
      <img
        src={payment.qrImagePath}
        alt={payment.recipientName ? `${payment.method} code for paying ${payment.recipientName}` : `${payment.method} code for paying JETHA`}
        className="h-auto w-60 max-w-full rounded-lg bg-white object-contain"
      />
    )
  }
  return (
    <div className="flex size-56 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-brown/35 bg-white/60 px-6 text-brown-soft">
      <QrCode size={56} strokeWidth={1.1} aria-hidden="true" />
      <p className="text-sm font-medium text-brown">{checkoutMode === 'demo' ? 'Demo mode · do not pay' : 'QR available soon'}</p>
      <p className="text-xs leading-snug">
        {checkoutMode === 'demo' ? 'The real QR appears once the checkout backend is connected.' : 'Online payment opens soon.'}
      </p>
    </div>
  )
}
