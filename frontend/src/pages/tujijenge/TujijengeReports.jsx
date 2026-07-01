import { useState, useEffect } from 'react'
import { reportsAPI, branchesAPI, toArray } from '../../services/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmt = (n) => Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })
const fmtKES = (n) => `KES ${fmt(n)}`

const PIE_COLORS = ['#2563eb', '#f97316', '#16a34a', '#9333ea', '#dc2626', '#0891b2']

const TABLE_TABS = [
  { key: 'contributions', label: 'Contributions' },
  { key: 'loans', label: 'Loans' },
  { key: 'arrears', label: 'Arrears' },
]

export default function TujijengeReports() {
  const [filters, setFilters] = useState({ year: new Date().getFullYear(), month: '', branch: '' })
  const [branches, setBranches] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('contributions')
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    branchesAPI.list()
      .then(r => setBranches(toArray(r.data).filter(b => b.branch_type === 'TUJIJENGE')))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchSummary() }, [filters.year, filters.month, filters.branch])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await reportsAPI.tujijengeSummary(filters)
      setSummary(res.data)
    } catch {
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const activeRows = summary?.[`${activeTab}_table`] || []

  // ── EXPORT: EXCEL ──────────────────────────────
  const handleExportExcel = () => {
    setExporting('excel')
    try {
      const wb = XLSX.utils.book_new()

      const summaryRows = [
        ['Tujijenge Report Summary'],
        ['Year', filters.year],
        ['Month', filters.month || 'All'],
        [],
        ['Metric', 'Value'],
        ['Active Members', summary?.stats?.total_members],
        ['Total Contributions', summary?.stats?.total_contributions],
        ['Loans Outstanding', summary?.stats?.total_loans_outstanding],
        ['Total Arrears', summary?.stats?.total_arrears],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary')

      const trendRows = (summary?.trend || []).map(t => ({
        Month: t.month, Contributions: t.contributions, Arrears: t.arrears,
      }))
      if (trendRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendRows), 'Trend')
      }

      ;['contributions', 'loans', 'arrears'].forEach(key => {
        const rows = summary?.[`${key}_table`] || []
        if (rows.length) {
          const ws = XLSX.utils.json_to_sheet(rows)
          XLSX.utils.book_append_sheet(wb, ws, key.charAt(0).toUpperCase() + key.slice(1))
        }
      })

      XLSX.writeFile(wb, `tujijenge-report-${filters.year}${filters.month ? '-' + filters.month : ''}.xlsx`)
    } finally {
      setExporting('')
    }
  }

  // ── EXPORT: PDF ────────────────────────────────
  const handleExportPDF = () => {
    setExporting('pdf')
    try {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Tujijenge Report', 14, 18)
      doc.setFontSize(10)
      doc.text(`Period: ${filters.month ? filters.month + '/' : ''}${filters.year}`, 14, 25)

      autoTable(doc, {
        startY: 32,
        head: [['Metric', 'Value']],
        body: [
          ['Active Members', fmt(summary?.stats?.total_members)],
          ['Total Contributions', fmtKES(summary?.stats?.total_contributions)],
          ['Loans Outstanding', fmtKES(summary?.stats?.total_loans_outstanding)],
          ['Total Arrears', fmtKES(summary?.stats?.total_arrears)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
      })

      if (activeRows.length) {
        const columns = Object.keys(activeRows[0]).filter(k => typeof activeRows[0][k] !== 'object')
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [columns],
          body: activeRows.map(r => columns.map(c => r[c])),
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] },
          styles: { fontSize: 7 },
        })
      }

      doc.save(`tujijenge-${activeTab}-${filters.year}.pdf`)
    } finally {
      setExporting('')
    }
  }

  if (loading && !summary) {
    return (
      <div className="loading-state">
        <span className="spinner spinner--lg" />
        <p>Loading Tujijenge reports…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Tujijenge Reports</h1>
        <p className="page-header__sub">Statistical and graphical overview of the Tujijenge Savings Circle</p>
      </div>

      {/* Filters + export */}
      <div className="card mb-24">
        <div className="card__body">
          <div className="form-row" style={{ alignItems: 'end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Year</label>
              <input
                type="number"
                className="form-control"
                value={filters.year}
                onChange={e => setFilters({ ...filters, year: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Month (optional)</label>
              <select className="form-control" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('en-KE', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            {branches.length > 1 && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Branch</label>
                <select className="form-control" value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })}>
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 0, marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn--secondary btn--sm" onClick={handleExportExcel} disabled={exporting === 'excel'}>
                {exporting === 'excel' ? <span className="spinner spinner--sm" /> : <i className="bi bi-file-earmark-excel" />} Export Excel
              </button>
              <button className="btn btn--secondary btn--sm" onClick={handleExportPDF} disabled={exporting === 'pdf'}>
                {exporting === 'pdf' ? <span className="spinner spinner--sm" /> : <i className="bi bi-file-earmark-pdf" />} Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="kpi-grid">
        <KPICard label="Active Members" value={fmt(summary?.stats?.total_members)} icon="bi-people" color="blue" />
        <KPICard label="Total Contributions" value={fmtKES(summary?.stats?.total_contributions)} icon="bi-wallet2" color="green" />
        <KPICard label="Loans Outstanding" value={fmtKES(summary?.stats?.total_loans_outstanding)} icon="bi-cash-stack" color="orange" />
        <KPICard label="Total Arrears" value={fmtKES(summary?.stats?.total_arrears)} icon="bi-exclamation-triangle" color="red" />
      </div>

      {/* 3 graphs */}
      <div className="graph-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card__header"><h3 className="card__title">Contributions vs Arrears ({filters.year})</h3></div>
          <div className="card__body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={fmt} />
                <Tooltip formatter={(v) => fmtKES(v)} />
                <Legend />
                <Line type="monotone" dataKey="contributions" name="Contributions" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="arrears" name="Arrears" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card__header"><h3 className="card__title">Loan Portfolio by Status</h3></div>
          <div className="card__body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.loan_breakdown || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" angle={-20} textAnchor="end" height={60} />
                <YAxis tickFormatter={fmt} />
                <Tooltip formatter={(v) => fmtKES(v)} />
                <Legend />
                <Bar dataKey="amount" name="Balance (KES)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card__header"><h3 className="card__title">Active Members by Branch</h3></div>
          <div className="card__body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.branch_distribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(summary?.branch_distribution || []).map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabbed data tables */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Detailed Records</h3>
          <div className="d-flex gap-8">
            {TABLE_TABS.map(t => (
              <button
                key={t.key}
                className={`btn btn--sm ${activeTab === t.key ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label} ({(summary?.[`${t.key}_table`] || []).length})
              </button>
            ))}
          </div>
        </div>
        <div className="card__body" style={{ overflowX: 'auto' }}>
          {activeRows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><i className="bi bi-table" /></div>
              <h3 className="empty-state__title">No records</h3>
              <p className="empty-state__desc">No {activeTab} data found for the selected filters.</p>
            </div>
          ) : (
            <ReportTable tab={activeTab} rows={activeRows} />
          )}
        </div>
      </div>
    </div>
  )
}

function ReportTable({ tab, rows }) {
  if (tab === 'loans') {
    return (
      <table className="table">
        <thead>
          <tr><th>Loan #</th><th>Member</th><th>Product</th><th>Principal</th><th>Balance</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.loan_number}</td>
              <td>{r.member_name} <span className="text-muted">({r.member_number})</span></td>
              <td>{r.product_name}</td>
              <td>{fmtKES(r.principal)}</td>
              <td>{fmtKES(r.balance)}</td>
              <td><span className="badge">{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
  return (
    <table className="table">
      <thead>
        <tr><th>Member</th><th>Period</th><th>Expected</th><th>Paid</th><th>Arrears</th><th>Status</th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td>{r.member_name} <span className="text-muted">({r.member_number})</span></td>
            <td>{r.period_month}/{r.period_year}</td>
            <td>{fmtKES(r.expected)}</td>
            <td>{fmtKES(r.paid)}</td>
            <td className={Number(r.arrears) > 0 ? 'text-danger' : ''}>{fmtKES(r.arrears)}</td>
            <td><span className="badge">{r.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function KPICard({ label, value, icon, color }) {
  return (
    <div className={`kpi-card kpi-card--${color}`}>
      <div className="kpi-card__icon"><i className={`bi ${icon}`} /></div>
      <p className="kpi-card__label">{label}</p>
      <p className="kpi-card__value">{value}</p>
    </div>
  )
}