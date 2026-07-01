import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

// ── Landing page (public, loads first) ───────────────────────
import LandingPage from './pages/LandingPage'

// ── Auth pages ────────────────────────────────────────────────
import Login from './pages/Login'

// ── Shared ────────────────────────────────────────────────────
import Dashboard from './pages/shared/Dashboard'
import Profile from './pages/shared/Profile'
import Notifications from './pages/shared/Notifications'
import NotFound from './pages/shared/NotFound'

// ── Super Admin ───────────────────────────────────────────────
import SuperDashboard from './pages/super-admin/SuperDashboard'
import Branches from './pages/super-admin/Branches'
import Users from './pages/super-admin/Users'
import Rules from './pages/super-admin/Rules'
import AuditLog from './pages/super-admin/AuditLog'
import SystemSettings from './pages/super-admin/SystemSettings'

// ── Tujijenge ─────────────────────────────────────────────────
import TujijengeMembers from './pages/tujijenge/TujijengeMembers'
import MemberStatement from './pages/tujijenge/MemberStatement'
import Contributions from './pages/tujijenge/Contributions'
import Loans from './pages/tujijenge/Loans'
import Penalties from './pages/tujijenge/Penalties'
import Distribution from './pages/tujijenge/Distribution'
import TujijengeReports from './pages/tujijenge/TujijengeReports'

// ── Wealth Alliance ───────────────────────────────────────────
import Investors from './pages/wealth-alliance/Investors'
import Investments from './pages/wealth-alliance/Investments'
import Dividends from './pages/wealth-alliance/Dividends'
import Withdrawals from './pages/wealth-alliance/Withdrawals'
import WealthReports from './pages/wealth-alliance/WealthReports'

// ── Table Banking ─────────────────────────────────────────────
import TBMembers from './pages/table-banking/TBMembers'
import TBContributions from './pages/table-banking/TBContributions'
import TBLoans from './pages/table-banking/TBLoans'
import TBReports from './pages/table-banking/TBReports'

// ── Rentals ───────────────────────────────────────────────────
import Properties from './pages/rentals/Properties'
import Units from './pages/rentals/Units'
import Tenants from './pages/rentals/Tenants'
import RentCollection from './pages/rentals/RentCollection'
import Maintenance from './pages/rentals/Maintenance'
import RentalsReports from './pages/rentals/RentalsReports'

// ── M-Pesa ────────────────────────────────────────────────────
import MpesaQueue from './pages/mpesa/MpesaQueue'
import MpesaExceptions from './pages/mpesa/MpesaExceptions'
import MpesaUpload from './pages/mpesa/MpesaUpload'

// ── Approvals ─────────────────────────────────────────────────
import Approvals from './pages/approvals/Approvals'

// ── Reports ───────────────────────────────────────────────────
import Reports from './pages/reports/Reports'

// ── Member Portal ─────────────────────────────────────────────
import MyDashboard from './pages/member-portal/MyDashboard'
import MyStatement from './pages/member-portal/MyStatement'
import MyLoans from './pages/member-portal/MyLoans'
import MyContributions from './pages/member-portal/MyContributions'
import MyInvestment from './pages/member-portal/MyInvestment'
import MyLease from './pages/member-portal/MyLease'
import MyRequests from './pages/member-portal/MyRequests'
import MyDocuments from './pages/member-portal/MyDocuments'


// ─────────────────────────────────────────────
// AUTH CONTEXT
// ─────────────────────────────────────────────

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('kilele_user')
    const token = localStorage.getItem('kilele_access')
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = (userData, access, refresh) => {
    localStorage.setItem('kilele_user', JSON.stringify(userData))
    localStorage.setItem('kilele_access', access)
    localStorage.setItem('kilele_refresh', refresh)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('kilele_user')
    localStorage.removeItem('kilele_access')
    localStorage.removeItem('kilele_refresh')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}


// ─────────────────────────────────────────────
// ROLE CONSTANTS
// ─────────────────────────────────────────────

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  FINANCE_OFFICER: 'FINANCE_OFFICER',
  AUDITOR: 'AUDITOR',
  MEMBER: 'MEMBER',
  INVESTOR: 'INVESTOR',
  TENANT: 'TENANT',
}

const STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.BRANCH_ADMIN,
  ROLES.FINANCE_OFFICER,
  ROLES.AUDITOR,
]

const FINANCE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.BRANCH_ADMIN,
  ROLES.FINANCE_OFFICER,
]

const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.BRANCH_ADMIN,
]


// ─────────────────────────────────────────────
// GUARDS
// ─────────────────────────────────────────────

function RequireAuth({ children, roles = [] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
      </div>
    )
  }

  if (!user) {
    // Unauthenticated users are sent to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return children
}

/**
 * RedirectByRole — used at /app (post-login entry point).
 * If not logged in, falls back to the landing page instead of login
 * so the public URL "/" always stays clean.
 */
function RedirectByRole() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
      </div>
    )
  }

  // Not logged in → send to login (they came from /app directly)
  if (!user) return <Navigate to="/login" replace />

  const destinations = {
    [ROLES.SUPER_ADMIN]:     '/super-dashboard',
    [ROLES.BRANCH_ADMIN]:    '/dashboard',
    [ROLES.FINANCE_OFFICER]: '/dashboard',
    [ROLES.AUDITOR]:         '/dashboard',
    [ROLES.MEMBER]:          '/my-dashboard',
    [ROLES.INVESTOR]:        '/my-dashboard',
    [ROLES.TENANT]:          '/my-dashboard',
  }

  return <Navigate to={destinations[user.role] || '/dashboard'} replace />
}


// ─────────────────────────────────────────────
// APP SHELL (authenticated layout)
// ─────────────────────────────────────────────

function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(prev => !prev)
    } else {
      setSidebarCollapsed(prev => !prev)
    }
  }

  // Close sidebar on mobile when route changes
  const location = useLocation()
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Mobile overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="app-shell__main">
        <Navbar onMenuClick={toggleSidebar} />
        <main className="app-shell__content">
          {children}
        </main>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>

      {/* ── PUBLIC ────────────────────────────────────────────── */}
      {/* Landing page — loads first, no auth required */}
      <Route path="/" element={<LandingPage />} />

      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Post-login role-based redirect entry point.
          Login.jsx should navigate('/app') after successful OTP. */}
      <Route path="/app" element={<RedirectByRole />} />

      {/* ── SUPER ADMIN ───────────────────────────────────────── */}
      <Route path="/super-dashboard" element={
        <RequireAuth roles={[ROLES.SUPER_ADMIN]}>
          <AppShell><SuperDashboard /></AppShell>
        </RequireAuth>
      } />
      <Route path="/branches" element={
        <RequireAuth roles={[ROLES.SUPER_ADMIN]}>
          <AppShell><Branches /></AppShell>
        </RequireAuth>
      } />
      <Route path="/users" element={
        <RequireAuth roles={[ROLES.SUPER_ADMIN]}>
          <AppShell><Users /></AppShell>
        </RequireAuth>
      } />
      <Route path="/rules" element={
        <RequireAuth roles={[ROLES.SUPER_ADMIN]}>
          <AppShell><Rules /></AppShell>
        </RequireAuth>
      } />
      <Route path="/audit-log" element={
        <RequireAuth roles={[ROLES.SUPER_ADMIN, ROLES.AUDITOR]}>
          <AppShell><AuditLog /></AppShell>
        </RequireAuth>
      } />
      <Route path="/system-settings" element={
        <RequireAuth roles={[ROLES.SUPER_ADMIN]}>
          <AppShell><SystemSettings /></AppShell>
        </RequireAuth>
      } />

      {/* ── SHARED STAFF ──────────────────────────────────────── */}
      <Route path="/dashboard" element={
        <RequireAuth roles={STAFF_ROLES}>
          <AppShell><Dashboard /></AppShell>
        </RequireAuth>
      } />
      <Route path="/profile" element={
        <RequireAuth>
          <AppShell><Profile /></AppShell>
        </RequireAuth>
      } />
      <Route path="/notifications" element={
        <RequireAuth>
          <AppShell><Notifications /></AppShell>
        </RequireAuth>
      } />

      {/* ── TUJIJENGE ─────────────────────────────────────────── */}
      <Route
        path="/tujijenge/members/:id/statement"
        element={
          <RequireAuth roles={FINANCE_ROLES}>
            <AppShell>
              <MemberStatement />
            </AppShell>
          </RequireAuth>
        }
      />

      <Route
        path="/tujijenge/members"
        element={
          <RequireAuth roles={FINANCE_ROLES}>
            <AppShell>
              <TujijengeMembers />
            </AppShell>
          </RequireAuth>
        }
      />

      <Route
        path="/tujijenge/contributions"
        element={
          <RequireAuth roles={FINANCE_ROLES}>
            <AppShell>
              <Contributions />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route path="/tujijenge/loans" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Loans /></AppShell>
        </RequireAuth>
      } />
      <Route path="/tujijenge/penalties" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Penalties /></AppShell>
        </RequireAuth>
      } />
      <Route path="/tujijenge/distribution" element={
        <RequireAuth roles={ADMIN_ROLES}>
          <AppShell><Distribution /></AppShell>
        </RequireAuth>
      } />
      <Route path="/tujijenge/reports" element={
        <RequireAuth roles={[...FINANCE_ROLES, ROLES.AUDITOR]}>
          <AppShell><TujijengeReports /></AppShell>
        </RequireAuth>
      } />

      {/* ── WEALTH ALLIANCE ───────────────────────────────────── */}
      <Route path="/wealth-alliance/investors" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Investors /></AppShell>
        </RequireAuth>
      } />
      <Route path="/wealth-alliance/investments" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Investments /></AppShell>
        </RequireAuth>
      } />
      <Route path="/wealth-alliance/dividends" element={
        <RequireAuth roles={ADMIN_ROLES}>
          <AppShell><Dividends /></AppShell>
        </RequireAuth>
      } />
      <Route path="/wealth-alliance/withdrawals" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Withdrawals /></AppShell>
        </RequireAuth>
      } />
      <Route path="/wealth-alliance/reports" element={
        <RequireAuth roles={[...FINANCE_ROLES, ROLES.AUDITOR]}>
          <AppShell><WealthReports /></AppShell>
        </RequireAuth>
      } />

      {/* ── TABLE BANKING ─────────────────────────────────────── */}
      <Route path="/table-banking/members" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><TBMembers /></AppShell>
        </RequireAuth>
      } />
      <Route path="/table-banking/contributions" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><TBContributions /></AppShell>
        </RequireAuth>
      } />
      <Route path="/table-banking/loans" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><TBLoans /></AppShell>
        </RequireAuth>
      } />
      <Route path="/table-banking/reports" element={
        <RequireAuth roles={[...FINANCE_ROLES, ROLES.AUDITOR]}>
          <AppShell><TBReports /></AppShell>
        </RequireAuth>
      } />

      {/* ── RENTALS ───────────────────────────────────────────── */}
      <Route path="/rentals/properties" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Properties /></AppShell>
        </RequireAuth>
      } />
      <Route path="/rentals/units" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Units /></AppShell>
        </RequireAuth>
      } />
      <Route path="/rentals/tenants" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Tenants /></AppShell>
        </RequireAuth>
      } />
      <Route path="/rentals/rent-collection" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><RentCollection /></AppShell>
        </RequireAuth>
      } />
      <Route path="/rentals/maintenance" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Maintenance /></AppShell>
        </RequireAuth>
      } />
      <Route path="/rentals/reports" element={
        <RequireAuth roles={[...FINANCE_ROLES, ROLES.AUDITOR]}>
          <AppShell><RentalsReports /></AppShell>
        </RequireAuth>
      } />

      {/* ── MPESA ─────────────────────────────────────────────── */}
      <Route path="/mpesa/queue" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><MpesaQueue /></AppShell>
        </RequireAuth>
      } />
      <Route path="/mpesa/exceptions" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><MpesaExceptions /></AppShell>
        </RequireAuth>
      } />
      <Route path="/mpesa/upload" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><MpesaUpload /></AppShell>
        </RequireAuth>
      } />

      {/* ── APPROVALS ─────────────────────────────────────────── */}
      <Route path="/approvals" element={
        <RequireAuth roles={FINANCE_ROLES}>
          <AppShell><Approvals /></AppShell>
        </RequireAuth>
      } />

      {/* ── REPORTS ───────────────────────────────────────────── */}
      <Route path="/reports" element={
        <RequireAuth roles={[...FINANCE_ROLES, ROLES.AUDITOR]}>
          <AppShell><Reports /></AppShell>
        </RequireAuth>
      } />

      {/* ── MEMBER / INVESTOR / TENANT PORTAL ─────────────────── */}
      <Route path="/my-dashboard" element={
        <RequireAuth roles={[ROLES.MEMBER, ROLES.INVESTOR, ROLES.TENANT]}>
          <AppShell><MyDashboard /></AppShell>
        </RequireAuth>
      } />
      <Route path="/my-statement" element={
        <RequireAuth roles={[ROLES.MEMBER, ROLES.INVESTOR, ROLES.TENANT]}>
          <AppShell><MyStatement /></AppShell>
        </RequireAuth>
      } />
      <Route path="/my-loans" element={
        <RequireAuth roles={[ROLES.MEMBER]}>
          <AppShell><MyLoans /></AppShell>
        </RequireAuth>
      } />
      <Route path="/my-contributions" element={
        <RequireAuth roles={[ROLES.MEMBER]}>
          <AppShell><MyContributions /></AppShell>
        </RequireAuth>
      } />
      <Route path="/my-investment" element={
        <RequireAuth roles={[ROLES.INVESTOR]}>
          <AppShell><MyInvestment /></AppShell>
        </RequireAuth>
      } />
      <Route path="/my-lease" element={
        <RequireAuth roles={[ROLES.TENANT]}>
          <AppShell><MyLease /></AppShell>
        </RequireAuth>
      } />
      <Route path="/my-requests" element={
        <RequireAuth roles={[ROLES.MEMBER, ROLES.INVESTOR, ROLES.TENANT]}>
          <AppShell><MyRequests /></AppShell>
        </RequireAuth>
      } />
      <Route path="/my-documents" element={
        <RequireAuth roles={[ROLES.MEMBER, ROLES.INVESTOR, ROLES.TENANT]}>
          <AppShell><MyDocuments /></AppShell>
        </RequireAuth>
      } />

      {/* ── 403 / 404 ─────────────────────────────────────────── */}
      <Route path="/403" element={
        <div className="error-page">
          <div className="error-page__icon">
            <i className="bi bi-shield-lock" />
          </div>
          <h1>Access Denied</h1>
          <p>You don't have permission to view this page.</p>
          <a href="/" className="btn btn--primary">Back to Home</a>
        </div>
      } />
      <Route path="*" element={<NotFound />} />

    </Routes>
  )
}


// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}