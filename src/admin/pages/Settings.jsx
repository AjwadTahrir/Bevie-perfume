import { useEffect, useState } from 'react'
import { Card, ErrorState, PageHeader, Skeleton } from '../components/ui'
import { useToast } from '../components/Toasts'
import { actions, fetchSettings } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/data'
import { supabase } from '../lib/supabase'
import { fmtDateTime } from '../lib/format'

const FIELDS = [
  { key: 'profit_per_bottle', label: 'Campaign profit per bottle (RM)', step: '0.01' },
  { key: 'campaign_target', label: 'Campaign target (bottles)', step: '1' },
  { key: 'member_target', label: 'Target per AJK member (bottles)', step: '1' },
]

function CampaignSettings() {
  const toast = useToast()
  const q = useQuery(() => fetchSettings(), [])
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (q.data && !form) setForm({ ...q.data, starts_on: q.data.starts_on ?? '', ends_on: q.data.ends_on ?? '' })
  }, [q.data, form])

  if (q.error && !q.data) return <ErrorState error={q.error} />
  if (!form) return <Skeleton className="h-80" />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const saved = await actions.updateSettings({
        campaign_name: form.campaign_name,
        profit_per_bottle: Number(form.profit_per_bottle),
        campaign_target: Number(form.campaign_target),
        member_target: Number(form.member_target),
        starts_on: form.starts_on || null,
        ends_on: form.ends_on || null,
      })
      setForm({ ...saved, starts_on: saved.starts_on ?? '', ends_on: saved.ends_on ?? '' })
      toast('Campaign settings saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Campaign" description={`Last changed ${fmtDateTime(form.updated_at)}`}>
      <form onSubmit={save} className="space-y-5">
        <div>
          <label htmlFor="campaign_name" className="label">
            Campaign name
          </label>
          <input id="campaign_name" className="input" value={form.campaign_name} onChange={set('campaign_name')} required minLength={3} maxLength={120} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <span className="label">Selling price (RM per bottle)</span>
            <p className="input tabular-nums text-ink-2">{Number(form.selling_price).toFixed(2)}</p>
          </div>
          <div>
            <span className="label">Promo price with a valid AJK code (RM)</span>
            <p className="input tabular-nums text-ink-2">{Number(form.discounted_price).toFixed(2)}</p>
          </div>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={f.key} className="label">
                {f.label}
              </label>
              <input id={f.key} type="number" min={f.key === 'profit_per_bottle' ? 0 : 1} step={f.step} className="input tabular-nums" value={form[f.key]} onChange={set(f.key)} required />
            </div>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="starts_on" className="label">
              Campaign starts (optional)
            </label>
            <input id="starts_on" type="date" className="input" value={form.starts_on} onChange={set('starts_on')} />
          </div>
          <div>
            <label htmlFor="ends_on" className="label">
              Campaign ends (optional)
            </label>
            <input id="ends_on" type="date" className="input" value={form.ends_on} min={form.starts_on || undefined} onChange={set('ends_on')} />
          </div>
        </div>
        <p className="rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
          Prices are set by the shop checkout (RM 35 a bottle, RM 5 off each bottle with an AJK code), so they are shown here for reference only. Profit per bottle and targets apply to every report as soon as you save. The campaign dates are for your reference; they do not open or close the shop.
        </p>
        {error && (
          <p role="alert" className="text-sm text-bad">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </Card>
  )
}

function PasswordSettings() {
  const toast = useToast()
  const { admin } = useAuth()
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (pw.next.length < 10) return setError('Use at least 10 characters.')
    if (pw.next !== pw.confirm) return setError('The passwords do not match.')
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password: pw.next })
    setSaving(false)
    if (err) return setError(err.message)
    setPw({ next: '', confirm: '' })
    toast('Password changed.')
  }

  return (
    <Card title="Your password" description={`Signed in as ${admin?.username}. Replace the initial setup password with your own.`}>
      <form onSubmit={save} className="space-y-4">
        <input type="text" autoComplete="username" value={admin?.username || ''} readOnly hidden />
        <div>
          <label htmlFor="pw-next" className="label">
            New password
          </label>
          <input id="pw-next" type="password" autoComplete="new-password" className="input" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="pw-confirm" className="label">
            Confirm new password
          </label>
          <input id="pw-confirm" type="password" autoComplete="new-password" className="input" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
        </div>
        {error && (
          <p role="alert" className="text-sm text-bad">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-secondary" disabled={saving || !pw.next}>
          {saving ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </Card>
  )
}

export default function Settings() {
  return (
    <>
      <PageHeader title="Settings" description="Campaign targets, profit and your account." />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CampaignSettings />
        </div>
        <PasswordSettings />
      </div>
    </>
  )
}
