import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { contributionsAPI, toArray } from '../../services/api'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function MyContributions() {
  const { user } = useAuth()
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => { fetchContributions() }, [year])

  const fetchContributions = async () => {
    setLoading(true)
    try {
      const res = await contributionsAPI.list({ member: user?.member_id, year })
      setContributions(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const totalPaid = contributions.reduce((sum, c) => sum + Number(c.paid || 0), 0)
  const totalArrears = contributions.reduce((sum, c) => sum + Number(c.arrears || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">My Contributions</h1>
        <p className="page-header__sub">Your monthly savings contribution history</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 120 }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--green">
          <div className="kpi-card__icon"><i className="bi bi-check-circle" /></div>
          <p className="kpi-card__label">Total Paid ({year})</p>
          <p className="kpi-card__value">{fmtKES(totalPaid)}</p>
        </div>
        <div className="kpi-card kpi-card--red">
          <div className="kpi-card__icon"><i className="bi bi-exclamation-triangle" /></div>
          <p className="kpi-card__label">Outstanding Arrears</p>
          <p className="kpi-card__value">{fmtKES(totalArrears)}</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Month</th><th>Expected</th><th>Paid</th><th>Arrears</th><th>Due Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : contributions.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty"><i className="bi bi-wallet2" /><p>No contributions recorded for {year}.</p></div></td></tr>
              ) : (
                contributions
                  .sort((a, b) => a.period_month - b.period_month)
                  .map(c => (
                    <tr key={c.id}>
                      <td className="font-semi">{MONTHS[c.period_month - 1]}</td>
                      <td className="kes">{fmtKES(c.expected)}</td>
                      <td className="kes amount--positive">{fmtKES(c.paid)}</td>
                      <td className={`kes ${c.arrears > 0 ? 'amount--negative' : ''}`}>{fmtKES(c.arrears)}</td>
                      <td className="text-muted text-sm">{c.due_date}</td>
                      <td><span className={`badge status--${c.status?.toLowerCase()}`}>{c.status}</span></td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}