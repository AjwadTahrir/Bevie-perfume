import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

/**
 * LIVE DATA
 * Every query re-runs when `version` changes. Version bumps on:
 *   - a Supabase Realtime change to orders or payment_submissions
 *   - an admin action in this tab (refresh())
 *   - the tab regaining focus
 *   - a poll every 60 s (20 s while Realtime is down), so the
 *     dashboard stays correct without a live connection.
 */
const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [version, setVersion] = useState(0)
  const [live, setLive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const debounce = useRef(null)

  const refresh = useCallback(() => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      setVersion((v) => v + 1)
      setLastUpdated(new Date())
    }, 300)
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('admin-campaign')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_submissions' }, refresh)
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))
    return () => {
      clearTimeout(debounce.current)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  useEffect(() => {
    const timer = setInterval(refresh, live ? 60_000 : 20_000)
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [live, refresh])

  return <DataContext.Provider value={{ version, live, lastUpdated, refresh }}>{children}</DataContext.Provider>
}

export const useLiveData = () => useContext(DataContext)

/**
 * Runs `fn` now, whenever `deps` change and on every live refresh.
 * Keeps showing the previous result while a refresh is in flight.
 */
export function useQuery(fn, deps = []) {
  const { version } = useLiveData()
  const [state, setState] = useState({ data: undefined, error: null, loading: true })
  const fnRef = useRef(fn)
  fnRef.current = fn
  const key = JSON.stringify(deps)

  useEffect(() => {
    let active = true
    fnRef.current().then(
      (data) => active && setState({ data, error: null, loading: false }),
      (error) => active && setState((s) => ({ data: s.data, error, loading: false })),
    )
    return () => {
      active = false
    }
  }, [key, version])

  return state
}
