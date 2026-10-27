import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Trash2, Upload, X } from 'lucide-react'
import ProductVisual from './ProductVisual'
import PaymentQr from './PaymentQr'
import { useCart, orderTotals } from '../lib/cart'
import { createOrderReference, submitOrder } from '../lib/orders'
import { lockScroll, unlockScroll } from '../lib/scrollLock'
import { isValidReferralCode, normalizeReferralCode } from '../data/referralCodes'
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

/**
 * CART AND CHECKOUT
 * A side panel (full screen on phones) built on the native <dialog>:
 *   cart -> details -> payment (scan QR, upload proof) -> done
 * Orders go through src/lib/orders.js, which is a placeholder until a
 * database is connected.
 */
export default function CartDrawer() {
  const cart = useCart()
  const dialogRef = useRef(null)
  const scrollRef = useRef(null)
  const [step, setStep] = useState('cart')
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [referralInput, setReferralInput] = useState('')
  const [referral, setReferral] = useState('') // applied, valid code
  const [referralError, setReferralError] = useState('')
  const [reference, setReference] = useState('')
  const [proof, setProof] = useState(null) // { file, url }
  const [paid, setPaid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [placed, setPlaced] = useState(null) // { reference, total }

  const totals = orderTotals(cart.subtotal, !!referral)

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
    if (next === 'payment' && !reference) setReference(createOrderReference())
    setStep(next)
    scrollRef.current?.scrollTo(0, 0)
  }

  const applyReferral = () => {
    const code = normalizeReferralCode(referralInput)
    if (!code) return setReferralError('Enter a referral code.')
    if (!isValidReferralCode(code)) {
      setReferral('')
      return setReferralError('That code was not recognised. Check it and try again.')
    }
    setReferral(code)
    setReferralInput(code)
    setReferralError('')
  }

  const placeOrder = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await submitOrder({ reference, customer, items: cart.items, totals, referralCode: referral, proofFile: proof.file })
      setPlaced({ reference: res.reference, total: totals.total })
      cart.clear()
      setCustomer(EMPTY_CUSTOMER)
      setReferral('')
      setReferralInput('')
      setReference('')
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
              totals={totals}
              referral={referral}
              referralInput={referralInput}
              setReferralInput={(v) => {
                setReferralInput(v)
                setReferralError('')
              }}
              referralError={referralError}
              applyReferral={applyReferral}
              clearReferral={() => {
                setReferral('')
                setReferralInput('')
              }}
              onClose={requestClose}
            />
          )}
          {step === 'details' && <DetailsStep customer={customer} setCustomer={setCustomer} onNext={() => go('payment')} />}
          {step === 'payment' && (
            <PaymentStep
              totals={totals}
              reference={reference}
              referral={referral}
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
            <button type="button" className="btn btn-primary w-full" onClick={() => go('details')}>
              Checkout · {rm(totals.total)}
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </Footer>
        )}
        {step === 'details' && (
          <Footer>
            <button type="submit" form="checkout-details" className="btn btn-primary w-full">
              Continue to Payment
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
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
            <button type="button" className="btn btn-primary w-full" disabled={!proof || !paid || submitting} onClick={placeOrder}>
              {submitting ? 'Placing order…' : 'Place Order'}
              {!submitting && <Check size={16} strokeWidth={1.5} aria-hidden="true" />}
            </button>
            {(!proof || !paid) && (
              <p className="mt-2 text-center text-xs text-brown-soft">Upload your proof of payment and confirm to place the order.</p>
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

function Summary({ totals, referral }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-brown-soft">Subtotal</dt>
        <dd className="tabular-nums">{rm(totals.subtotal)}</dd>
      </div>
      {referral && (
        <div className="flex justify-between">
          <dt className="text-brown-soft">Referral code {referral}</dt>
          <dd className="tabular-nums">{totals.discount ? `− ${rm(totals.discount)}` : 'Applied'}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-brown-soft">Delivery</dt>
        <dd>{totals.shippingKnown ? rm(totals.shipping) : 'Calculated after checkout'}</dd>
      </div>
      <div className="flex justify-between border-t border-brown/15 pt-3 font-display text-xl text-brown">
        <dt>Total</dt>
        <dd className="tabular-nums">{rm(totals.total)}</dd>
      </div>
    </dl>
  )
}

function CartStep({ cart, totals, referral, referralInput, setReferralInput, referralError, applyReferral, clearReferral, onClose }) {
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
                <p className="text-sm tabular-nums">{rm((perfume.price ?? 0) * quantity)}</p>
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
          Referral code (optional)
        </label>
        {referral ? (
          <p className="mt-2 flex items-center justify-between rounded-lg border border-ochre/60 bg-cream px-3 py-2.5 text-sm">
            <span className="inline-flex items-center gap-2">
              <Check size={15} className="text-rust-deep" aria-hidden="true" />
              <span>
                <strong className="font-medium tracking-[0.12em]">{referral}</strong> applied
              </span>
            </span>
            <button type="button" className="text-xs text-brown-soft underline underline-offset-4" onClick={clearReferral}>
              Remove
            </button>
          </p>
        ) : (
          <>
            <div className="mt-2 flex gap-2">
              <input
                id={inputId}
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyReferral()}
                placeholder="e.g. AB12C"
                maxLength={12}
                autoCapitalize="characters"
                autoComplete="off"
                aria-invalid={!!referralError}
                aria-describedby={referralError ? `${inputId}-err` : undefined}
                className="field flex-1 uppercase tracking-[0.12em] placeholder:normal-case placeholder:tracking-normal"
              />
              <button type="button" className="btn btn-outline btn-small" onClick={applyReferral}>
                Apply
              </button>
            </div>
            {referralError && (
              <p id={`${inputId}-err`} role="alert" className="mt-2 text-xs text-rust-deep">
                {referralError}
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-6">
        <Summary totals={totals} referral={referral} />
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

function PaymentStep({ totals, reference, referral, proof, setProof, paid, setPaid }) {
  const fileId = useId()
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
          1 · Scan and pay
        </h3>
        <div className="mt-4 flex flex-col items-center rounded-xl border border-ochre/50 bg-cream px-5 py-6 text-center">
          <PaymentQr />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-brown-soft">{pay.method}</p>
          {(pay.accountName || pay.bankName) && (
            <p className="mt-1 text-sm text-brown">{[pay.accountName, pay.bankName].filter(Boolean).join(' · ')}</p>
          )}
          <p className="mt-4 font-display text-3xl text-brown tabular-nums">{rm(totals.total)}</p>
          {!totals.shippingKnown && <p className="mt-1 text-xs text-brown-soft">Excludes delivery, which we'll confirm with you.</p>}
        </div>
        <p className="mt-4 text-sm">
          Add this reference to your transfer:
          <span className="mt-2 block rounded-lg border border-dashed border-brown/35 bg-cream px-3 py-2 text-center font-medium tracking-[0.18em] select-all">
            {reference}
          </span>
        </p>
        {referral && <p className="mt-2 text-xs text-brown-soft">Referral code {referral} will be recorded with this order.</p>}
      </section>

      <section aria-labelledby="pay-2">
        <h3 id="pay-2" className="type-label text-brown">
          2 · Upload proof of payment
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
        <span>I have paid {rm(totals.total)} and uploaded my proof of payment.</span>
      </label>

      <div className="rounded-xl bg-cream px-4 py-4">
        <Summary totals={totals} referral={referral} />
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
        We've received your order and proof of payment. We'll verify the payment and contact you to arrange delivery.
      </p>
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-brown-soft">Order reference</p>
      <p className="mt-1 font-medium tracking-[0.18em]">{placed.reference}</p>
      <p className="mt-1 text-sm text-brown-soft">Total paid {rm(placed.total)}</p>
      <button type="button" className="btn btn-outline mt-8" onClick={onClose}>
        Continue Browsing
      </button>
    </div>
  )
}
