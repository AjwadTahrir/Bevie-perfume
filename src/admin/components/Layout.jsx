import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, CreditCard, FileText, LayoutDashboard, LogOut, Menu, Settings, ShoppingBag, Ticket, Trophy, Users, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useLiveData } from '../lib/data'
import { fmtTime } from '../lib/format'

export const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/members', label: 'AJK Performance', icon: Users },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/promo-codes', label: 'Promo Codes', icon: Ticket },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ onNavigate }) {
  const { admin, logout } = useAuth()
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">B</span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">Bevie Perfume</p>
          <p className="text-xs text-ink-3">Fundraising console</p>
        </div>
      </div>
      <nav aria-label="Dashboard" className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${isActive ? 'bg-navy-soft font-medium text-navy' : 'text-ink-2 hover:bg-canvas hover:text-ink'}`
            }
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <p className="px-3 pb-2 text-xs text-ink-3">
          Signed in as <span className="font-medium text-ink-2">{admin?.username}</span>
        </p>
        <button type="button" onClick={logout} className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-ink-2 hover:bg-canvas hover:text-ink">
          <LogOut size={16} aria-hidden="true" />
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
      <span className={`inline-block size-2 rounded-full ${live ? 'bg-good' : 'bg-warn'}`} aria-hidden="true" />
      {live ? 'Live' : 'Auto-refresh'} · updated {fmtTime(lastUpdated)}
    </p>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div className="min-h-dvh lg:pl-60">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-surface lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-navy/30" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside className="rise absolute inset-y-0 left-0 w-64 bg-surface shadow-xl">
            <button type="button" className="btn btn-ghost absolute top-4 right-3 px-2" onClick={() => setOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
        <button type="button" className="btn btn-ghost -ml-2 px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <span className="text-sm font-semibold lg:hidden">Bevie Admin</span>
        <div className="ml-auto">
          <LiveIndicator />
        </div>
      </header>

      <main id="admin-main" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
