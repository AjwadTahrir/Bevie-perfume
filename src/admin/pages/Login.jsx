import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { status, login, notice } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (status === 'signedIn') return <Navigate to={location.state?.from || '/'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err.message)
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-9 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-[14px] bg-ink" aria-hidden="true">
            <span className="size-5 rounded-full border-4 border-lime" />
          </span>
          <span className="mt-3 text-xl font-bold tracking-tight">JETHA</span>
          <h1 className="display mt-6 text-2xl">Fundraising Console</h1>
          <p className="mt-1.5 text-sm text-ink-2">Sign in to manage orders and campaign sales.</p>
        </div>
        <form onSubmit={submit} className="card space-y-4 p-6 sm:p-7" noValidate>
          {notice && !error && (
            <p role="status" className="rounded-md bg-info-soft px-3 py-2 text-xs text-info">
              {notice}
            </p>
          )}
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input id="email" type="email" className="input h-10" autoComplete="username" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input id="password" type="password" className="input h-10" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && (
            <p role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-xs text-bad">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary h-10 w-full" disabled={busy || !email || !password}>
            <Lock size={14} aria-hidden="true" />
            {busy || status === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-ink-3">For committee administrators only. Sessions end after 30 minutes of inactivity.</p>
      </div>
    </main>
  )
}
