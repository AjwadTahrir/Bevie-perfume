import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, ExternalLink, FileText, PackageCheck, RotateCcw, XCircle } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, Field, Skeleton, StatusBadge } from '../components/ui'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toasts'
import { actions, fetchOrder, proofUrl } from '../lib/api'
import { useLiveData, useQuery } from '../lib/data'
import { displayName, fmtDate, fmtDateTime, rm } from '../lib/format'
import { HISTORY_LABEL, ORDER_STATUS, PAYMENT_STATUS } from '../lib/status'

const fileSize = (b) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)

function ProofViewer({ submission }) {
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

  if (!url) {
    return (
      <div>
        <button type="button" className="btn btn-secondary" onClick={open} disabled={loading}>
          <FileText size={15} /> {loading ? 'Opening…' : `View proof (${isPdf ? 'PDF' : 'image'})`}
        </button>
        {error && <p className="mt-2 text-xs text-bad">{error}</p>}
        <p className="mt-2 text-xs text-ink-3">Opens a private link that expires in 5 minutes.</p>
      </div>
    )
  }
  return (
    <div>
      {isPdf ? (
        <iframe title="Proof of payment" src={url} className="h-[480px] w-full rounded-lg border border-line" />
      ) : (
        <img src={url} alt="Customer's proof of payment" className="max-h-[560px] w-full rounded-lg border border-line bg-canvas object-contain" />
      )}
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-info hover:underline">
        Open in new tab <ExternalLink size={12} />
      </a>
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
    <Link to="/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
      <ArrowLeft size={15} /> Orders
    </Link>
  )
  if (q.loading && !q.data) {
    return (
      <>
        {back}
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight tabular-nums">{o.reference}</h1>
          <p className="mt-1 text-sm text-ink-2">Placed {fmtDateTime(o.created_at)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
            <StatusBadge map={ORDER_STATUS} value={o.order_status} />
            {o.is_verified ? <Badge tone="good">Counted in sales</Badge> : o.is_pending ? <Badge tone="info">Pending, not counted</Badge> : <Badge>Not counted</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {can.verify && (
            <button type="button" className="btn btn-good" onClick={() => setDialog('verify')}>
              <CheckCircle2 size={15} /> Verify payment
            </button>
          )}
          {can.reject && (
            <button type="button" className="btn btn-secondary" onClick={() => setDialog('reject')}>
              <XCircle size={15} /> Reject
            </button>
          )}
          {can.fulfil && (
            <button type="button" className="btn btn-secondary" onClick={() => setDialog('fulfil')}>
              <PackageCheck size={15} /> Mark fulfilled
            </button>
          )}
          {can.refund && (
            <button type="button" className="btn btn-secondary" onClick={() => setDialog('refund')}>
              <RotateCcw size={15} /> Refund
            </button>
          )}
          {can.cancel && (
            <button type="button" className="btn btn-ghost text-bad" onClick={() => setDialog('cancel')}>
              <Ban size={15} /> Cancel order
            </button>
          )}
        </div>
      </div>

      {o.duplicate_transfer_reference && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            <strong className="font-medium">Duplicate transfer reference.</strong> The reference "{o.transfer_reference}" was also submitted for another order. Check the bank
            statement before verifying.
          </p>
        </div>
      )}
      {o.payment_status === 'rejected' && o.rejection_reason && (
        <p className="mb-4 rounded-xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">Rejected: {o.rejection_reason}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Payment" description="Submitted by the customer. Verification is a human check against the bank account.">
            {!submissions.length ? (
              <p className="text-sm text-ink-3">The customer has not submitted a payment yet.</p>
            ) : (
              <div className="space-y-6">
                {submissions.map((s, i) => (
                  <div key={s.id} className={i ? 'border-t border-line pt-6' : ''}>
                    {i > 0 && <p className="mb-2 text-xs font-medium text-ink-3">Earlier submission</p>}
                    <dl className="mb-4 grid gap-x-6 sm:grid-cols-2">
                      <Field label="Transfer reference">
                        <span className="font-mono">{s.transfer_reference}</span>
                      </Field>
                      <Field label="Payment date">{fmtDate(s.paid_on)}</Field>
                      <Field label="Submitted">{fmtDateTime(s.created_at)}</Field>
                      <Field label="File">
                        {s.proof_mime.split('/')[1].toUpperCase()} · {fileSize(s.proof_size)}
                      </Field>
                    </dl>
                    <ProofViewer submission={s} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Items" bodyClass="p-0">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="td">{it.perfume_name}</td>
                    <td className="td text-right text-ink-2 tabular-nums">× {it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Status history" description="Every change, who made it and when">
            <ol className="space-y-4">
              {history.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
                  <div className="text-sm">
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

        <div className="space-y-4">
          <Card title="Amounts" description="Saved when the order was placed">
            <dl className="divide-y divide-line">
              <Field label={`${o.quantity} × ${rm(o.original_unit_price)}`}>{rm(o.original_subtotal)}</Field>
              <Field label="Promo discount">{Number(o.discount_total) ? `− ${rm(o.discount_total)}` : '—'}</Field>
              <Field label={<span className="font-medium text-ink">Final amount</span>}>
                <span className="font-semibold">{rm(o.final_amount)}</span>
              </Field>
              <Field label="Campaign profit">{o.is_verified ? rm(o.profit_amount) : <span className="text-ink-3">{rm(o.profit_amount)} once verified</span>}</Field>
            </dl>
          </Card>

          <Card title="Promo code">
            {o.promo_code ? (
              <dl>
                <Field label="Code">
                  <span className="font-mono">{o.promo_code}</span>
                </Field>
                <Field label="AJK member">
                  <Link to={`/members/${o.ajk_member_id}`} className="text-info hover:underline">
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
                <a href={`tel:${o.customer_phone}`} className="text-info hover:underline">
                  {o.customer_phone}
                </a>
              </Field>
              {o.customer_email && <Field label="Email">{o.customer_email}</Field>}
            </dl>
            <p className="mt-3 text-xs font-medium text-ink-3">Delivery address</p>
            <p className="mt-1 text-sm whitespace-pre-line">{o.delivery_address}</p>
            {o.customer_notes && (
              <>
                <p className="mt-3 text-xs font-medium text-ink-3">Customer notes</p>
                <p className="mt-1 text-sm whitespace-pre-line">{o.customer_notes}</p>
              </>
            )}
          </Card>

          <Card title="Internal notes" description="Visible to admins only">
            {notes.length > 0 && (
              <ul className="mb-4 space-y-3">
                {notes.map((nt) => (
                  <li key={nt.id} className="rounded-lg bg-canvas px-3 py-2 text-sm">
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
              <p className="mt-2 font-medium text-ink">
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
