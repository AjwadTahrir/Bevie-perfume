import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const IDLE_LIMIT_MS = 30 * 60 * 1000
const AuthContext = createContext(null)

async function loadAdmin(session) {
  if (!session) return null
  const { data } = await supabase.rpc('is_shop_admin')
  return data === true ? { username: session.user.email, display_name: null } : null
}

/**
 * Session handling for the dashboard. Admins sign in with the email and
 * password of their Supabase Auth account (Supabase rate-limits sign-in);
 * Supabase then keeps and refreshes the session. A signed-in account that
 * isn't in shop_admins is signed straight out, and 30 minutes without
 * activity ends the session. Sign-out is local (this browser only), so one
 * idle tab never signs the same account out on other devices.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', admin: null, notice: '' })
  const lastActive = useRef(Date.now())

  const apply = useCallback(async (session, notice = '') => {
    if (!session) return setState({ status: 'signedOut', admin: null, notice })
    const admin = await loadAdmin(session)
    if (!admin) {
      await supabase.auth.signOut({ scope: 'local' })
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
        supabase.auth.signOut({ scope: 'local' })
      }
    }, 30_000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch))
      clearInterval(timer)
    }
  }, [state.status])

  const login = useCallback(async (email, password) => {
    lastActive.current = Date.now()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return
    if (/invalid login credentials/i.test(error.message)) throw new Error('Wrong email or password.')
    if (error.status === 429) throw new Error('Too many attempts. Please wait a few minutes and try again.')
    if (/fetch|network/i.test(error.message)) throw new Error('Could not reach the server. Check your connection.')
    throw new Error(error.message || 'Sign-in failed. Please try again.')
  }, [])

  const logout = useCallback(async () => {
    setState((s) => ({ ...s, notice: 'You have been signed out.' }))
    await supabase.auth.signOut({ scope: 'local' })
  }, [])

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
