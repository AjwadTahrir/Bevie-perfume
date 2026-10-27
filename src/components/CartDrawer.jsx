import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Trash2, Upload, X } from 'lucide-react'
import ProductVisual from './ProductVisual'
import PaymentQr from './PaymentQr'
import { useCart } from '../lib/cart'
import { useCampaign } from '../lib/campaign'
import { createOrder, submitPayment, validatePromo, withdrawOrder } from '../lib/orders'
import { lockScroll, unlockScroll } from '../lib/scrollLock'
import { normalizePromoCode, priceOrder, PROMO_CODE_PATTERN } from '../../shared/campaign'
import { shop } from '../config/brand'
import { formatPrice } from '../lib/format'

const STEPS = [
  { key: 'cart', label: 'Cart' },
  { key: 'details', label: 'Details' },
  { key: 'payment', label: 'Payment' },
]
const EMPTY_CUSTOMER = { name: '', phone: '', email: '', address: '', notes: '' }
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const rm = (n) => formatPrice(n, 'RM 0')
const todayLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

/**
 * CART AND CHECKOUT
 * A side panel (full screen on phones) built on the native <dialog>:
 *   cart -> details -> payment (pay, add transfer reference, upload proof) -> done
 * Continuing from details creates the order on the server, which
 * returns its reference (BEV-2026-0001) and the amounts to pay. Prices
 * shown before that are a preview of the same rule (shared/campaign.js).
 */
export default function CartDrawer() {
  const cart = useCart()
  const campaign = useCampaign()
  const dialogRef = useRef(null)
  const scrollRef = useRef(null)
  const [step, setStep] = useState('cart')
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState(null) // { code, member: { name, role } } once the server accepts it
  const [promoError, setPromoError] = useState('')
  const [promoChecking, setPromoChecking] = useState(false)
  const [order, setOrder] = useState(null) // server response from createOrder, plus the signature it was made for
  const [transfer, setTransfer] = useState({ reference: '', paidOn: todayLocal() })
  const [proof, setProof] = useState(null) // { file, url }
  const [paid, setPaid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [placed, setPlaced] = useState(null) // { reference, total }

  const totals = priceOrder(cart.count, !!promo, campaign)
  // What the current order would be made from; a change means a new order.
  const signature = JSON.stringify([cart.items.map((l) => [l.id, l.quantity]), customer, promo?.code ?? null])

  // Open / close the native dialog with the cart state.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !cart.isOpen || dialog.open) return
    dialog.showModal()
    lockScroll()
  }, [cart.isOpen])

  const finishClose = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.classList.remove('is-closing')
    if (dialog.open) {
      dialog.close()
      unlockScroll()
    }
    cart.close()
    // After a placed order, the next visit starts from a fresh cart view.
    if (step === 'done') {
      setStep('cart')
      setPlaced(null)
    }
  }, [cart, step])

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog || !dialog.open || dialog.classList.contains('is-closing') || submitting) return
    if (prefersReducedMotion()) return finishClose()
    dialog.classList.add('is-closing')
    dialog.addEventListener('animationend', finishClose, { once: true })
  }, [finishClose, submitting])

  // Safety net if unmounted while open.
  useEffect(() => () => dialogRef.current?.open && unlockScroll(), [])

  // Release the proof preview URL when it is replaced or the panel unmounts.
  useEffect(() => () => proof?.url && URL.revokeObjectURL(proof.url), [proof])

  const go = (next) => {
    setError('')
    setStep(next)
    scrollRef.current?.scrollTo(0, 0)
  }

  const applyPromo = async () => {
    const code = normalizePromoCode(promoInput)
    if (!code) return setPromoError('Enter a promo code.')
    if (!PROMO_CODE_PATTERN.test(code)) return setPromoError('Promo codes are five letters or numbers.')
    setPromoChecking(true)
    try {
      const res = await validatePromo(code)
      setPromo({ code: res.code, member: res.member })
      setPromoInput(res.code)
      setPromoError('')
    } catch (e) {
      setPromo(null)
      setPromoError(e.message)
    } finally {
      setPromoChecking(false)
    }
  }

  const clearPromo = () => {
    setPromo(null)
    setPromoInput('')
    setPromoError('')
  }

  // Details -> payment: create the order (or reuse it if nothing changed).
  const continueToPayment = async () => {
    if (order?.signature === signature) return go('payment')
    setSubmitting(true)
    setError('')
    try {
      if (order) withdrawOrder(order)
      setOrder(null)
      const res = await createOrder({ customer, items: cart.items, promoCode: promo?.code })
      setOrder({ ...res, signature })
      setPaid(false)
      go('payment')
    } catch (e) {
      if (e.code === 'invalid_promo_code') {
        clearPromo()
        setPromoError(e.message)
        return go('cart')
      }
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const placeOrder = async () => {
    setSubmitting(true)
    setError('')
    try {
      await submitPayment({ orderId: order.orderId, token: order.token, transferReference: transfer.reference.trim(), paidOn: transfer.paidOn, file: proof.file })
      setPlaced({ reference: order.reference, total: order.finalAmount })
      cart.clear()
      setCustomer(EMPTY_CUSTOMER)
      clearPromo()
      setOrder(null)
      setTransfer({ reference: '', paidOn: todayLocal() })
      setProof(null)
      setPaid(false)
      go('done')
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <dialog
      ref={dialogRef}
      className="drawer"
      aria-labelledby="cart-title"
      onCancel={(e) => {
        e.preventDefault()
        requestClose()
      }}
      onClick={(e) => e.target === e.currentTarget && requestClose()}
    >
      <div className="flex h-full flex-col bg-cream-light">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-brown/15 px-5 py-4 md:px-7">
          {(step === 'details' || step === 'payment') && (
            <button
              type="button"
              onClick={() => go(step === 'payment' ? 'details' : 'cart')}
              className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-brown hover:bg-brown/5"
              aria-label="Back"
            >
              <ArrowLeft size={18} strokeWidth={1.5} />
            </button>
          )}
          <h2 id="cart-title" className="font-display text-2xl text-brown">
            {step === 'cart' ? 'Your Cart' : step === 'done' ? 'Order Received' : 'Checkout'}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            className="ml-auto inline-flex size-10 items-center justify-center rounded-full border border-brown/25 text-brown transition-colors hover:bg-brown hover:text-cream"
            aria-label="Close cart"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {step !== 'done' && cart.items.length > 0 && (
          <ol className="flex gap-2 px-5 pt-4 md:px-7" aria-label="Checkout progress">
            {STEPS.map((s, i) => (
              <li key={s.key} className="flex-1" aria-current={s.key === step ? 'step' : undefined}>
                <span className={`block h-0.5 ${i <= stepIndex ? 'bg-rust' : 'bg-brown/15'}`} />
                <span className={`mt-2 block text-[0.62rem] font-medium uppercase tracking-[0.2em] ${i <= stepIndex ? 'text-brown' : 'text-brown-soft/70'}`}>
                  {s.label}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 md:px-7">
          {step === 'cart' && (
            <CartStep
              cart={cart}
              campaign={campaign}
              totals={totals}
              promo={promo}
              promoInput={promoInput}
              setPromoInput={(v) => {
                setPromoInput(v)
                setPromoError('')
              }}
              promoError={promoError}
              promoChecking={promoChecking}
              applyPromo={applyPromo}
              clearPromo={clearPromo}
              onClose={requestClose}
            />
          )}
          {step === 'details' && <DetailsStep customer={customer} setCustomer={setCustomer} onNext={continueToPayment} />}
          {step === 'payment' && order && (
            <PaymentStep
              order={order}
              transfer={transfer}
              setTransfer={setTransfer}
              proof={proof}
              setProof={setProof}
              paid={paid}
              setPaid={setPaid}
            />
          )}
          {step === 'done' && placed && <DoneStep placed={placed} onClose={requestClose} />}
        </div>

        {/* Footer actions */}
        {step === 'cart' && cart.items.length > 0 && (
          <Footer>
            <button type="button" className="btn btn-primary w-full" onClick={() => go('details')} disabled={promoChecking}>
              Checkout · {rm(totals.finalAmount)}
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </Footer>
        )}
        {step === 'details' && (
          <Footer>
            {error && (
              <p role="alert" className="mb-3 text-sm text-rust-deep">
                {error}
              </p>
            )}
            <button type="submit" form="checkout-details" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? 'Creating your order…' : 'Continue to Payment'}
              {!submitting && <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />}
            </button>
          </Footer>
        )}
        {step === 'payment' && (
          <Footer>
            {error && (
              <p role="alert" className="mb-3 text-sm text-rust-deep">
                {error}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={!proof || !paid || transfer.reference.trim().length < 3 || submitting}
              onClick={placeOrder}
            >
              {submitting ? 'Sending payment…' : 'Submit Payment'}
              {!submitting && <Check size={16} strokeWidth={1.5} aria-hidden="true" />}
            </button>
            {(!proof || !paid || transfer.reference.trim().length < 3) && (
              <p className="mt-2 text-center text-xs text-brown-soft">Add the transfer reference, upload your proof and confirm to finish.</p>
            )}
          </Footer>
        )}
      </div>
    </dialog>
  )
}

function Footer({ children }) {
  return <div className="border-t border-brown/15 bg-cream-light px-5 py-4 md:px-7">{children}</div>
}

function Summary({ totals, promo }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-brown-soft">
          Subtotal ({totals.quantity} × {rm(totals.originalUnitPrice)})
        </dt>
        <dd className="tabular-nums">{rm(totals.originalSubtotal)}</dd>
      </div>
      {promo && totals.discountTotal > 0 && (
        <div className="flex justify-between">
          <dt className="text-brown-soft">
            Promo {promo} ({totals.quantity} × {rm(totals.discountPerBottle)} off)
          </dt>
          <dd className="tabular-nums">− {rm(totals.discountTotal)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-brown-soft">Delivery</dt>
        <dd>{typeof shop.shippingFee === 'number' ? rm(shop.shippingFee) : 'Arranged after checkout'}</dd>
      </div>
      <div className="flex justify-between border-t border-brown/15 pt-3 font-display text-xl text-brown">
        <dt>Total</dt>
        <dd className="tabular-nums">{rm(totals.finalAmount)}</dd>
      </div>
    </dl>
  )
}

function CartStep({ cart, campaign, totals, promo, promoInput, setPromoInput, promoError, promoChecking, applyPromo, clearPromo, onClose }) {
  const inputId = useId()
  if (!cart.items.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-16 text-center">
        <p className="font-display text-2xl text-brown">Your cart is empty.</p>
        <p className="mt-2 text-sm text-brown-soft">Discover the collection and add a scent you love.</p>
        <button type="button" className="btn btn-outline mt-8" onClick={onClose}>
          Continue Browsing
        </button>
      </div>
    )
  }
  return (
    <>
      <ul className="divide-y divide-brown/10">
        {cart.items.map(({ id, quantity, perfume }) => (
          <li key={id} className="flex gap-4 py-4 first:pt-0">
            <span className="relative block size-20 shrink-0 overflow-hidden rounded-lg bg-cream-deep/60">
              <ProductVisual perfume={perfume} className="absolute inset-[6%] h-[88%] w-[88%]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg leading-tight text-brown">{perfume.name}</p>
                  <p className="text-xs text-brown-soft">{perfume.size ?? 'Size to be confirmed'}</p>
                </div>
                <p className="text-right text-sm tabular-nums">
                  {promo ? (
                    <>
                      <s className="block text-xs text-brown-soft">{rm(totals.originalUnitPrice * quantity)}</s>
                      {rm(totals.appliedUnitPrice * quantity)}
                    </>
                  ) : (
                    rm(campaign.sellingPrice * quantity)
                  )}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="inline-flex items-center rounded-full border border-brown/25" role="group" aria-label={`Quantity of ${perfume.name}`}>
                  <button
                    type="button"
                    className="inline-flex size-9 items-center justify-center text-brown disabled:opacity-35"
                    onClick={() => cart.setQuantity(id, quantity - 1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="inline-flex size-9 items-center justify-center text-brown disabled:opacity-35"
                    onClick={() => cart.setQuantity(id, quantity + 1)}
                    disabled={quantity >= shop.maxQuantityPerItem}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-9 items-center gap-1.5 text-xs text-brown-soft hover:text-rust-deep"
                  onClick={() => cart.remove(id)}
                >
                  <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
                  Remove<span className="sr-only"> {perfume.name}</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-brown/15 pt-6">
        <label htmlFor={inputId} className="type-label text-brown-soft">
          AJK promo code (optional)
        </label>
        {promo ? (
          <div className="mt-2 rounded-lg border border-ochre/60 bg-cream px-3 py-2.5 text-sm" role="status">
            <p className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <Check size={15} className="text-rust-deep" aria-hidden="true" />
                <span>
                  <strong className="font-medium tracking-[0.12em]">{promo.code}</strong> applied: {rm(totals.appliedUnitPrice)} per bottle (save{' '}
                  {rm(totals.discountPerBottle)} each)
                </span>
              </span>
              <button type="button" className="shrink-0 text-xs text-brown-soft underline underline-offset-4" onClick={clearPromo}>
                Remove
              </button>
            </p>
            <p className="mt-1 pl-[23px] text-xs text-brown-soft">
              Supporting {promo.member.name} ({promo.member.role})
            </p>
          </div>
        ) : (
          <>
            <div className="mt-2 flex gap-2">
              <input
                id={inputId}
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                placeholder="e.g. AB12C"
                maxLength={12}
                autoCapitalize="characters"
                autoComplete="off"
                aria-invalid={!!promoError}
                aria-describedby={`${inputId}-hint${promoError ? ` ${inputId}-err` : ''}`}
                className="field flex-1 uppercase tracking-[0.12em] placeholder:normal-case placeholder:tracking-normal"
              />
              <button type="button" className="btn btn-outline btn-small" onClick={applyPromo} disabled={promoChecking}>
                {promoChecking ? 'Checking…' : 'Apply'}
              </button>
            </div>
            <p id={`${inputId}-hint`} className="mt-2 text-xs text-brown-soft">
              With a committee member's code each bottle is {rm(campaign.discountedPrice)} instead of {rm(campaign.sellingPrice)}.
            </p>
            {promoError && (
              <p id={`${inputId}-err`} role="alert" className="mt-2 text-xs text-rust-deep">
                {promoError}
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-6">
        <Summary totals={totals} promo={promo?.code} />
      </div>
    </>
  )
}

const FIELDS = [
  { key: 'name', label: 'Full name', autoComplete: 'name', required: true },
  { key: 'phone', label: 'Phone (WhatsApp)', type: 'tel', autoComplete: 'tel', required: true, placeholder: 'e.g. 012-345 6789' },
  { key: 'email', label: 'Email (optional)', type: 'email', autoComplete: 'email' },
  { key: 'address', label: 'Delivery address', autoComplete: 'street-address', required: true, multiline: true },
  { key: 'notes', label: 'Order notes (optional)', multiline: true },
]

function DetailsStep({ customer, setCustomer, onNext }) {
  const baseId = useId()
  const [phoneError, setPhoneError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const digits = customer.phone.replace(/[^\d]/g, '')
    if (digits.length < 9 || digits.length > 13) return setPhoneError('Enter a valid phone number.')
    onNext()
  }

  return (
    <form id="checkout-details" onSubmit={onSubmit} className="space-y-5" noValidate={false}>
      <p className="text-sm text-brown-soft">We'll use these details to confirm your order and arrange delivery.</p>
      {FIELDS.map((f) => {
        const id = `${baseId}-${f.key}`
        const Tag = f.multiline ? 'textarea' : 'input'
        return (
          <div key={f.key}>
            <label htmlFor={id} className="type-label text-brown-soft">
              {f.label}
            </label>
            <Tag
              id={id}
              type={f.multiline ? undefined : f.type || 'text'}
              rows={f.multiline ? 3 : undefined}
              value={customer[f.key]}
              onChange={(e) => {
                setCustomer((c) => ({ ...c, [f.key]: e.target.value }))
                if (f.key === 'phone') setPhoneError('')
              }}
              required={f.required}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              aria-invalid={f.key === 'phone' && !!phoneError}
              aria-describedby={f.key === 'phone' && phoneError ? `${id}-err` : undefined}
              className="field mt-2 w-full"
            />
            {f.key === 'phone' && phoneError && (
              <p id={`${id}-err`} role="alert" className="mt-2 text-xs text-rust-deep">
                {phoneError}
              </p>
            )}
          </div>
        )
      })}
    </form>
  )
}

function PaymentStep({ order, transfer, setTransfer, proof, setProof, paid, setPaid }) {
  const fileId = useId()
  const refId = useId()
  const dateId = useId()
  const [fileError, setFileError] = useState('')
  const pay = shop.payment

  const onFile = (file) => {
    setFileError('')
    if (!file) return
    const okType = shop.proof.accept.split(',').includes(file.type)
    if (!okType) return setFileError('Please upload a JPG, PNG, WebP or PDF file.')
    if (file.size > shop.proof.maxSizeMB * 1024 * 1024) return setFileError(`The file must be ${shop.proof.maxSizeMB} MB or smaller.`)
    setProof({ file, url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null })
  }

  return (
    <div className="space-y-7">
      <section aria-labelledby="pay-1">
        <h3 id="pay-1" className="type-label text-brown">
          1 · Pay by transfer
        </h3>
        <div className="mt-4 flex flex-col items-center rounded-xl border border-ochre/50 bg-cream px-5 py-6 text-center">
          <PaymentQr />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-brown-soft">{pay.method}</p>
          {(pay.accountName || pay.bankName) && (
            <p className="mt-1 text-sm text-brown">{[pay.accountName, pay.bankName].filter(Boolean).join(' · ')}</p>
          )}
          <p className="mt-4 font-display text-3xl text-brown tabular-nums">{rm(order.finalAmount)}</p>
          {typeof shop.shippingFee !== 'number' && <p className="mt-1 text-xs text-brown-soft">Excludes delivery, which we'll confirm with you.</p>}
        </div>
        <p className="mt-4 text-sm">
          Your order reference. Add it to the transfer's recipient reference:
          <span className="mt-2 block rounded-lg border border-dashed border-brown/35 bg-cream px-3 py-2 text-center font-medium tracking-[0.18em] select-all">
            {order.reference}
          </span>
        </p>
        {order.promoCode && (
          <p className="mt-2 text-xs text-brown-soft">
            Promo code {order.promoCode} applied{order.memberName ? `, credited to ${order.memberName}` : ''}.
          </p>
        )}
      </section>

      <section aria-labelledby="pay-2" className="space-y-5">
        <h3 id="pay-2" className="type-label text-brown">
          2 · Transfer details
        </h3>
        <div>
          <label htmlFor={refId} className="type-label text-brown-soft">
            Transfer reference number
          </label>
          <input
            id={refId}
            value={transfer.reference}
            onChange={(e) => setTransfer((t) => ({ ...t, reference: e.target.value }))}
            maxLength={80}
            required
            autoComplete="off"
            placeholder="From your banking app's receipt"
            className="field mt-2 w-full"
          />
        </div>
        <div>
          <label htmlFor={dateId} className="type-label text-brown-soft">
            Payment date
          </label>
          <input
            id={dateId}
            type="date"
            value={transfer.paidOn}
            max={todayLocal()}
            onChange={(e) => setTransfer((t) => ({ ...t, paidOn: e.target.value }))}
            className="field mt-2 w-full"
          />
        </div>
      </section>

      <section aria-labelledby="pay-3">
        <h3 id="pay-3" className="type-label text-brown">
          3 · Upload proof of payment
        </h3>
        <label
          htmlFor={fileId}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brown/35 bg-cream px-4 py-6 text-center transition-colors hover:border-brown focus-within:border-brown"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onFile(e.dataTransfer.files?.[0])
          }}
        >
          {proof ? (
            <>
              {proof.url ? (
                <img src={proof.url} alt="Your proof of payment" className="max-h-44 rounded-md object-contain" />
              ) : (
                <span className="text-sm font-medium">PDF selected</span>
              )}
              <span className="max-w-full truncate text-xs text-brown-soft">{proof.file.name}</span>
              <span className="text-xs text-rust-deep underline underline-offset-4">Choose a different file</span>
            </>
          ) : (
            <>
              <Upload size={22} strokeWidth={1.5} className="text-brown" aria-hidden="true" />
              <span className="text-sm font-medium text-brown">Upload a screenshot or receipt</span>
              <span className="text-xs text-brown-soft">JPG, PNG, WebP or PDF · up to {shop.proof.maxSizeMB} MB</span>
            </>
          )}
          <input
            id={fileId}
            type="file"
            accept={shop.proof.accept}
            className="sr-only"
            aria-describedby={fileError ? `${fileId}-err` : undefined}
            onChange={(e) => {
              onFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        {fileError && (
          <p id={`${fileId}-err`} role="alert" className="mt-2 text-xs text-rust-deep">
            {fileError}
          </p>
        )}
      </section>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-rust)]" />
        <span>I have paid {rm(order.finalAmount)} and uploaded my proof of payment.</span>
      </label>

      <div className="rounded-xl bg-cream px-4 py-4">
        <Summary totals={order} promo={order.promoCode} />
      </div>
    </div>
  )
}

function DoneStep({ placed, onClose }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-ochre text-brown-deep">
        <Check size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="mt-6 font-display text-3xl text-brown">Thank you!</p>
      <p className="mt-3 max-w-xs text-sm text-brown-soft">
        We've received your order and proof of payment. A committee member will check the transfer and contact you to arrange delivery. Keep
        your order reference for any questions.
      </p>
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-brown-soft">Order reference</p>
      <p className="mt-1 font-medium tracking-[0.18em]">{placed.reference}</p>
      <p className="mt-1 text-sm text-brown-soft">Amount transferred {rm(placed.total)} · awaiting verification</p>
      <button type="button" className="btn btn-outline mt-8" onClick={onClose}>
        Continue Browsing
      </button>
    </div>
  )
}
