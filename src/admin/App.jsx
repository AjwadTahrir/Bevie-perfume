import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { DataProvider } from './lib/data'
import { isConfigured } from './lib/supabase'
import { ToastProvider } from './components/Toasts'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Members from './pages/Members'
import MemberDetail from './pages/MemberDetail'
import Leaderboard from './pages/Leaderboard'
import PromoCodes from './pages/PromoCodes'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function NotConfigured() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="card max-w-md p-6">
        <h1 className="display text-xl">Dashboard not connected</h1>
        <p className="mt-2 text-sm text-ink-2">
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> for this deployment, then rebuild. See the README's setup section.
        </p>
      </div>
    </div>
  )
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
      <div className="skeleton size-8 rounded-lg" />
    </div>
  )
}

/** Every dashboard route requires a verified admin session. The data itself is protected by RLS regardless. */
function RequireAdmin({ children }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (status !== 'signedIn') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <DataProvider>{children}</DataProvider>
}

export default function App() {
  if (!isConfigured) return <NotConfigured />
  return (
    <BrowserRouter basename="/admin">
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAdmin>
                  <Layout />
                </RequireAdmin>
              }
            >
              <Route index element={<Overview />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="members" element={<Members />} />
              <Route path="members/:id" element={<MemberDetail />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="promo-codes" element={<PromoCodes />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
