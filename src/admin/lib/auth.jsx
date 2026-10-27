import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const IDLE_LIMIT_MS = 30 * 60 * 1000
const AuthContext = createContext(null)

async function loadAdmin(session) {
  if (!session) return null
  const { data } = await supabase.from('admin_profiles').select('username, display_name').eq('user_id', session.user.id).maybeSingle()
  return data
}

/**
 * Session handling for the dashboard. Sign-in goes through
 * /api/admin/login (username -> account mapping and rate limiting on
 * the server); Supabase then keeps and refreshes the session. A signed-in
 * account that isn't in admin_profiles is signed straight out, and 30
 * minutes without activity ends the session.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', admin: null, notice: '' })
  const lastActive = useRef(Date.now())

  const apply = useCallback(async (session, notice = '') => {
    if (!session) return setState({ status: 'signedOut', admin: null, notice })
    const admin = await loadAdmin(session)
    if (!admin) {
      await supabase.auth.signOut()
      return setState({ status: 'signedOut', admin: null, notice: 'This account does not have dashboard access.' })
    }
    setState({ status: 'signedIn', admin, notice: '' })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') setState((s) => ({ status: 'signedOut', admin: null, notice: s.notice }))
      else if (event === 'SIGNED_IN' && session) setTimeout(() => apply(session), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [apply])

  // Idle timeout.
  useEffect(() => {
    if (state.status !== 'signedIn') return
    const touch = () => (lastActive.current = Date.now())
    const events = ['pointerdown', 'keydown', 'scroll']
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }))
    const timer = setInterval(() => {
      if (Date.now() - lastActive.current > IDLE_LIMIT_MS) {
        setState((s) => ({ ...s, notice: 'You were signed out after 30 minutes of inactivity.' }))
        supabase.auth.signOut()
      }
    }, 30_000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch))
      clearInterval(timer)
    }
  }, [state.status])

  const login = useCallback(async (username, password) => {
    let res
    try {
      res = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) })
    } catch {
      throw new Error('Could not reach the server. Check your connection.')
    }
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.message || 'Sign-in failed. Please try again.')
    lastActive.current = Date.now()
    const { error } = await supabase.auth.setSession({ access_token: body.session.access_token, refresh_token: body.session.refresh_token })
    if (error) throw new Error('Could not start your session. Please try again.')
  }, [])

  const logout = useCallback(async () => {
    setState((s) => ({ ...s, notice: 'You have been signed out.' }))
    await supabase.auth.signOut()
  }, [])

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
