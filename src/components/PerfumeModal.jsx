import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { pack } from '../assets/pack'
import ProductVisual from './ProductVisual'
import WhatsAppButton from './WhatsAppButton'
import { fragranceFamilies, tintOf } from '../data/perfumes'
import { formatPrice } from '../lib/format'
import { orderMessage } from '../lib/whatsapp'

const NOTE_TIERS = [
  { key: 'top', label: 'Top' },
  { key: 'heart', label: 'Heart' },
  { key: 'base', label: 'Base' },
]

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Product detail dialog, built on the native <dialog> element:
 * focus is trapped and returned by the browser, Escape and backdrop
 * clicks close it with a short exit transition, and page scroll is
 * locked while it is open.
 */
export default function PerfumeModal({ perfume, onClose }) {
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)
  // Keep the last perfume rendered during the closing animation.
  const [shown, setShown] = useState(perfume)
  if (perfume && perfume !== shown) setShown(perfume)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !perfume) return
    returnFocusRef.current = document.activeElement
    if (!dialog.open) dialog.showModal()
    document.documentElement.style.overflow = 'hidden'
    dialog.querySelector('.modal-scroll')?.scrollTo(0, 0)
  }, [perfume])

  const finishClose = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.classList.remove('is-closing')
    if (dialog.open) dialog.close()
    document.documentElement.style.overflow = ''
    returnFocusRef.current?.focus?.()
    onClose()
  }, [onClose])

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog || !dialog.open || dialog.classList.contains('is-closing')) return
    if (prefersReducedMotion()) return finishClose()
    dialog.classList.add('is-closing')
    dialog.addEventListener('animationend', finishClose, { once: true })
  }, [finishClose])

  // Safety net: restore scrolling if the component unmounts while open.
  useEffect(() => () => (document.documentElement.style.overflow = ''), [])

  const p = shown
  const family = p ? fragranceFamilies[p.family] : null
  const tint = p ? tintOf(p) : undefined
  const hasNotes = p?.notes && NOTE_TIERS.some((t) => p.notes[t.key]?.length)

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="perfume-modal-title"
      onCancel={(e) => {
        e.preventDefault()
        requestClose()
      }}
      onClick={(e) => {
        // Clicks on the dialog element itself (outside the panel) are backdrop clicks.
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      {p && (
        <div className="relative flex h-full items-stretch md:h-auto md:p-0" onClick={(e) => e.target === e.currentTarget && requestClose()}>
          <button
            type="button"
            onClick={requestClose}
            className="absolute right-4 top-4 z-10 inline-flex size-11 items-center justify-center rounded-full border border-brown/30 bg-cream text-brown transition-colors hover:bg-brown hover:text-cream md:right-5 md:top-5"
            aria-label="Close details"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
          <div className="modal-scroll relative grid h-full w-full grid-cols-1 overflow-y-auto overscroll-contain bg-cream-light md:max-h-[min(52rem,calc(100dvh-3rem))] md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Visual */}
            <div className="relative flex min-h-[23rem] items-end justify-center overflow-hidden px-10 pt-16 md:min-h-full md:px-12 md:pt-20" style={{ background: tint }}>
              {p.scene ? (
                // The scent's own still life fills the panel; the props sit beside the bottle.
                <img
                  src={p.scene.src}
                  srcSet={p.scene.srcSet}
                  sizes="(min-width: 768px) 33rem, 100vw"
                  alt={p.scene.alt}
                  decoding="async"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: p.scene.position }}
                />
              ) : (
                <img src={pack.bouquet.src} srcSet={pack.bouquet.srcSet} sizes="(min-width: 768px) 34rem, 100vw" alt="" decoding="async" className="pointer-events-none absolute bottom-[20%] left-1/2 w-[118%] max-w-[36rem] -translate-x-1/2" />
              )}
              <div className="relative aspect-square w-[min(92%,24rem)]">
                <span className="absolute bottom-[7%] left-1/2 h-[5%] w-[50%] -translate-x-1/2 rounded-[50%] bg-brown-deep/40 blur-[10px]" aria-hidden="true" />
                <ProductVisual perfume={p} decorative={false} loading="eager" className="absolute inset-0 h-full w-full" />
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col px-6 pb-10 pt-8 md:px-12 md:pb-12 md:pt-16">
              <p className="type-label text-brown-soft">{family?.label ?? 'Family to be confirmed'}</p>
              <h2 id="perfume-modal-title" className="type-h2 mt-3 text-brown">
                {p.name}
              </h2>
              <p className="mt-5 max-w-prose text-[1.05rem] leading-relaxed">{p.description}</p>

              <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-ochre/60 py-6">
                <div>
                  <dt className="type-label text-brown-soft">Price</dt>
                  <dd className="mt-1.5 font-display text-2xl text-brown">{formatPrice(p.price, 'To be announced')}</dd>
                </div>
                <div>
                  <dt className="type-label text-brown-soft">Size</dt>
                  <dd className="mt-1.5 font-display text-2xl text-brown">{p.size ?? 'To be confirmed'}</dd>
                </div>
              </dl>

              <div className="mt-8">
                <h3 className="type-label text-brown-soft">Fragrance notes</h3>
                <dl className="mt-4 grid grid-cols-3 gap-4">
                  {NOTE_TIERS.map((tier) => (
                    <div key={tier.key}>
                      <dt className="font-display text-xl text-brown">{tier.label}</dt>
                      <dd className="mt-1 text-sm text-brown-soft">
                        {p.notes?.[tier.key]?.length ? p.notes[tier.key].join(', ') : 'To be announced'}
                      </dd>
                    </div>
                  ))}
                </dl>
                {!hasNotes && <p className="mt-4 text-sm text-brown-soft">Notes will be published with the final product details.</p>}
              </div>

              <div className="mt-10">
                <WhatsAppButton message={orderMessage(p.name)} label="Order Through WhatsApp" />
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
