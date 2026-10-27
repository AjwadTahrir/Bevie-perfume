import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, ShoppingBag, X } from 'lucide-react'
import { pack } from '../assets/pack'
import ProductVisual from './ProductVisual'
import WhatsAppButton from './WhatsAppButton'
import { fragranceFamilies, perfumes, tintOf } from '../data/perfumes'
import { formatPrice } from '../lib/format'
import { orderMessage } from '../lib/whatsapp'
import { useCart } from '../lib/cart'
import { lockScroll, unlockScroll } from '../lib/scrollLock'

const NOTE_TIERS = [
  { key: 'top', label: 'Top notes' },
  { key: 'heart', label: 'Heart notes' },
  { key: 'base', label: 'Base notes' },
]
const ACCORDS_SHOWN = 6

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pad = (n) => String(n).padStart(2, '0')

/**
 * Product detail dialog, built on the native <dialog> element:
 * focus is trapped and returned by the browser, Escape and backdrop
 * clicks close it with a short exit transition, and page scroll is
 * locked while it is open. Arrow buttons (and the left/right keys)
 * step through the collection without closing.
 */
export default function PerfumeModal({ perfume, onClose, onNavigate }) {
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)
  // Keep the last perfume rendered during the closing animation.
  const [shown, setShown] = useState(perfume)
  const [added, setAdded] = useState(false)
  if (perfume && perfume !== shown) {
    setShown(perfume)
    setAdded(false)
  }
  const cart = useCart()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !perfume) return
    if (!dialog.open) {
      returnFocusRef.current = document.activeElement
      dialog.showModal()
      lockScroll()
    }
    dialog.querySelector('.modal-scroll')?.scrollTo(0, 0)
  }, [perfume])

  const finishClose = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.classList.remove('is-closing')
    if (dialog.open) {
      dialog.close()
      unlockScroll()
    }
    returnFocusRef.current?.focus?.()
    setAdded(false)
    onClose()
  }, [onClose])

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog || !dialog.open || dialog.classList.contains('is-closing')) return
    if (prefersReducedMotion()) return finishClose()
    dialog.classList.add('is-closing')
    dialog.addEventListener('animationend', finishClose, { once: true })
  }, [finishClose])

  // Safety net: release the scroll lock if the component unmounts while open.
  useEffect(() => () => dialogRef.current?.open && unlockScroll(), [])

  const p = shown
  const index = p ? perfumes.findIndex((x) => x.id === p.id) : -1
  const prev = index >= 0 ? perfumes[(index - 1 + perfumes.length) % perfumes.length] : null
  const next = index >= 0 ? perfumes[(index + 1) % perfumes.length] : null
  const family = p ? fragranceFamilies[p.family] : null
  const tint = p ? tintOf(p) : undefined
  const hasNotes = p?.notes && NOTE_TIERS.some((t) => p.notes[t.key]?.length)
  const accords = p?.accords ? [...p.accords].sort((a, b) => b[1] - a[1]).slice(0, ACCORDS_SHOWN) : []

  const iconBtn =
    'inline-flex size-11 items-center justify-center rounded-full border border-brown/30 bg-cream text-brown transition-colors hover:bg-brown hover:text-cream'

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
      onKeyDown={(e) => {
        if (!onNavigate || e.altKey || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return
        if (e.key === 'ArrowLeft' && prev) onNavigate(prev)
        if (e.key === 'ArrowRight' && next) onNavigate(next)
      }}
    >
      {p && (
        <div className="relative flex h-full items-stretch md:h-auto md:p-0" onClick={(e) => e.target === e.currentTarget && requestClose()}>
          {/* Floating toolbar: solid backing so scrolling text passes cleanly beneath it */}
          <div className="absolute right-3 top-3 z-10 flex gap-1.5 rounded-full bg-cream-light/95 p-1.5 shadow-[0_8px_24px_-12px_rgb(58_36_32/0.45)] backdrop-blur-sm md:right-4 md:top-4">
            {onNavigate && (
              <>
                <button type="button" className={iconBtn} onClick={() => onNavigate(prev)} aria-label={`Previous scent: ${prev.name}`}>
                  <ChevronLeft size={20} strokeWidth={1.5} />
                </button>
                <button type="button" className={iconBtn} onClick={() => onNavigate(next)} aria-label={`Next scent: ${next.name}`}>
                  <ChevronRight size={20} strokeWidth={1.5} />
                </button>
              </>
            )}
            <button type="button" onClick={requestClose} className={iconBtn} aria-label="Close details">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
          <div className="modal-scroll relative grid h-full w-full grid-cols-1 overflow-y-auto overscroll-contain bg-cream-light md:max-h-[min(52rem,calc(100dvh-3rem))] md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Visual: stays in view while the details scroll */}
            <div
              className="relative flex min-h-[23rem] items-end justify-center overflow-hidden px-10 pt-16 md:sticky md:top-0 md:h-[min(52rem,calc(100dvh-3rem))] md:min-h-0 md:px-12 md:pt-20"
              style={{ background: tint }}
            >
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
            <div key={p.id} className="flex flex-col px-6 pb-10 pt-8 md:px-12 md:pb-12 md:pt-20">
              <p className="type-label text-brown-soft">
                {family?.label ?? 'Family to be confirmed'}
                {index >= 0 && (
                  <span className="text-brown-soft/70">
                    {' '}
                    · {pad(index + 1)} / {pad(perfumes.length)}
                  </span>
                )}
              </p>
              <h2 id="perfume-modal-title" className="type-h2 mt-3 text-brown">
                {p.name}
              </h2>
              {p.tagline && <p className="mt-2 font-display text-xl italic text-rust-deep">{p.tagline}</p>}
              <p className="mt-5 max-w-prose text-[1.05rem] leading-relaxed">{p.description}</p>
              {p.mood && <p className="mt-4 max-w-prose border-l border-ochre pl-4 text-sm italic leading-relaxed text-brown-soft">{p.mood}</p>}

              {/* Fragrance pyramid */}
              <section className="mt-12" aria-labelledby="pyramid-title">
                <h3 id="pyramid-title" className="type-label text-brown-soft">
                  Fragrance pyramid
                </h3>
                {hasNotes ? (
                  <div className="relative mt-5 px-2 pb-6 pt-4">
                    <span className="pyramid-shape absolute inset-x-[8%] inset-y-0 bg-cream-deep/70" aria-hidden="true" />
                    <dl className="relative space-y-4">
                      {NOTE_TIERS.map((tier) =>
                        p.notes?.[tier.key]?.length ? (
                          <div key={tier.key} className="text-center">
                            <dt className="text-[0.62rem] font-medium uppercase tracking-[0.24em] text-rust-deep">{tier.label}</dt>
                            <dd className="mt-2 flex flex-wrap justify-center gap-1.5">
                              {p.notes[tier.key].map((note) => (
                                <span key={note} className="rounded-full border border-brown/20 bg-cream-light px-3 py-1 text-[0.82rem] text-brown">
                                  {note}
                                </span>
                              ))}
                            </dd>
                          </div>
                        ) : null,
                      )}
                    </dl>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-brown-soft">Notes will be published with the final product details.</p>
                )}
              </section>

              {/* Main accords */}
              {accords.length > 0 && (
                <section className="mt-10" aria-labelledby="accords-title">
                  <h3 id="accords-title" className="type-label text-brown-soft">
                    Main accords
                  </h3>
                  <ul className="mt-5 space-y-3">
                    {accords.map(([label, value, color], i) => (
                      <li key={label} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
                        <span className="text-brown">{label}</span>
                        <span className="h-1.5 overflow-hidden rounded-full bg-brown/10" role="presentation">
                          <span
                            className="accord-bar block h-full rounded-full shadow-[inset_0_0_0_1px_rgb(79_50_45/0.18)]"
                            style={{ width: `${value}%`, background: color, '--i': i }}
                          />
                        </span>
                        <span className="text-right text-xs tabular-nums text-brown-soft">
                          {value}
                          <span className="sr-only"> out of 100</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Character facts */}
              {p.facts && (
                <section className="mt-10" aria-labelledby="facts-title">
                  <h3 id="facts-title" className="type-label text-brown-soft">
                    Character
                  </h3>
                  <dl className="mt-4 grid grid-cols-2 border-t border-ochre/50">
                    {Object.entries(p.facts).map(([label, value]) => (
                      <div key={label} className="border-b border-ochre/50 py-3 odd:pr-4">
                        <dt className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-brown-soft">{label}</dt>
                        <dd className="mt-1 font-display text-lg text-brown">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {/* Price, size and buying, at the end of the details */}
              <dl className="mt-12 grid grid-cols-2 gap-6 border-y border-ochre/60 py-6">
                <div>
                  <dt className="type-label text-brown-soft">Price</dt>
                  <dd className="mt-1.5 font-display text-2xl text-brown">{formatPrice(p.price, 'To be announced')}</dd>
                </div>
                <div>
                  <dt className="type-label text-brown-soft">Size</dt>
                  <dd className="mt-1.5 font-display text-2xl text-brown">{p.size ?? 'To be confirmed'}</dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {added ? (
                  <>
                    <p className="inline-flex min-h-[3.25rem] items-center gap-2 text-sm text-brown" role="status">
                      <Check size={16} className="text-rust-deep" aria-hidden="true" />
                      Added to your cart
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        requestClose()
                        cart.open()
                      }}
                    >
                      View Cart
                      <ShoppingBag size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={typeof p.price !== 'number'}
                    onClick={() => {
                      cart.add(p.id)
                      setAdded(true)
                    }}
                  >
                    Add to Cart
                    <ShoppingBag size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="mt-4">
                <WhatsAppButton message={orderMessage(p.name)} label="Ask on WhatsApp" variant="outline" />
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
