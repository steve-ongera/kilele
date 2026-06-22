import { useState, useEffect } from 'react'
import { reportsAPI, branchesAPI, toArray } from '../../services/api'

const REPORT_TYPES = [
  { type: 'contributions', label: 'Contributions', icon: 'bi-wallet2' },
  { type: 'loans', label: 'Loans', icon: 'bi-cash-stack' },
  { type: 'arrears', label: 'Arrears', icon: 'bi-exclamation-triangle' },
  { type: 'members', label: 'Members', icon: 'bi-people' },
  { type: 'rent-collection', label: 'Rent Collection', icon: 'bi-receipt' },
]

export default function Reports() {
  const [branches, setBranches] = useState([])
  const [reportType, setReportType] = useState('contributions')
  const [filters, setFilters] = useState({ branch: '', year: new Date().getFullYear(), month: '' })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    branchesAPI.list().then(res => setBranches(toArray(res.data))).catch(() => { })
  }, [])

  const handlePreview = async () => {
    setLoading(true)
    try {
      const res = await reportsAPI.get(reportType, filters)
      setData(toArray(res.data))
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    setGenerating(true)
    try {
      await reportsAPI.downloadCSV(reportType, filters, `${reportType}-report.csv`)
    } catch {
      // silent
    } finally {
      setGenerating(false)
    }
  }

  const columns = data.length > 0 ? Object.keys(data[0]).slice(0, 7) : []

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Reports</h1>
        <p className="page-header__sub">Cross-branch report generator</p>
      </div>

      <div className="card mb-24">
        <div className="card__body">
          <div className="form-row" style={{ alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Report Type</label>
              <select className="form-control" value={reportType} onChange={e => setReportType(e.target.value)}>
                {REPORT_TYPES.map(r => <option key={r.type} value={r.type}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Branch</label>
              <select className="form-control" value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Year</label>
              <input type="number" className="form-control" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Month</label>
              <select className="form-control" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
                <option value="">All</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en-KE', { month: 'short' })}</option>
                ))}
              </select>
            </div>
            <div className="d-flex gap-8">
              <button className="btn btn--primary" onClick={handlePreview} disabled={loading}>
                {loading ? <span className="spinner spinner--sm spinner--white" /> : <i className="bi bi-eye" />} Preview
              </button>
              <button className="btn btn--secondary" onClick={handleExportCSV} disabled={generating}>
                {generating ? <span className="spinner spinner--sm" /> : <i className="bi bi-download" />} CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">{REPORT_TYPES.find(r => r.type === reportType)?.label} Preview</h3>
          {data.length > 0 && <span className="badge badge--blue">{data.length} records</span>}
        </div>
        <div className="table-wrap">
          {data.length === 0 ? (
            <div className="table-empty">
              <i className="bi bi-bar-chart-line" />
              <p>Click "Preview" to load report data.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>{columns.map(c => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    {columns.map(c => (
                      <td key={c} className={typeof row[c] === 'number' ? 'kes' : ''}>
                        {String(row[c] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {data.length > 50 && (
          <div className="card__footer">
            <span className="text-muted text-sm">Showing 50 of {data.length} records — export CSV for full data.</span>
          </div>
        )}
      </div>
    </div>
  )
}