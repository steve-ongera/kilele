import { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmt = (n) => Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })
const fmtKES = (n) => `KES ${fmt(n)}`

const PIE_COLORS = ['#16a34a', '#eab308', '#f97316', '#dc2626']

const TABLE_TABS = [
  { key: 'investors', label: 'Investor Portfolio' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'dividends', label: 'Dividend History' },
  { key: 'withdrawals', label: 'Withdrawals' },
]

export default function WealthReports() {
  const [filters, setFilters] = useState({ year: new Date().getFullYear() })
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('investors')
  const [exporting, setExporting] = useState('')

  useEffect(() => { fetchSummary() }, [filters.year])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await reportsAPI.wealthSummary(filters)
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
        ['Wealth Alliance Report Summary'],
        ['Year', filters.year],
        [],
        ['Metric', 'Value'],
        ['Active Investors', summary?.stats?.total_investors],
        ['Total Capital', summary?.stats?.total_capital],
        ['Dividends Paid (Year)', summary?.stats?.dividends_paid],
        ['Pending Withdrawals', summary?.stats?.pending_withdrawals],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary')

      const trendRows = (summary?.trend || []).map(t => ({
        Month: t.month, Deposits: t.deposits, Withdrawals: t.withdrawals,
      }))
      if (trendRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendRows), 'Capital Flow')
      }

      const assetRows = (summary?.asset_breakdown || []).map(a => ({
        'Asset Class': a.asset_class, 'Capital Deployed': a.amount,
      }))
      if (assetRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assetRows), 'By Asset Class')
      }

      TABLE_TABS.forEach(({ key, label }) => {
        const rows = summary?.[`${key}_table`] || []
        if (rows.length) {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), label.slice(0, 31))
        }
      })

      XLSX.writeFile(wb, `wealth-alliance-report-${filters.year}.xlsx`)
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
      doc.text('Wealth Alliance Report', 14, 18)
      doc.setFontSize(10)
      doc.text(`Year: ${filters.year}`, 14, 25)

      autoTable(doc, {
        startY: 32,
        head: [['Metric', 'Value']],
        body: [
          ['Active Investors', fmt(summary?.stats?.total_investors)],
          ['Total Capital', fmtKES(summary?.stats?.total_capital)],
          ['Dividends Paid (Year)', fmtKES(summary?.stats?.dividends_paid)],
          ['Pending Withdrawals', fmt(summary?.stats?.pending_withdrawals)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
      })

      if (activeRows.length) {
        const columns = Object.keys(activeRows[0]).filter(k => typeof activeRows[0][k] !== 'object')
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [columns],
          body: activeRows.map(r => columns.map(c => r[c])),
          theme: 'striped',
          headStyles: { fillColor: [22, 163, 74] },
          styles: { fontSize: 7 },
        })
      }

      doc.save(`wealth-alliance-${activeTab}-${filters.year}.pdf`)
    } finally {
      setExporting('')
    }
  }

  if (loading && !summary) {
    return (
      <div className="loading-state">
        <span className="spinner spinner--lg" />
        <p>Loading wealth alliance reports…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Wealth Alliance Reports</h1>
        <p className="page-header__sub">Portfolio, ROI, dividend and capital flow reports</p>
      </div>

      {/* Filters + export */}
      <div className="card mb-24">
        <div className="card__body">
          <div className="form-row" style={{ alignItems: 'end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, maxWidth: 160 }}>
              <label className="form-label">Year</label>
              <input
                type="number"
                className="form-control"
                value={filters.year}
                onChange={e => setFilters({ ...filters, year: e.target.value })}
              />
            </div>
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
        <KPICard label="Active Investors" value={fmt(summary?.stats?.total_investors)} icon="bi-person-badge" color="blue" />
        <KPICard label="Total Capital" value={fmtKES(summary?.stats?.total_capital)} icon="bi-graph-up-arrow" color="green" />
        <KPICard label="Dividends Paid (Year)" value={fmtKES(summary?.stats?.dividends_paid)} icon="bi-currency-dollar" color="orange" />
        <KPICard label="Pending Withdrawals" value={fmt(summary?.stats?.pending_withdrawals)} icon="bi-shield-check" color={summary?.stats?.pending_withdrawals > 0 ? 'red' : 'blue'} />
      </div>

      {/* 3 graphs */}
      <div className="graph-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card__header"><h3 className="card__title">Capital Flow: Deposits vs Withdrawals ({filters.year})</h3></div>
          <div className="card__body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={fmt} />
                <Tooltip formatter={(v) => fmtKES(v)} />
                <Legend />
                <Line type="monotone" dataKey="deposits" name="Deposits" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card__header"><h3 className="card__title">Capital Deployed by Asset Class</h3></div>
          <div className="card__body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.asset_breakdown || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="asset_class" angle={-20} textAnchor="end" height={60} />
                <YAxis tickFormatter={fmt} />
                <Tooltip formatter={(v) => fmtKES(v)} />
                <Legend />
                <Bar dataKey="amount" name="Capital (KES)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card__header"><h3 className="card__title">Capital Distribution by Risk Level</h3></div>
          <div className="card__body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.risk_distribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(summary?.risk_distribution || []).map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmtKES(v)} />
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
              <p className="empty-state__desc">No {activeTab} data found for the selected year.</p>
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
  if (tab === 'investors') {
    return (
      <table className="table">
        <thead>
          <tr><th>Investor #</th><th>Name</th><th>Phone</th><th>Current Capital</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.investor_number}</td>
              <td>{r.full_name}</td>
              <td>{r.phone}</td>
              <td>{fmtKES(r.current_capital)}</td>
              <td><span className="badge">{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (tab === 'transactions') {
    return (
      <table className="table">
        <thead>
          <tr><th>Investor</th><th>Asset Class</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.investor_name}</td>
              <td>{r.asset_class_name || '—'}</td>
              <td><span className="badge">{r.transaction_type}</span></td>
              <td>{fmtKES(r.amount)}</td>
              <td>{r.transaction_date}</td>
              <td>{r.approval_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (tab === 'dividends') {
    return (
      <table className="table">
        <thead>
          <tr><th>Investor</th><th>Share %</th><th>Dividend Amount</th><th>Option</th><th>Processed</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              <td>{r.investor_name}</td>
              <td>{Number(r.investor_share_pct).toFixed(2)}%</td>
              <td>{fmtKES(r.dividend_amount)}</td>
              <td>{r.option}</td>
              <td><span className={`badge ${r.is_processed ? 'badge--green' : 'badge--gray'}`}>{r.is_processed ? 'Yes' : 'No'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // withdrawals
  return (
    <table className="table">
      <thead>
        <tr><th>Investor</th><th>Type</th><th>Requested</th><th>Paid</th><th>Status</th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td>{r.investor_name}</td>
            <td>{r.withdrawal_type}</td>
            <td>{fmtKES(r.amount_requested)}</td>
            <td>{fmtKES(r.amount_paid)}</td>
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