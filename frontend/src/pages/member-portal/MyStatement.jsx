import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { membersAPI } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function MyStatement() {
  const { user } = useAuth()
  const [statement, setStatement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('contributions')

  useEffect(() => {
    if (user?.role === 'MEMBER' && user?.member_id) {
      fetchStatement(user.member_id)
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchStatement = async (memberId) => {
    setLoading(true)
    try {
      const res = await membersAPI.statement(memberId)
      setStatement(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading-state"><span className="spinner spinner--lg" /><p>Loading statement…</p></div>

  if (!statement) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state__icon"><i className="bi bi-file-text" /></div>
          <h3 className="empty-state__title">No statement available</h3>
          <p className="empty-state__desc">Your account statement will appear here once available.</p>
        </div>
      </div>
    )
  }

  const { summary, contributions = [], loans = [], payments = [], penalties = [] } = statement

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">My Statement</h1>
        <p className="page-header__sub">{statement.member?.full_name} · {statement.member?.member_number}</p>
        <div className="page-header__actions">
          <button className="btn btn--secondary" onClick={() => window.print()}>
            <i className="bi bi-printer" /> Print
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__icon"><i className="bi bi-wallet2" /></div>
          <p className="kpi-card__label">Total Contributions</p>
          <p className="kpi-card__value">{fmtKES(summary?.total_contributions)}</p>
        </div>
        <div className="kpi-card kpi-card--green">
          <div className="kpi-card__icon"><i className="bi bi-cash-stack" /></div>
          <p className="kpi-card__label">Loan Limit</p>
          <p className="kpi-card__value">{fmtKES(summary?.loan_limit)}</p>
        </div>
        <div className="kpi-card kpi-card--orange">
          <div className="kpi-card__icon"><i className="bi bi-wallet" /></div>
          <p className="kpi-card__label">Advance Credit</p>
          <p className="kpi-card__value">{fmtKES(summary?.advance_credit)}</p>
        </div>
        <div className="kpi-card kpi-card--red">
          <div className="kpi-card__icon"><i className="bi bi-exclamation-triangle" /></div>
          <p className="kpi-card__label">Total Arrears</p>
          <p className="kpi-card__value">{fmtKES(summary?.total_arrears)}</p>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div className="tabs">
            <button className={`tab ${tab === 'contributions' ? 'tab--active' : ''}`} onClick={() => setTab('contributions')}>Contributions</button>
            <button className={`tab ${tab === 'loans' ? 'tab--active' : ''}`} onClick={() => setTab('loans')}>Loans</button>
            <button className={`tab ${tab === 'payments' ? 'tab--active' : ''}`} onClick={() => setTab('payments')}>Payments</button>
            <button className={`tab ${tab === 'penalties' ? 'tab--active' : ''}`} onClick={() => setTab('penalties')}>Penalties</button>
          </div>
        </div>
        <div className="table-wrap">
          {tab === 'contributions' && (
            <table>
              <thead><tr><th>Period</th><th>Expected</th><th>Paid</th><th>Arrears</th><th>Status</th></tr></thead>
              <tbody>
                {contributions.length === 0 ? (
                  <tr><td colSpan={5}><div className="table-empty"><i className="bi bi-wallet2" /><p>No contributions yet.</p></div></td></tr>
                ) : contributions.map(c => (
                  <tr key={c.id}>
                    <td>{c.period_year}-{String(c.period_month).padStart(2, '0')}</td>
                    <td className="kes">{fmtKES(c.expected)}</td>
                    <td className="kes amount--positive">{fmtKES(c.paid)}</td>
                    <td className={`kes ${c.arrears > 0 ? 'amount--negative' : ''}`}>{fmtKES(c.arrears)}</td>
                    <td><span className={`badge status--${c.status?.toLowerCase()}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'loans' && (
            <table>
              <thead><tr><th>Loan #</th><th>Principal</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr><td colSpan={4}><div className="table-empty"><i className="bi bi-cash-stack" /><p>No loans yet.</p></div></td></tr>
                ) : loans.map(l => (
                  <tr key={l.id}>
                    <td className="font-semi">{l.loan_number}</td>
                    <td className="kes">{fmtKES(l.principal)}</td>
                    <td className="kes font-semi">{fmtKES(l.balance)}</td>
                    <td><span className={`badge status--${l.status?.toLowerCase()}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'payments' && (
            <table>
              <thead><tr><th>M-Pesa Ref</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={3}><div className="table-empty"><i className="bi bi-credit-card" /><p>No payments yet.</p></div></td></tr>
                ) : payments.map(p => (
                  <tr key={p.id}>
                    <td className="font-semi">{p.mpesa_ref || '—'}</td>
                    <td className="kes amount--positive">{fmtKES(p.amount)}</td>
                    <td className="text-muted text-sm">{new Date(p.payment_date).toLocaleDateString('en-KE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'penalties' && (
            <table>
              <thead><tr><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {penalties.length === 0 ? (
                  <tr><td colSpan={3}><div className="table-empty"><i className="bi bi-shield-check" /><p>No penalties on record.</p></div></td></tr>
                ) : penalties.map(p => (
                  <tr key={p.id}>
                    <td>{p.penalty_type?.replace(/_/g, ' ')}</td>
                    <td className="kes amount--negative">{fmtKES(p.amount)}</td>
                    <td><span className={`badge ${p.is_waived ? 'badge--gray' : 'badge--red'}`}>{p.is_waived ? 'Waived' : 'Active'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}