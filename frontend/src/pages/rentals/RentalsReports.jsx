import { useState, useEffect } from 'react'
import { reportsAPI, propertiesAPI, toArray } from '../../services/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmt = (n) => Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })
const fmtKES = (n) => `KES ${fmt(n)}`

const PIE_COLORS = ['#16a34a', '#dc2626', '#f97316', '#2563eb', '#9333ea']

const TABLE_TABS = [
  { key: 'rent_collection', label: 'Rent Collection' },
  { key: 'arrears', label: 'Arrears' },
  { key: 'occupancy', label: 'Occupancy' },
  { key: 'maintenance', label: 'Maintenance' },
]

export default function RentalsReports() {
  const [filters, setFilters] = useState({ year: new Date().getFullYear(), month: '', property: '' })
  const [properties, setProperties] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rent_collection')
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    propertiesAPI.list()
      .then(r => setProperties(toArray(r.data)))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchSummary() }, [filters.year, filters.month, filters.property])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await reportsAPI.rentalsSummary(filters)
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
        ['Rentals Report Summary'],
        ['Year', filters.year],
        ['Month', filters.month || 'All'],
        [],
        ['Metric', 'Value'],
        ['Active Properties', summary?.stats?.total_properties],
        ['Occupancy Rate (%)', summary?.stats?.occupancy_rate],
        ['Rent Collected', summary?.stats?.rent_collected],
        ['Total Arrears', summary?.stats?.total_arrears],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary')

      const trendRows = (summary?.trend || []).map(t => ({
        Month: t.month, Expected: t.expected, Collected: t.collected,
      }))
      if (trendRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendRows), 'Trend')
      }

      const profitRows = (summary?.profitability || []).map(p => ({
        Property: p.property_name, Income: p.income, 'Maintenance Cost': p.maintenance_cost, Net: p.net,
      }))
      if (profitRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profitRows), 'Profitability')
      }

      TABLE_TABS.forEach(({ key, label }) => {
        const rows = summary?.[`${key}_table`] || []
        if (rows.length) {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), label.slice(0, 31))
        }
      })

      XLSX.writeFile(wb, `rentals-report-${filters.year}${filters.month ? '-' + filters.month : ''}.xlsx`)
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
      doc.text('Rentals Report', 14, 18)
      doc.setFontSize(10)
      doc.text(`Period: ${filters.month ? filters.month + '/' : ''}${filters.year}`, 14, 25)

      autoTable(doc, {
        startY: 32,
        head: [['Metric', 'Value']],
        body: [
          ['Active Properties', fmt(summary?.stats?.total_properties)],
          ['Occupancy Rate', `${summary?.stats?.occupancy_rate ?? 0}%`],
          ['Rent Collected', fmtKES(summary?.stats?.rent_collected)],
          ['Total Arrears', fmtKES(summary?.stats?.total_arrears)],
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

      doc.save(`rentals-${activeTab}-${filters.year}.pdf`)
    } finally {
      setExporting('')
    }
  }

  if (loading && !summary) {
    return (
      <div className="loading-state">
        <span className="spinner spinner--lg" />
        <p>Loading rentals reports…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Rentals Reports</h1>
        <p className="page-header__sub">Collection, arrears, occupancy and profitability reports</p>
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
            {properties.length > 1 && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Property</label>
                <select className="form-control" value={filters.property} onChange={e => setFilters({ ...filters, property: e.target.value })}>
                  <option value="">All Properties</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
        <KPICard label="Active Properties" value={fmt(summary?.stats?.total_properties)} icon="bi-building" color="blue" />
        <KPICard label="Occupancy Rate" value={`${summary?.stats?.occupancy_rate ?? 0}%`} icon="bi-house-check" color="green" />
        <KPICard label="Rent Collected" value={fmtKES(summary?.stats?.rent_collected)} icon="bi-receipt" color="orange" />
        <KPICard label="Total Arrears" value={fmtKES(summary?.stats?.total_arrears)} icon="bi-exclamation-triangle" color="red" />
      </div>

      {/* 3 graphs */}
      <div className="graph-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card__header"><h3 className="card__title">Rent Expected vs Collected ({filters.year})</h3></div>
          <div className="card__body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={fmt} />
                <Tooltip formatter={(v) => fmtKES(v)} />
                <Legend />
                <Line type="monotone" dataKey="expected" name="Expected" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="collected" name="Collected" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card__header"><h3 className="card__title">Income vs Maintenance Cost by Property</h3></div>
          <div className="card__body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.profitability || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="property_name" angle={-20} textAnchor="end" height={60} />
                <YAxis tickFormatter={fmt} />
                <Tooltip formatter={(v) => fmtKES(v)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maintenance_cost" name="Maintenance Cost" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card__header"><h3 className="card__title">Unit Occupancy Status</h3></div>
          <div className="card__body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.occupancy_distribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(summary?.occupancy_distribution || []).map((entry, i) => (
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
              <p className="empty-state__desc">No {activeTab.replace('_', ' ')} data found for the selected filters.</p>
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
  if (tab === 'occupancy') {
    return (
      <table className="table">
        <thead>
          <tr><th>Property</th><th>Unit #</th><th>Type</th><th>Monthly Rent</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.property_name} <span className="text-muted">({r.property_code})</span></td>
              <td>{r.unit_number}</td>
              <td>{r.unit_type || '—'}</td>
              <td>{fmtKES(r.monthly_rent)}</td>
              <td><span className={`badge ${r.occupancy_status === 'OCCUPIED' ? 'badge--green' : 'badge--gray'}`}>{r.occupancy_status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (tab === 'maintenance') {
    return (
      <table className="table">
        <thead>
          <tr><th>Unit</th><th>Tenant</th><th>Title</th><th>Cost</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.unit_number}</td>
              <td>{r.tenant_name || '—'}</td>
              <td>{r.title}</td>
              <td>{fmtKES(r.cost)}</td>
              <td><span className="badge">{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // rent_collection & arrears share the same shape
  return (
    <table className="table">
      <thead>
        <tr><th>Tenant</th><th>Unit</th><th>Period</th><th>Expected</th><th>Paid</th><th>Arrears</th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td>{r.tenant_name}</td>
            <td>{r.unit_number}</td>
            <td>{r.period_month}/{r.period_year}</td>
            <td>{fmtKES(r.expected)}</td>
            <td>{fmtKES(r.paid)}</td>
            <td className={Number(r.arrears) > 0 ? 'text-danger' : ''}>{fmtKES(r.arrears)}</td>
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