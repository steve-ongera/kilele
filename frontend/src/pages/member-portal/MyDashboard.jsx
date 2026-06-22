import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../App'
import { dashboardAPI } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function MyDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.get().then(res => setData(res.data)).catch(() => { }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><span className="spinner spinner--lg" /><p>Loading your dashboard…</p></div>

  const role = user?.role
  const isOverdue = data?.my_next_due && new Date(data.my_next_due) < new Date()

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Welcome, {user?.full_name?.split(' ')[0]}</h1>
        <p className="page-header__sub">Here's your account overview</p>
      </div>

      {isOverdue && (
        <div className="alert alert--warning">
          <i className="bi bi-exclamation-triangle" />
          Your payment was due on <strong>{data.my_next_due}</strong>. Please make a payment to avoid penalties.
        </div>
      )}

      <div className="kpi-grid">
        {role === 'MEMBER' && (
          <>
            <KPICard label="Total Contributions" value={fmtKES(data?.my_balance)} icon="bi-wallet2" color="blue" to="/my-contributions" />
            <KPICard label="Active Loan Balance" value={fmtKES(data?.my_loan_balance)} icon="bi-cash-stack" color="orange" to="/my-loans" />
            <KPICard label="Next Payment Due" value={data?.my_next_due || 'No pending dues'} icon="bi-calendar-event" color="green" to="/my-contributions" />
          </>
        )}
        {role === 'INVESTOR' && (
          <>
            <KPICard label="Current Capital" value={fmtKES(data?.my_balance)} icon="bi-graph-up-arrow" color="blue" to="/my-investment" />
            <KPICard label="Pending Withdrawals" value={data?.wa_pending_withdrawals || 0} icon="bi-arrow-up-circle" color="orange" to="/my-requests" />
          </>
        )}
        {role === 'TENANT' && (
          <>
            <KPICard label="Rent Paid (Current)" value={fmtKES(data?.my_balance)} icon="bi-house-heart" color="blue" to="/my-lease" />
            <KPICard label="Next Rent Due" value={data?.my_next_due || '—'} icon="bi-calendar-event" color="orange" to="/my-lease" />
          </>
        )}
      </div>

      <div className="card">
        <div className="card__header"><h3 className="card__title">Quick Links</h3></div>
        <div className="card__body">
          <div className="quick-actions">
            <Link to="/my-statement" className="quick-action">
              <div className="quick-action__icon"><i className="bi bi-file-text" /></div>
              <span>View Statement</span>
            </Link>
            <Link to="/my-requests" className="quick-action">
              <div className="quick-action__icon"><i className="bi bi-send" /></div>
              <span>Make a Request</span>
            </Link>
            <Link to="/my-documents" className="quick-action">
              <div className="quick-action__icon"><i className="bi bi-folder" /></div>
              <span>My Documents</span>
            </Link>
            <Link to="/profile" className="quick-action">
              <div className="quick-action__icon"><i className="bi bi-person" /></div>
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, icon, color, to }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div className={`kpi-card kpi-card--${color}`}>
        <div className="kpi-card__icon"><i className={`bi ${icon}`} /></div>
        <p className="kpi-card__label">{label}</p>
        <p className="kpi-card__value">{value}</p>
      </div>
    </Link>
  )
}