import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CreditCard, FileText, LayoutDashboard, LogOut, Menu, Settings, ShoppingBag, Ticket, Trophy, Users, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { fetchDashboard } from '../lib/api'
import { useLiveData, useQuery } from '../lib/data'
import { fmtTime } from '../lib/format'

export const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/members', label: 'AJK Performance', icon: Users },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/promo-codes', label: 'Promo Codes', icon: Ticket },
  { to: '/payments', label: 'Payments', icon: CreditCard, badge: 'review' },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** The storefront wordmark, set small: BEAVIE over a tracked PERFUME line. */
function Wordmark() {
  return (
    <span className="flex flex-col leading-none text-ink">
      <span className="font-display text-[1.35rem] font-semibold tracking-[0.3em]">BEAVIE</span>
      <span className="mt-1.5 flex items-center gap-2 pl-px text-[0.5625rem] font-medium tracking-[0.42em] text-ink-3">
        PERFUME <span className="h-px w-3 bg-gold" aria-hidden="true" /> ADMIN
      </span>
    </span>
  )
}

function Sidebar({ onNavigate, toReview }) {
  const { admin, logout } = useAuth()
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-7 pb-8">
        <Wordmark />
      </div>
      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150 ${
                    isActive ? 'bg-surface/70 font-medium text-brand-deep' : 'text-ink-2 hover:bg-surface/40 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`absolute top-2 bottom-2 left-0 w-0.5 rounded-full ${isActive ? 'bg-brand' : 'bg-transparent'}`} aria-hidden="true" />
                    <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {badge === 'review' && toReview > 0 && (
                      <span className="min-w-5 rounded-full bg-brand px-1.5 text-center text-[0.6875rem] leading-5 font-semibold text-white tabular-nums" aria-label={`${toReview} to review`}>
                        {toReview}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-line-strong/60 px-3 py-4">
        <p className="eyebrow px-3">Signed in</p>
        <p className="mt-1 truncate px-3 text-sm text-ink" title={admin?.username}>
          {admin?.username}
        </p>
        <button type="button" onClick={logout} className="mt-2 flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-ink-2 transition-colors duration-150 hover:bg-surface/40 hover:text-ink">
          <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  )
}

function LiveIndicator() {
  const { live, lastUpdated } = useLiveData()
  return (
    <p className="flex items-center gap-2 text-xs text-ink-3" title={live ? 'Receiving live updates' : 'Live updates unavailable; refreshing every 20 seconds'}>
      <span className="relative flex size-2" aria-hidden="true">
        {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-good/50 motion-reduce:hidden" />}
        <span className={`relative inline-block size-2 rounded-full ${live ? 'bg-good' : 'bg-warn'}`} />
      </span>
      {live ? 'Live' : 'Auto-refresh'}
      <span className="hidden sm:inline">· updated {fmtTime(lastUpdated)}</span>
    </p>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const drawerRef = useRef(null)
  const dash = useQuery(() => fetchDashboard(), [])
  const toReview = dash.data?.pending?.submitted_orders ?? 0

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    if (!open) return
    drawerRef.current?.querySelector('a')?.focus()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="min-h-dvh lg:pl-60">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line-strong/60 bg-sidebar lg:block">
        <Sidebar toReview={toReview} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-espresso/40" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside ref={drawerRef} className="slide-in absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar shadow-xl">
            <button type="button" className="btn btn-ghost absolute top-5 right-3 size-10 px-0" onClick={() => setOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} toReview={toReview} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur-sm sm:px-6 lg:px-8 xl:px-10">
        <button type="button" className="btn btn-ghost -ml-2 size-10 px-0 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu size={19} />
        </button>
        <span className="font-display text-base font-semibold tracking-[0.28em] lg:hidden">BEAVIE</span>
        <div className="ml-auto">
          <LiveIndicator />
        </div>
      </header>

      <main id="admin-main" className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9 xl:px-10">
        <Outlet />
      </main>
    </div>
  )
}
