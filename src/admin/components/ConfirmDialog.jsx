import { useEffect, useId, useRef, useState } from 'react'

/**
 * Confirmation for consequential actions, on the native <dialog>
 * (focus trap, Escape to close). With `reasonLabel`, a reason of at
 * least 3 characters is required.
 */
export default function ConfirmDialog({ open, title, body, confirmLabel, tone = 'primary', reasonLabel, reasonOptional, onConfirm, onClose }) {
  const ref = useRef(null)
  const id = useId()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const d = ref.current
    if (open && !d.open) {
      setReason('')
      setError('')
      d.showModal()
    } else if (!open && d.open) d.close()
  }, [open])

  const needsReason = reasonLabel && !reasonOptional
  const submit = async (e) => {
    e.preventDefault()
    if (needsReason && reason.trim().length < 3) return setError('Please give a reason (at least 3 characters).')
    setBusy(true)
    setError('')
    try {
      await onConfirm(reason.trim())
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-t`}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-navy/40"
    >
      <form onSubmit={submit} className="p-6">
        <h2 id={`${id}-t`} className="text-base font-semibold">
          {title}
        </h2>
        {body && <div className="mt-2 text-sm text-ink-2">{body}</div>}
        {reasonLabel && (
          <div className="mt-4">
            <label htmlFor={`${id}-r`} className="label">
              {reasonLabel}
            </label>
            <textarea id={`${id}-r`} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="input" maxLength={500} />
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-bad">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-${tone}`} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
