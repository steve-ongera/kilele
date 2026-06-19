import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI, branchesAPI, toArray } from '../../services/api'

const fmt = (n) => Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })
const fmtKES = (n) => `KES ${fmt(n)}`

const BRANCH_TYPE_META = {
  TUJIJENGE:       { icon: 'bi-piggy-bank',      color: 'blue',   label: 'Tujijenge Savings Circle' },
  WEALTH_ALLIANCE: { icon: 'bi-graph-up-arrow',  color: 'green',  label: 'Wealth Alliance' },
  TABLE_BANKING:   { icon: 'bi-people-fill',     color: 'orange', label: 'Table Banking' },
  RENTALS:         { icon: 'bi-building',        color: 'blue',   label: 'Rentals' },
  CUSTOM:          { icon: 'bi-grid',            color: 'gray',   label: 'Custom' },
}

export default function SuperDashboard() {
  const [kpis, setKpis] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dashRes, branchRes] = await Promise.all([
        dashboardAPI.get(),
        branchesAPI.list(),
      ])
      setKpis(dashRes.data)
      setBranches(toArray(branchRes.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner spinner--lg" />
        <p>Loading group dashboard…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Group Dashboard</h1>
        <p className="page-header__sub">Overview across all Kilele Ridge business units</p>
      </div>

      {/* Group-wide KPIs */}
      <div className="kpi-grid">
        <KPICard label="Tujijenge Members" value={fmt(kpis?.tujijenge_members)} icon="bi-people" color="blue" to="/tujijenge/members" />
        <KPICard label="Contributions (MTD)" value={fmtKES(kpis?.tujijenge_contributions_mtd)} icon="bi-wallet2" color="green" to="/tujijenge/contributions" />
        <KPICard label="Loans Outstanding" value={fmtKES(kpis?.tujijenge_loans_outstanding)} icon="bi-cash-stack" color="orange" to="/tujijenge/loans" />
        <KPICard label="Total Arrears" value={fmtKES(kpis?.tujijenge_arrears)} icon="bi-exclamation-triangle" color="red" to="/tujijenge/reports" />
        <KPICard label="Active Investors" value={fmt(kpis?.wa_investors)} icon="bi-person-badge" color="blue" to="/wealth-alliance/investors" />
        <KPICard label="Table Banking Members" value={fmt(kpis?.tb_members)} icon="bi-people-fill" color="orange" to="/table-banking/members" />
        <KPICard label="Active Properties" value={fmt(kpis?.rentals_properties)} icon="bi-building" color="blue" to="/rentals/properties" />
        <KPICard label="Pending Approvals" value={fmt(kpis?.pending_approvals)} icon="bi-check2-square" color={kpis?.pending_approvals > 0 ? 'red' : 'blue'} to="/approvals" />
      </div>

      {/* M-Pesa attention strip */}
      {(kpis?.mpesa_review_queue > 0 || kpis?.mpesa_exception_queue > 0) && (
        <div className="alert alert--warning" style={{ marginBottom: 24 }}>
          <i className="bi bi-exclamation-triangle" />
          <span>
            <strong>{kpis?.mpesa_review_queue || 0}</strong> transactions in the M-Pesa review queue and{' '}
            <strong>{kpis?.mpesa_exception_queue || 0}</strong> in exceptions need attention.{' '}
            <Link to="/mpesa/queue">Review now →</Link>
          </span>
        </div>
      )}

      {/* Branch cards */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">All Branches</h3>
          <Link to="/branches" className="btn btn--secondary btn--sm">
            <i className="bi bi-gear" /> Manage Branches
          </Link>
        </div>
        <div className="card__body">
          {branches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><i className="bi bi-diagram-3" /></div>
              <h3 className="empty-state__title">No branches yet</h3>
              <p className="empty-state__desc">Create your first branch to get started.</p>
              <Link to="/branches" className="btn btn--primary mt-16">
                <i className="bi bi-plus" /> Create Branch
              </Link>
            </div>
          ) : (
            <div className="branch-grid">
              {branches.map(branch => {
                const meta = BRANCH_TYPE_META[branch.branch_type] || BRANCH_TYPE_META.CUSTOM
                return (
                  <div key={branch.id} className="branch-card">
                    <div className={`branch-card__icon branch-card__icon--${meta.color}`}>
                      <i className={`bi ${meta.icon}`} />
                    </div>
                    <div className="branch-card__body">
                      <h4 className="branch-card__name">{branch.name}</h4>
                      <p className="branch-card__type">{meta.label}</p>
                      <div className="branch-card__stats">
                        <span><i className="bi bi-people" /> {fmt(branch.member_count)} members</span>
                        <span className={`badge ${branch.is_active ? 'badge--green' : 'badge--gray'}`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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