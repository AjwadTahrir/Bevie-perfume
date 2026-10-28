import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, CheckCheck, CreditCard, FileText, LayoutDashboard, LogOut, Menu, PieChart, Search, Settings, ShoppingBag, Ticket, Trophy, Users, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { fetchDashboard } from '../lib/api'
import { useLiveData, useQuery } from '../lib/data'
import { fmtTime, n, pct } from '../lib/format'
import JethaSymbol from '../../components/JethaSymbol'

export const NAV = [
  {
    group: 'Menu',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/analytics', label: 'Analytics', icon: PieChart },
      { to: '/orders', label: 'Orders', icon: ShoppingBag, badge: 'pending' },
      { to: '/payments', label: 'Payments', icon: CreditCard, badge: 'review' },
      { to: '/members', label: 'AJK Performance', icon: Users },
      { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    group: 'Workspace',
    items: [
      { to: '/promo-codes', label: 'Promo Codes', icon: Ticket },
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

/** Two-letter initials from an email or name. */
export const initials = (s) =>
  String(s || '?')
    .split('@')[0]
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

/** Logo: the JETHA symbol (same asset as the storefront), then the wordmark. */
function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <JethaSymbol className="h-8" />
      <span className="text-[1.1875rem] font-bold tracking-tight text-ink">JETHA</span>
    </span>
  )
}

function Sidebar({ onNavigate, dash }) {
  const { admin, logout } = useAuth()
  const counts = { review: dash?.pending?.submitted_orders ?? 0, pending: dash?.pending?.orders ?? 0 }
  const target = dash?.target
  const bottles = dash?.verified?.bottles ?? 0
  return (
    <div className="flex h-full flex-col px-4 pt-6 pb-4">
      <Link to="/" onClick={onNavigate} className="self-start rounded-lg px-2" aria-label="JETHA admin, overview">
        <Logo />
      </Link>

      {/* The campaign this console runs */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <span className="avatar bg-gradient-to-br from-[#ff9f6b] to-[#f05a4f]" aria-hidden="true">
          TS
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[0.875rem] font-semibold">Titian Serantau</span>
          <span className="block truncate text-xs text-ink-3">KK10 · {dash ? `${dash.members.total} AJK` : 'Fundraiser'}</span>
        </span>
      </div>

      <nav aria-label="Dashboard" className="mt-6 flex-1 overflow-y-auto">
        {NAV.map((section) => (
          <div key={section.group} className="mb-5">
            <p className="eyebrow mb-2 px-3">{section.group}</p>
            <ul className="space-y-1">
              {section.items.map(({ to, label, icon: Icon, end, badge }) => {
                const count = badge ? counts[badge] : 0
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex h-10 items-center gap-3 rounded-xl px-3 text-[0.9375rem] transition-colors duration-150 ${
                          isActive ? 'bg-ink font-medium text-white shadow-[0_6px_16px_-8px_rgba(12,12,16,0.6)]' : 'text-ink-2 hover:bg-[#efeff2] hover:text-ink'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={18} strokeWidth={1.75} className={isActive ? 'text-lime' : ''} aria-hidden="true" />
                          <span className="flex-1">{label}</span>
                          {count > 0 && (
                            <span
                              className={`min-w-6 rounded-full px-1.5 text-center text-xs leading-6 tabular-nums ${isActive ? 'bg-white/15 text-white' : 'bg-[#ececf0] text-ink-2'}`}
                              aria-label={badge === 'review' ? `${count} to review` : `${count} pending`}
                            >
                              {count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Campaign target card, in the place of the reference's promo card */}
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-line bg-surface p-4">
        <span className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-lime/60 blur-2xl" aria-hidden="true" />
        <p className="relative text-[0.9375rem] font-semibold">
          Campaign target <span className="text-[#4d6500]">{target ? pct(target.completion_pct, 0) : '—'}</span>
        </p>
        <p className="relative mt-1 text-[0.8125rem] leading-snug text-ink-3">
          {target ? `${n(bottles)} of ${n(target.campaign_target)} bottles verified. ${dash.members.reached} AJK at their target.` : 'Loading campaign progress…'}
        </p>
        <Link to="/leaderboard" onClick={onNavigate} className="btn btn-primary relative mt-3 h-8 rounded-lg px-3 text-xs">
          Leaderboard
        </Link>
      </div>

      <div className="flex items-center gap-3 px-1">
        <span className="avatar size-9 rounded-full bg-[#ece8ff] text-xs text-[#5b4bc4]" aria-hidden="true">
          {initials(admin?.username)}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium" title={admin?.username}>
            {admin?.username}
          </span>
          <span className="text-xs text-ink-3">Admin</span>
        </span>
        <button type="button" onClick={logout} className="btn btn-ghost size-9 shrink-0 rounded-lg px-0" aria-label="Logout" title="Logout">
          <LogOut size={17} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}

/** Top-bar search: sends the query to the Orders table. ⌘K / Ctrl+K focuses it. */
function TopSearch() {
  const navigate = useNavigate()
  const ref = useRef(null)
  const [q, setQ] = useState('')
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (
    <form
      role="search"
      className="relative hidden w-full max-w-[18.5rem] sm:block"
      onSubmit={(e) => {
        e.preventDefault()
        navigate(`/orders?q=${encodeURIComponent(q.trim())}`)
      }}
    >
      <label htmlFor="top-search" className="sr-only">
        Search orders, customers or promo codes
      </label>
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
      <input ref={ref} id="top-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders, customers…" className="input h-10 pr-12 pl-10" />
      {!q && <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line px-1.5 py-0.5 font-sans text-[0.6875rem] text-ink-3">⌘K</kbd>}
    </form>
  )
}

function LiveDot() {
  const { live, lastUpdated } = useLiveData()
  return (
    <span className="hidden items-center gap-2 text-xs text-ink-3 xl:flex" title={live ? 'Receiving live updates' : 'Live updates unavailable; refreshing every 20 seconds'}>
      <span className={`size-2 rounded-full ${live ? 'bg-good' : 'bg-warn'}`} aria-hidden="true" />
      {live ? 'Live' : 'Auto-refresh'} · {fmtTime(lastUpdated)}
    </span>
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
    <div className="min-h-dvh lg:pl-64">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-sidebar lg:block">
        <Sidebar dash={dash.data} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-espresso/40" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside ref={drawerRef} className="slide-in absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar shadow-xl">
            <button type="button" className="btn btn-ghost absolute top-5 right-3 size-10 px-0" onClick={() => setOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} dash={dash.data} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-[4.25rem] items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6 lg:px-7">
        <button type="button" className="icon-btn -ml-1 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <span className="sm:hidden">
          <Logo />
        </span>
        <TopSearch />
        <div className="ml-auto flex items-center gap-2">
          <LiveDot />
          <Link to="/orders" className="icon-btn sm:hidden" aria-label="Search orders">
            <Search size={18} strokeWidth={1.75} />
          </Link>
          <Link to="/reports" className="icon-btn hidden sm:inline-flex" aria-label="Reports by date" title="Reports by date">
            <CalendarDays size={18} strokeWidth={1.75} />
          </Link>
          <Link to="/payments" className="icon-btn" aria-label={toReview ? `${toReview} payments to review` : 'Payments, nothing to review'} title="Payments to review">
            <Bell size={18} strokeWidth={1.75} />
            {toReview > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-[#ef4444] ring-2 ring-surface" aria-hidden="true" />}
          </Link>
          <Link to="/payments" className="btn btn-primary hidden h-10 px-4 md:inline-flex">
            <CheckCheck size={16} className="text-lime" aria-hidden="true" />
            Review payments
            {toReview > 0 && <span className="rounded-full bg-lime px-1.5 text-xs leading-5 text-ink tabular-nums">{toReview}</span>}
          </Link>
        </div>
      </header>

      <main id="admin-main" className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6 lg:px-7 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
