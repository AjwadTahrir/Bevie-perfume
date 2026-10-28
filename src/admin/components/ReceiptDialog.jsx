import { useEffect, useId, useRef, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { proofUrl } from '../lib/api'
import { rm } from '../lib/format'

/**
 * Quick look at an order's latest receipt without leaving the list.
 * The image comes from a private signed link that expires in 5 minutes;
 * the storage policy only signs it for admins.
 */
export default function ReceiptDialog({ order, onClose, onReview }) {
  const ref = useRef(null)
  const id = useId()
  const [url, setUrl] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const d = ref.current
    if (order && !d.open) d.showModal()
    else if (!order && d.open) d.close()
    if (!order) return
    let active = true
    setUrl(null)
    setError('')
    proofUrl(order.proof_path).then(
      (u) => active && setUrl(u),
      (e) => active && setError(e.message),
    )
    return () => {
      active = false
    }
  }, [order])

  const isPdf = order?.proof_mime === 'application/pdf'

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-t`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-[0_24px_60px_rgba(12,12,16,0.18)] backdrop:bg-espresso/55"
    >
      {order && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <p className="eyebrow">Receipt</p>
              <h2 id={`${id}-t`} className="display mt-1 text-xl">
                {order.reference} · {rm(order.final_amount)}
              </h2>
              <p className="mt-0.5 truncate text-xs text-ink-3">
                {order.customer_name}
                {order.transfer_reference && (
                  <>
                    {' '}
                    · bank reference <span className="font-mono text-ink-2">{order.transfer_reference}</span>
                  </>
                )}
              </p>
            </div>
            <button type="button" className="btn btn-ghost size-9 shrink-0 px-0" onClick={onClose} aria-label="Close receipt">
              <X size={18} />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-auto bg-tint/50 p-4">
            {error ? (
              <p className="py-10 text-center text-sm text-bad">{error}</p>
            ) : !url ? (
              <div className="skeleton mx-auto h-80 w-full max-w-sm" aria-label="Loading receipt" />
            ) : isPdf ? (
              <iframe title={`Receipt for ${order.reference}`} src={url} className="h-[60dvh] w-full rounded-md border border-line bg-surface" />
            ) : (
              <img src={url} alt={`Receipt for ${order.reference}`} className="mx-auto max-h-[62dvh] w-auto rounded-md border border-line bg-surface object-contain" />
            )}
          </div>
          <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" className="text-link inline-flex items-center gap-1 text-xs">
                Open full size <ExternalLink size={12} />
              </a>
            ) : (
              <span />
            )}
            <button type="button" className="btn btn-primary" onClick={onReview}>
              Review order
            </button>
          </footer>
        </div>
      )}
    </dialog>
  )
}
