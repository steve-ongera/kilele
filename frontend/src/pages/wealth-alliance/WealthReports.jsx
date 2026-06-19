import { useState } from 'react'
import { reportsAPI } from '../../services/api'

const REPORTS = [
  { type: 'members', label: 'Investor Portfolio', icon: 'bi-person-badge', desc: 'Capital, ROI and status by investor' },
  { type: 'loans', label: 'ROI & Returns', icon: 'bi-graph-up-arrow', desc: 'Return on investment across asset classes' },
  { type: 'contributions', label: 'Dividend History', icon: 'bi-currency-dollar', desc: 'All declared dividends and splits' },
  { type: 'arrears', label: 'Audit Trail', icon: 'bi-shield-check', desc: 'Wealth Alliance transaction audit log' },
]

export default function WealthReports() {
  const [filters, setFilters] = useState({ year: new Date().getFullYear() })
  const [generating, setGenerating] = useState('')

  const handleGenerate = async (type, format) => {
    setGenerating(`${type}-${format}`)
    try {
      if (format === 'csv') {
        await reportsAPI.downloadCSV(type, filters, `wealth-alliance-${type}-${filters.year}.csv`)
      } else {
        const res = await reportsAPI.get(type, filters)
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `wealth-alliance-${type}-${filters.year}.json`
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
        <h1 className="page-header__title">Wealth Alliance Reports</h1>
        <p className="page-header__sub">Portfolio, ROI, dividend and audit reports</p>
      </div>

      <div className="card mb-24">
        <div className="card__body">
          <div className="form-group" style={{ marginBottom: 0, maxWidth: 160 }}>
            <label className="form-label">Year</label>
            <input
              type="number"
              className="form-control"
              value={filters.year}
              onChange={e => setFilters({ ...filters, year: e.target.value })}
            />
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
                <button className="btn btn--secondary btn--sm" onClick={() => handleGenerate(r.type, 'csv')} disabled={generating === `${r.type}-csv`}>
                  {generating === `${r.type}-csv` ? <span className="spinner spinner--sm" /> : <i className="bi bi-filetype-csv" />} CSV
                </button>
                <button className="btn btn--secondary btn--sm" onClick={() => handleGenerate(r.type, 'json')} disabled={generating === `${r.type}-json`}>
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