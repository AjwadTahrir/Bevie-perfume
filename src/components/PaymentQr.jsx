import { QrCode } from 'lucide-react'
import { shop } from '../config/brand'

/**
 * The payment QR code. Shows the image set in shop.payment.qrImage
 * (src/config/brand.js); until one is set, a clearly marked
 * placeholder so nobody mistakes it for a real, scannable code.
 */
export default function PaymentQr() {
  if (shop.payment.qrImage) {
    return (
      <img
        src={shop.payment.qrImage}
        alt={`${shop.payment.method} code for paying Beavie Perfume`}
        className="size-56 rounded-lg bg-white object-contain p-2"
      />
    )
  }
  return (
    <div className="flex size-56 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-brown/35 bg-white/60 px-6 text-brown-soft">
      <QrCode size={56} strokeWidth={1.1} aria-hidden="true" />
      <p className="text-sm font-medium text-brown">QR code placeholder</p>
      <p className="text-xs leading-snug">Add the business payment QR in src/config/brand.js</p>
    </div>
  )
}
