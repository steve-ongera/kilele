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

const PIE_COLORS = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#dc2626', '#0891b2', '#eab308']

const TABLE_TABS = [
  { key: 'contributions', label: 'Collections' },
  { key: 'loans', label: 'Loans' },
  { key: 'arrears', label: 'Arrears' },
  { key: 'members', label: 'Members' },
]

export default function TBReports() {
  const [filters, setFilters] = useState({ year: new Date().getFullYear(), month: '', branch: '' })
  const [branches, setBranches] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('contributions')
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    branchesAPI.list()
      .then(r => setBranches(toArray(r.data).filter(b => b.branch_type === 'TABLE_BANKING')))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchSummary() }, [filters.year, filters.month, filters.branch])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await reportsAPI.tbSummary(filters)
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
        ['Table Banking Report Summary'],
        ['Year', filters.year],
        ['Month', filters.month || 'All'],
        [],
        ['Metric', 'Value'],
        ['Active Members', summary?.stats?.total_members],
        ['Total Contributions', summary?.stats?.total_contributions],
        ['Loans Outstanding', summary?.stats?.loans_outstanding],
        ['Available Lending Fund', summary?.stats?.lending_fund],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary')

      const trendRows = (summary?.trend || []).map(t => ({
        Month: t.month, Contributions: t.contributions, 'Loans Disbursed': t.loans_disbursed,
      }))
      if (trendRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendRows), 'Trend')
      }

      const branchRows = (summary?.branch_comparison || []).map(b => ({
        Branch: b.branch_name, Members: b.members, Contributions: b.contributions,
      }))
      if (branchRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(branchRows), 'Branch Comparison')
      }

      TABLE_TABS.forEach(({ key, label }) => {
        const rows = summary?.[`${key}_table`] || []
        if (rows.length) {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), label.slice(0, 31))
        }
      })

      XLSX.writeFile(wb, `table-banking-report-${filters.year}${filters.month ? '-' + filters.month : ''}.xlsx`)
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
      doc.text('Table Banking Report', 14, 18)
      doc.setFontSize(10)
      doc.text(`Period: ${filters.month ? filters.month + '/' : ''}${filters.year}`, 14, 25)

      autoTable(doc, {
        startY: 32,
        head: [['Metric', 'Value']],
        body: [
          ['Active Members', fmt(summary?.stats?.total_members)],
          ['Total Contributions', fmtKES(summary?.stats?.total_contributions)],
          ['Loans Outstanding', fmtKES(summary?.stats?.loans_outstanding)],
          ['Available Lending Fund', fmtKES(summary?.stats?.lending_fund)],
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

      doc.save(`table-banking-${activeTab}-${filters.year}.pdf`)
    } finally {
      setExporting('')
    }
  }

  if (loading && !summary) {
    return (
      <div className="loading-state">
        <span className="spinner spinner--lg" />
        <p>Loading table banking reports…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Table Banking Reports</h1>
        <p className="page-header__sub">Statistical and graphical overview of table banking groups</p>
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
        <KPICard label="Active Members" value={fmt(summary?.stats?.total_members)} icon="bi-people-fill" color="blue" />
        <KPICard label="Total Contributions" value={fmtKES(summary?.stats?.total_contributions)} icon="bi-wallet2" color="green" />
        <KPICard label="Loans Outstanding" value={fmtKES(summary?.stats?.loans_outstanding)} icon="bi-cash-stack" color="orange" />
        <KPICard label="Available Lending Fund" value={fmtKES(summary?.stats?.lending_fund)} icon="bi-bank" color="blue" />
      </div>

      {/* 3 graphs */}
      <div className="graph-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card__header"><h3 className="card__title">Contributions vs Loans Disbursed ({filters.year})</h3></div>
          <div className="card__body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={fmt} />
                <Tooltip formatter={(v) => fmtKES(v)} />
                <Legend />
                <Line type="monotone" dataKey="contributions" name="Contributions" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="loans_disbursed" name="Loans Disbursed" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card__header"><h3 className="card__title">Members & Contributions by Branch</h3></div>
          <div className="card__body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.branch_comparison || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch_name" />
                <YAxis yAxisId="left" tickFormatter={fmt} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={fmt} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="members" name="Members" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="contributions" name="Contributions (KES)" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card__header"><h3 className="card__title">Loan Portfolio Status Distribution</h3></div>
          <div className="card__body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.loan_distribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(summary?.loan_distribution || []).map((entry, i) => (
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

  if (tab === 'members') {
    return (
      <table className="table">
        <thead>
          <tr><th>Member #</th><th>Name</th><th>Phone</th><th>Branch</th><th>Contributions</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.member_number}</td>
              <td>{r.full_name}</td>
              <td>{r.phone}</td>
              <td>{r.branch_name}</td>
              <td>{fmtKES(r.total_contributions)}</td>
              <td><span className="badge">{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // contributions & arrears share the same shape
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