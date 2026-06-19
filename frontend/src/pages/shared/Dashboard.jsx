import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../App'
import { dashboardAPI } from '../../services/api'

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const fmtKES = (n) => `KES ${fmt(n)}`

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => { fetchDashboard() }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await dashboardAPI.get()
      setData(res.data)
    } catch {
      setError('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const role = user?.role

  if (loading) return (
    <div className="loading-state">
      <span className="spinner spinner--lg" />
      <p>Loading dashboard…</p>
    </div>
  )

  if (error) return (
    <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">
          Good {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="page-header__sub">
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── Staff KPIs ── */}
      {['BRANCH_ADMIN', 'FINANCE_OFFICER', 'AUDITOR'].includes(role) && (
        <StaffKPIs data={data} />
      )}

      {/* ── Member self-portal ── */}
      {role === 'MEMBER' && <MemberKPIs data={data} />}
      {role === 'INVESTOR' && <InvestorKPIs data={data} />}
      {role === 'TENANT' && <TenantKPIs data={data} />}
    </div>
  )
}

/* ─── Staff KPIs ───────────────────────────── */
function StaffKPIs({ data }) {
  const kpis = [
    {
      label: 'Active Members',
      value: fmt(data?.tujijenge_members),
      icon: 'bi-people',
      color: 'blue',
      to: '/tujijenge/members',
    },
    {
      label: 'Contributions (MTD)',
      value: fmtKES(data?.tujijenge_contributions_mtd),
      icon: 'bi-wallet2',
      color: 'green',
      to: '/tujijenge/contributions',
    },
    {
      label: 'Loans Outstanding',
      value: fmtKES(data?.tujijenge_loans_outstanding),
      icon: 'bi-cash-stack',
      color: 'orange',
      to: '/tujijenge/loans',
    },
    {
      label: 'Pending Approvals',
      value: fmt(data?.pending_approvals),
      icon: 'bi-check2-square',
      color: data?.pending_approvals > 0 ? 'red' : 'blue',
      to: '/approvals',
    },
    {
      label: 'M-Pesa Review Queue',
      value: fmt(data?.mpesa_review_queue),
      icon: 'bi-inbox',
      color: data?.mpesa_review_queue > 0 ? 'orange' : 'blue',
      to: '/mpesa/queue',
    },
    {
      label: 'M-Pesa Exceptions',
      value: fmt(data?.mpesa_exception_queue),
      icon: 'bi-exclamation-octagon',
      color: data?.mpesa_exception_queue > 0 ? 'red' : 'blue',
      to: '/mpesa/exceptions',
    },
  ]

  return (
    <>
      <div className="kpi-grid">
        {kpis.map(k => <KPICard key={k.label} {...k} />)}
      </div>

      {/* Quick links */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Quick Actions</h3>
        </div>
        <div className="card__body">
          <div className="quick-actions">
            {[
              { label: 'Record Contribution', icon: 'bi-plus-circle', to: '/tujijenge/contributions' },
              { label: 'New Loan Application', icon: 'bi-file-earmark-plus', to: '/tujijenge/loans' },
              { label: 'Upload M-Pesa CSV', icon: 'bi-cloud-upload', to: '/mpesa/upload' },
              { label: 'Review Approvals', icon: 'bi-check2-all', to: '/approvals' },
              { label: 'Generate Report', icon: 'bi-file-earmark-bar-graph', to: '/reports' },
            ].map(a => (
              <Link key={a.label} to={a.to} className="quick-action">
                <div className="quick-action__icon">
                  <i className={`bi ${a.icon}`} />
                </div>
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Member KPIs ──────────────────────────── */
function MemberKPIs({ data }) {
  return (
    <div className="kpi-grid">
      <KPICard label="My Total Contributions" value={fmtKES(data?.my_balance)} icon="bi-wallet2" color="blue" to="/my-contributions" />
      <KPICard label="Active Loan Balance" value={fmtKES(data?.my_loan_balance)} icon="bi-cash-stack" color="orange" to="/my-loans" />
      <KPICard label="Next Due Date" value={data?.my_next_due || '—'} icon="bi-calendar-event" color="green" to="/my-contributions" />
    </div>
  )
}

/* ─── Investor KPIs ────────────────────────── */
function InvestorKPIs({ data }) {
  return (
    <div className="kpi-grid">
      <KPICard label="Current Capital" value={fmtKES(data?.my_balance)} icon="bi-graph-up-arrow" color="blue" to="/my-investment" />
      <KPICard label="Pending Withdrawals" value={fmt(data?.wa_pending_withdrawals)} icon="bi-arrow-up-circle" color="orange" to="/my-requests" />
    </div>
  )
}

/* ─── Tenant KPIs ──────────────────────────── */
function TenantKPIs({ data }) {
  return (
    <div className="kpi-grid">
      <KPICard label="Rent Paid (Current)" value={fmtKES(data?.my_balance)} icon="bi-house-heart" color="blue" to="/my-lease" />
      <KPICard label="Next Rent Due" value={data?.my_next_due || '—'} icon="bi-calendar-event" color="orange" to="/my-lease" />
    </div>
  )
}

/* ─── KPI Card ─────────────────────────────── */
function KPICard({ label, value, icon, color, to }) {
  const content = (
    <div className={`kpi-card kpi-card--${color}`}>
      <div className="kpi-card__icon">
        <i className={`bi ${icon}`} />
      </div>
      <p className="kpi-card__label">{label}</p>
      <p className="kpi-card__value">{value}</p>
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}