import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { loansAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function MyLoans() {
  const { user } = useAuth()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchLoans() }, [])

  const fetchLoans = async () => {
    setLoading(true)
    try {
      const res = await loansAPI.list({ member: user?.member_id })
      const data = toArray(res.data)
      setLoans(data)
      if (data.length > 0) setSelected(data[0])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading-state"><span className="spinner spinner--lg" /><p>Loading your loans…</p></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">My Loans</h1>
        <p className="page-header__sub">Track your loan status and repayment progress</p>
      </div>

      {loans.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon"><i className="bi bi-cash-stack" /></div>
            <h3 className="empty-state__title">No loans yet</h3>
            <p className="empty-state__desc">You haven't taken out any loans. Visit your dashboard to request one.</p>
          </div>
        </div>
      ) : (
        <div className="my-loans-layout">
          <div className="card">
            <div className="card__header"><h3 className="card__title">Loan History</h3></div>
            <div className="loan-list">
              {loans.map(l => (
                <div key={l.id} className={`loan-list-item ${selected?.id === l.id ? 'loan-list-item--active' : ''}`} onClick={() => setSelected(l)}>
                  <div>
                    <p className="font-semi">{l.loan_number}</p>
                    <p className="text-muted text-xs">{l.product_name}</p>
                  </div>
                  <span className={`badge status--${l.status?.toLowerCase()}`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div className="card">
              <div className="card__header"><h3 className="card__title">{selected.loan_number}</h3></div>
              <div className="card__body">
                <div className="kpi-grid mb-24" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div>
                    <p className="text-xs text-muted">Principal</p>
                    <p className="font-semi kes">{fmtKES(selected.principal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Balance</p>
                    <p className="font-bold kes text-lg">{fmtKES(selected.balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Monthly Installment</p>
                    <p className="font-semi kes">{fmtKES(selected.monthly_installment)}</p>
                  </div>
                </div>

                <div className="loan-progress mb-24">
                  <div className="d-flex justify-between mb-4">
                    <span className="text-xs text-muted">Repayment Progress</span>
                    <span className="text-xs font-semi">
                      {(((selected.total_repayment - selected.balance) / selected.total_repayment) * 100 || 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="occupancy-bar">
                    <div
                      className="occupancy-bar__fill"
                      style={{ width: `${((selected.total_repayment - selected.balance) / selected.total_repayment) * 100 || 0}%`, background: 'var(--primary)' }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted mb-8">Repayment History</p>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Date</th><th>Principal</th><th>Interest</th><th>Balance After</th></tr></thead>
                    <tbody>
                      {(selected.repayments || []).length === 0 ? (
                        <tr><td colSpan={4}><div className="table-empty"><i className="bi bi-receipt" /><p>No repayments recorded yet.</p></div></td></tr>
                      ) : selected.repayments.map(r => (
                        <tr key={r.id}>
                          <td className="text-muted text-sm">{r.repayment_date}</td>
                          <td className="kes">{fmtKES(r.principal_paid)}</td>
                          <td className="kes text-muted">{fmtKES(r.interest_paid)}</td>
                          <td className="kes font-semi">{fmtKES(r.balance_after)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}