//src/pages/tujijenge/TujijengeReports.jsx
import { useState } from 'react'
import { reportsAPI } from '../../services/api'

const REPORTS = [
  { type: 'contributions', label: 'Contributions Report', icon: 'bi-wallet2', desc: 'All contribution records by period' },
  { type: 'loans', label: 'Loans Report', icon: 'bi-cash-stack', desc: 'Loan portfolio status and balances' },
  { type: 'arrears', label: 'Arrears Report', icon: 'bi-exclamation-triangle', desc: 'Members with outstanding arrears' },
  { type: 'members', label: 'Members Report', icon: 'bi-people', desc: 'Full member roster and status' },
]

export default function TujijengeReports() {
  const [filters, setFilters] = useState({ year: new Date().getFullYear(), month: '' })
  const [generating, setGenerating] = useState('')

  const handleGenerate = async (type, format) => {
    setGenerating(`${type}-${format}`)
    try {
      if (format === 'csv') {
        await reportsAPI.downloadCSV(type, filters, `tujijenge-${type}-${filters.year}.csv`)
      } else {
        const res = await reportsAPI.get(type, filters)
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tujijenge-${type}-${filters.year}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // silent
    } finally {
      setGenerating('')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Tujijenge Reports</h1>
        <p className="page-header__sub">Generate and export Tujijenge branch reports</p>
      </div>

      <div className="card mb-24">
        <div className="card__body">
          <div className="form-row" style={{ alignItems: 'end' }}>
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
          </div>
        </div>
      </div>

      <div className="report-grid">
        {REPORTS.map(r => (
          <div key={r.type} className="card report-card">
            <div className="card__body">
              <div className="report-card__icon"><i className={`bi ${r.icon}`} /></div>
              <h3 className="report-card__title">{r.label}</h3>
              <p className="report-card__desc">{r.desc}</p>
              <div className="d-flex gap-8 mt-16">
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => handleGenerate(r.type, 'csv')}
                  disabled={generating === `${r.type}-csv`}
                >
                  {generating === `${r.type}-csv` ? <span className="spinner spinner--sm" /> : <i className="bi bi-filetype-csv" />} CSV
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => handleGenerate(r.type, 'json')}
                  disabled={generating === `${r.type}-json`}
                >
                  {generating === `${r.type}-json` ? <span className="spinner spinner--sm" /> : <i className="bi bi-filetype-json" />} JSON
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}