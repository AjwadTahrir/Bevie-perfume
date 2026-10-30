import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, ExternalLink, FileText, PackageCheck, RotateCcw, XCircle } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, Field, Skeleton, StatusBadge } from '../components/ui'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toasts'
import { actions, fetchOrder, proofUrl } from '../lib/api'
import { useLiveData, useQuery } from '../lib/data'
import { displayName, fmtDateTime, rm } from '../lib/format'
import { HISTORY_LABEL, ORDER_STATUS, PAYMENT_STATUS } from '../lib/status'

const fileSize = (b) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)

/** Receipt preview. The latest one loads straight away; earlier ones wait for a click. */
function ProofViewer({ submission, autoOpen }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isPdf = submission.proof_mime === 'application/pdf'

  const open = async () => {
    setLoading(true)
    setError('')
    try {
      setUrl(await proofUrl(submission.proof_path))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (autoOpen) open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, submission.id])

  if (!url) {
    return (
      <div>
        {loading ? (
          <div className="skeleton h-72 w-full max-w-sm" aria-label="Loading receipt" />
        ) : (
          <button type="button" className="btn btn-secondary" onClick={open}>
            <FileText size={15} /> View proof ({isPdf ? 'PDF' : 'image'})
          </button>
        )}
        {error && <p className="mt-2 text-xs text-bad">{error}</p>}
      </div>
    )
  }
  return (
    <div>
      <div className="rounded-md border border-line bg-tint/50 p-3">
        {isPdf ? (
          <iframe title="Proof of payment" src={url} className="h-[480px] w-full rounded bg-surface" />
        ) : (
          <img src={url} alt="Customer's proof of payment" className="mx-auto max-h-[560px] w-auto rounded object-contain" />
        )}
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-ink-3">
        <a href={url} target="_blank" rel="noreferrer" className="text-link inline-flex items-center gap-1">
          Open full size <ExternalLink size={12} />
        </a>
        <span>Private link, expires in 5 minutes.</span>
      </p>
    </div>
  )
}

const DIALOGS = {
  verify: {
    title: 'Verify this payment?',
    confirmLabel: 'Verify payment',
    tone: 'good',
    reasonLabel: 'Note (optional)',
    reasonOptional: true,
    body: 'Confirm that the transfer is in the bank account for the exact amount. The bottles will count towards sales, targets and profit.',
    done: 'Payment verified. Sales and rankings updated.',
  },
  reject: {
    title: 'Reject this payment?',
    confirmLabel: 'Reject payment',
    tone: 'danger',
    reasonLabel: 'Reason (shared with the team)',
    body: 'Use this when the transfer cannot be found or the amount is wrong.',
    done: 'Payment rejected.',
  },
  cancel: {
    title: 'Cancel this order?',
    confirmLabel: 'Cancel order',
    tone: 'danger',
    reasonLabel: 'Reason',
    body: 'The order will no longer count as pending. This cannot be undone.',
    done: 'Order cancelled.',
  },
  refund: {
    title: 'Mark as refunded?',
    confirmLabel: 'Mark refunded',
    tone: 'danger',
    reasonLabel: 'Reason',
    body: 'Only after the money has been returned. The bottles, revenue and profit are removed from the sales totals and the order is cancelled.',
    done: 'Refund recorded. Sales totals updated.',
  },
  fulfil: { title: 'Mark as fulfilled?', confirmLabel: 'Mark fulfilled', tone: 'primary', body: 'The perfume has been delivered or collected.', done: 'Order marked as fulfilled.' },
}

export default function OrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { refresh } = useLiveData()
  const q = useQuery(() => fetchOrder(id), [id])
  const [dialog, setDialog] = useState(null)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const back = (
    <Link to="/orders" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-brand-deep">
      <ArrowLeft size={15} /> Orders
    </Link>
  )
  if (q.loading && !q.data) {
    return (
      <>
        {back}
        <Skeleton className="h-10 w-64" />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </>
    )
  }
  if (q.error && !q.data) {
    return (
      <>
        {back}
        <ErrorState error={q.error} />
      </>
    )
  }
  const { order: o, items, submissions, history, notes } = q.data
  if (!o) return <EmptyState title="Order not found">It may have been removed, or the link is wrong.</EmptyState>

  const can = {
    verify: o.order_status !== 'cancelled' && ['awaiting_payment', 'submitted', 'rejected'].includes(o.payment_status),
    reject: o.order_status !== 'cancelled' && ['awaiting_payment', 'submitted'].includes(o.payment_status),
    cancel: o.order_status !== 'cancelled' && o.payment_status !== 'verified',
    refund: o.payment_status === 'verified',
    fulfil: o.payment_status === 'verified' && o.order_status === 'pending',
  }

  const run = async (kind, reason) => {
    try {
      await actions[kind](o.id, reason)
      toast(DIALOGS[kind].done)
    } finally {
      refresh()
    }
  }

  const addNote = async (e) => {
    e.preventDefault()
    if (!note.trim()) return
    setSavingNote(true)
    try {
      await actions.note(o.id, note)
      setNote('')
      toast('Note added.')
      refresh()
    } catch (err) {
      toast(err.message, 'bad')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <>
      {back}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-5 border-b border-line pb-6">
        <div className="min-w-0">
          <p className="eyebrow">Order</p>
          <h1 className="display mt-2 text-[2rem] leading-none sm:text-[2.5rem]">{o.reference}</h1>
          <p className="mt-2 text-sm text-ink-2">
            Placed {fmtDateTime(o.created_at)} · {o.quantity} {o.quantity === 1 ? 'bottle' : 'bottles'} · <span className="font-medium text-ink tabular-nums">{rm(o.final_amount)}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
            <StatusBadge map={ORDER_STATUS} value={o.order_status} />
            {o.is_verified ? <Badge tone="good">Counted in sales</Badge> : o.is_pending ? <Badge tone="info">Pending, not counted</Badge> : <Badge>Not counted</Badge>}
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {can.verify && (
            <button type="button" className="btn btn-good flex-1 sm:flex-none" onClick={() => setDialog('verify')}>
              <CheckCircle2 size={15} /> Verify payment
            </button>
          )}
          {can.fulfil && (
            <button type="button" className="btn btn-primary flex-1 sm:flex-none" onClick={() => setDialog('fulfil')}>
              <PackageCheck size={15} /> Mark fulfilled
            </button>
          )}
          {can.reject && (
            <button type="button" className="btn btn-secondary flex-1 sm:flex-none" onClick={() => setDialog('reject')}>
              <XCircle size={15} /> Reject
            </button>
          )}
          {can.refund && (
            <button type="button" className="btn btn-secondary flex-1 sm:flex-none" onClick={() => setDialog('refund')}>
              <RotateCcw size={15} /> Refund
            </button>
          )}
          {can.cancel && (
            <button type="button" className="btn btn-ghost flex-1 text-bad hover:bg-bad-soft hover:text-bad sm:flex-none" onClick={() => setDialog('cancel')}>
              <Ban size={15} /> Cancel order
            </button>
          )}
        </div>
      </header>

      {o.duplicate_transfer_reference && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            <strong className="font-medium">Duplicate transfer reference.</strong> The reference "{o.transfer_reference}" was also submitted for another order. Check the bank
            statement before verifying.
          </p>
        </div>
      )}
      {o.payment_status === 'rejected' && o.rejection_reason && (
        <p className="mb-4 rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
          <strong className="font-medium">Rejected:</strong> {o.rejection_reason}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card title="Payment receipt" description="Submitted by the customer. Verification is a human check against the bank account.">
            {!submissions.length ? (
              <p className="text-sm text-ink-3">The customer has not submitted a payment yet.</p>
            ) : (
              <div className="space-y-6">
                {submissions.map((s, i) => (
                  <div key={s.id} className={i ? 'border-t border-line pt-6' : ''}>
                    {i > 0 && <p className="eyebrow mb-2">Earlier submission</p>}
                    <dl className="mb-4 grid gap-4 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="eyebrow">Bank reference</dt>
                        <dd className="mt-1">{s.transfer_reference ? <span className="font-mono">{s.transfer_reference}</span> : <span className="text-ink-3">None given</span>}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow">Submitted</dt>
                        <dd className="mt-1">{fmtDateTime(s.created_at)}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow">File</dt>
                        <dd className="mt-1">
                          {s.proof_mime.split('/')[1].toUpperCase()} · {fileSize(s.proof_size)}
                        </dd>
                      </div>
                    </dl>
                    <ProofViewer submission={s} autoOpen={i === 0} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Status history" description="Every change, who made it and when">
            <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[3px] before:w-px before:bg-line">
              {history.map((h, i) => (
                <li key={h.id} className="relative flex gap-4">
                  <span className={`relative mt-1.5 size-[7px] shrink-0 rounded-full ring-4 ring-surface ${i === history.length - 1 ? 'bg-brand' : 'bg-line-strong'}`} aria-hidden="true" />
                  <div className="min-w-0 text-sm">
                    <p>
                      <span className="font-medium">{HISTORY_LABEL[h.action] || h.action}</span>
                      <span className="text-ink-3"> · {h.actor_label}</span>
                    </p>
                    <p className="text-xs text-ink-3">{fmtDateTime(h.created_at)}</p>
                    {h.note && <p className="mt-1 text-ink-2">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card title="Order summary" description="Prices saved when the order was placed">
            <ul className="divide-y divide-line">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-4 py-2 text-sm">
                  <span>{it.perfume_name}</span>
                  <span className="text-ink-2 tabular-nums">× {it.quantity}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 divide-y divide-line border-t border-line-strong/70 pt-1">
              <Field label={`${o.quantity} × ${rm(o.original_unit_price)}`}>
                <span className="tabular-nums">{rm(o.original_subtotal)}</span>
              </Field>
              <Field label="Promo discount">{Number(o.discount_total) ? <span className="tabular-nums">− {rm(o.discount_total)}</span> : '—'}</Field>
              <Field label="Postage">{Number(o.shipping_amount) ? <span className="tabular-nums">{rm(o.shipping_amount)}</span> : '—'}</Field>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="font-medium text-ink">Final amount</dt>
                <dd className="display text-2xl">{rm(o.final_amount)}</dd>
              </div>
              <Field label="Campaign profit">{o.is_verified ? <span className="tabular-nums">{rm(o.profit_amount)}</span> : <span className="text-ink-3">{rm(o.profit_amount)} once verified</span>}</Field>
            </dl>
          </Card>

          <Card title="AJK & promo code">
            {o.promo_code ? (
              <dl>
                <Field label="Code">
                  <span className="font-mono">{o.promo_code}</span>
                </Field>
                <Field label="AJK member">
                  <Link to={`/members/${o.ajk_member_id}`} className="text-link">
                    {displayName(o.member_name || o.ajk_member_name)}
                  </Link>
                </Field>
                <Field label="Jawatan / Biro">{o.member_role}</Field>
              </dl>
            ) : (
              <p className="text-sm text-ink-3">No code used. Full price, not attributed to an AJK member.</p>
            )}
          </Card>

          <Card title="Customer">
            <dl>
              <Field label="Name">{o.customer_name}</Field>
              <Field label="Phone">
                <a href={`tel:${o.customer_phone}`} className="text-link">
                  {o.customer_phone}
                </a>
              </Field>
              {o.customer_email && <Field label="Email">{o.customer_email}</Field>}
              <Field label="Receiving by">{o.fulfillment_method === 'delivery' ? 'Delivery' : o.fulfillment_method === 'collection' ? (o.promo_code ? `Collection from ${displayName(o.member_name || o.ajk_member_name)}` : 'Collection, no AJK: arrange on WhatsApp') : 'Not chosen: arrange on WhatsApp'}</Field>
            </dl>
            {o.delivery_address && (
              <>
                <p className="eyebrow mt-4">Delivery address</p>
                <p className="mt-1 text-sm whitespace-pre-line">{o.delivery_address}</p>
              </>
            )}
            {o.customer_notes && (
              <>
                <p className="eyebrow mt-4">Customer notes</p>
                <p className="mt-1 text-sm whitespace-pre-line">{o.customer_notes}</p>
              </>
            )}
          </Card>

          <Card title="Internal notes" description="Visible to admins only">
            {notes.length > 0 && (
              <ul className="mb-4 space-y-3">
                {notes.map((nt) => (
                  <li key={nt.id} className="border-l-2 border-gold/70 pl-3 text-sm">
                    <p className="whitespace-pre-line">{nt.body}</p>
                    <p className="mt-1 text-xs text-ink-3">
                      {nt.author_label} · {fmtDateTime(nt.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addNote}>
              <label htmlFor="note" className="sr-only">
                Add a note
              </label>
              <textarea id="note" rows={2} className="input" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
              <button type="submit" className="btn btn-secondary mt-2" disabled={savingNote || !note.trim()}>
                {savingNote ? 'Saving…' : 'Add note'}
              </button>
            </form>
          </Card>
        </div>
      </div>

      {Object.entries(DIALOGS).map(([kind, cfg]) => (
        <ConfirmDialog
          key={kind}
          open={dialog === kind}
          {...cfg}
          body={
            <>
              <p>{cfg.body}</p>
              <p className="mt-3 rounded-md bg-tint px-3 py-2 font-medium text-ink tabular-nums">
                {o.reference} · {o.quantity} bottles · {rm(o.final_amount)}
              </p>
            </>
          }
          onConfirm={(reason) => run(kind, reason)}
          onClose={() => setDialog(null)}
        />
      ))}
    </>
  )
}
