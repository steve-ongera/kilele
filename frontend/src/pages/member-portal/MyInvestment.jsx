import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { investmentsAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function MyInvestment() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTransactions() }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await investmentsAPI.list({ investor: user?.investor_id })
      setTransactions(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const deposits = transactions.filter(t => t.transaction_type === 'DEPOSIT').reduce((s, t) => s + Number(t.amount), 0)
  const dividends = transactions.filter(t => t.transaction_type === 'DIVIDEND_CREDIT').reduce((s, t) => s + Number(t.amount), 0)
  const withdrawals = transactions.filter(t => t.transaction_type === 'WITHDRAWAL').reduce((s, t) => s + Number(t.amount), 0)
  const currentCapital = deposits + dividends - withdrawals
  const roi = deposits > 0 ? ((dividends / deposits) * 100).toFixed(1) : 0

  const TYPE_BADGE = {
    DEPOSIT: 'badge--green',
    REINVESTMENT: 'badge--blue',
    DIVIDEND_CREDIT: 'badge--blue',
    WITHDRAWAL: 'badge--red',
    ADJUSTMENT: 'badge--gray',
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">My Investment</h1>
        <p className="page-header__sub">Your Wealth Alliance portfolio overview</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__icon"><i className="bi bi-graph-up-arrow" /></div>
          <p className="kpi-card__label">Current Capital</p>
          <p className="kpi-card__value">{fmtKES(currentCapital)}</p>
        </div>
        <div className="kpi-card kpi-card--green">
          <div className="kpi-card__icon"><i className="bi bi-currency-dollar" /></div>
          <p className="kpi-card__label">Total Dividends</p>
          <p className="kpi-card__value">{fmtKES(dividends)}</p>
        </div>
        <div className="kpi-card kpi-card--orange">
          <div className="kpi-card__icon"><i className="bi bi-percent" /></div>
          <p className="kpi-card__label">Return on Investment</p>
          <p className="kpi-card__value">{roi}%</p>
        </div>
      </div>

      <div className="card">
        <div className="card__header"><h3 className="card__title">Transaction History</h3></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Type</th><th>Asset Class</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5}><div className="table-empty"><i className="bi bi-graph-up-arrow" /><p>No transactions yet.</p></div></td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td><span className={`badge ${TYPE_BADGE[t.transaction_type] || 'badge--gray'}`}>{t.transaction_type?.replace(/_/g, ' ')}</span></td>
                    <td className="text-muted">{t.asset_class_name || '—'}</td>
                    <td className={`kes ${t.transaction_type === 'WITHDRAWAL' ? 'amount--negative' : 'amount--positive'}`}>
                      {t.transaction_type === 'WITHDRAWAL' ? '-' : '+'}{fmtKES(t.amount)}
                    </td>
                    <td className="text-muted text-sm">{t.transaction_date}</td>
                    <td><span className={`badge status--${t.approval_status?.toLowerCase()}`}>{t.approval_status}</span></td>
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