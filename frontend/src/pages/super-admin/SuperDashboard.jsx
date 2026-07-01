import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI, branchesAPI, toArray } from '../../services/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const fmt = (n) => Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })
const fmtKES = (n) => `KES ${fmt(n)}`

const BRANCH_TYPE_META = {
  TUJIJENGE:       { icon: 'bi-piggy-bank',      color: 'blue',   label: 'Tujijenge Savings Circle' },
  WEALTH_ALLIANCE: { icon: 'bi-graph-up-arrow',  color: 'green',  label: 'Wealth Alliance' },
  TABLE_BANKING:   { icon: 'bi-people-fill',     color: 'orange', label: 'Table Banking' },
  RENTALS:         { icon: 'bi-building',        color: 'blue',   label: 'Rentals' },
  CUSTOM:          { icon: 'bi-grid',            color: 'gray',   label: 'Custom' },
}

const PIE_COLORS = ['#2563eb', '#f97316', '#16a34a', '#9333ea']

export default function SuperDashboard() {
  const [kpis, setKpis] = useState(null)
  const [branches, setBranches] = useState([])
  const [graphs, setGraphs] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dashRes, branchRes, graphRes] = await Promise.all([
        dashboardAPI.get(),
        branchesAPI.list(),
        dashboardAPI.graphs(),
      ])
      setKpis(dashRes.data)
      setBranches(toArray(branchRes.data))
      setGraphs(graphRes.data)
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

      {/* ── GRAPHS ────────────────────────────────── */}
      <div className="graph-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* LINE GRAPH — Contributions vs Loans Disbursed */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Contributions vs Loans Disbursed (6 months)</h3>
          </div>
          <div className="card__body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphs?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => fmt(v)} />
                <Tooltip formatter={(v) => fmtKES(v)} />
                <Legend />
                <Line type="monotone" dataKey="contributions" name="Contributions" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="loans_disbursed" name="Loans Disbursed" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BAR GRAPH — Branch comparison */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Members & Contributions by Branch</h3>
          </div>
          <div className="card__body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphs?.branch_comparison || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch_name" />
                <YAxis yAxisId="left" tickFormatter={(v) => fmt(v)} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => fmt(v)} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="members" name="Active Members" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="contributions" name="Contributions (KES)" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3D-STYLE PIE — distribution across business units */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card__header">
            <h3 className="card__title">Active People by Business Unit</h3>
          </div>
          <div className="card__body" style={{ height: 340, perspective: 800 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* shadow/base layer offset down+scaled to fake depth */}
                <Pie
                  data={graphs?.distribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="54%"
                  innerRadius={0}
                  outerRadius={110}
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {(graphs?.distribution || []).map((entry, i) => (
                    <Cell key={`shadow-${i}`} fill="#00000022" stroke="none" />
                  ))}
                </Pie>
                {/* main colored layer, slightly higher, creates the "raised" 3D look */}
                <Pie
                  data={graphs?.distribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  outerRadius={110}
                  startAngle={90}
                  endAngle={-270}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(graphs?.distribution || []).map((entry, i) => (
                    <Cell key={`slice-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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