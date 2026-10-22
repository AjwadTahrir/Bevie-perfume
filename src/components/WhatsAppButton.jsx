import { useId } from 'react'
import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '../lib/whatsapp'

/**
 * WhatsApp call to action. Renders a real link only when a valid
 * business number is configured in src/config/brand.js; otherwise a
 * disabled button with an explanation, so it never points to an
 * invalid wa.me URL.
 */
export default function WhatsAppButton({ message, label, className = '', variant = 'primary' }) {
  const url = buildWhatsAppUrl(message)
  const noteId = useId()

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`btn btn-${variant} ${className}`}>
        <MessageCircle size={18} strokeWidth={1.5} aria-hidden="true" />
        {label}
        <span className="sr-only"> (opens WhatsApp in a new tab)</span>
      </a>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" disabled aria-describedby={noteId} className={`btn ${className}`}>
        <MessageCircle size={18} strokeWidth={1.5} aria-hidden="true" />
        {label}
      </button>
      <p id={noteId} className="text-sm text-brown-soft">
        {import.meta.env.DEV
          ? 'WhatsApp number not configured yet. Add it in src/config/brand.js.'
          : 'WhatsApp ordering opens soon.'}
      </p>
    </div>
  )
}
