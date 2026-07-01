import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { membersAPI } from '../../services/api'

const fmt = (n) => Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })
const fmtKES = (n) => `KES ${fmt(n)}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function MemberStatement() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchStatement() }, [id])

  const fetchStatement = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await membersAPI.statement(id)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load member statement.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner spinner--lg" />
        <p>Loading member statement…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon"><i className="bi bi-exclamation-triangle" /></div>
        <h3 className="empty-state__title">Unable to load statement</h3>
        <p className="empty-state__desc">{error || 'Member not found.'}</p>
        <Link to="/tujijenge/members" className="btn btn--primary mt-16">
          <i className="bi bi-arrow-left" /> Back to Members
        </Link>
      </div>
    )
  }

  const { member, contributions, loans, payments, penalties, summary } = data

  return (
    <div>
      <div className="page-header">
        <Link to="/tujijenge/members" className="text-muted text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <i className="bi bi-arrow-left" /> Back to Members
        </Link>
        <h1 className="page-header__title">{member.full_name}</h1>
        <p className="page-header__sub">
          {member.member_number} · {member.branch_name} · <span className={`badge status--${member.status?.toLowerCase()}`}>{member.status}</span>
        </p>
        <div className="page-header__actions">
          <button className="btn btn--secondary" onClick={() => window.print()}>
            <i className="bi bi-printer" /> Print
          </button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="kpi-grid">
        <KPICard label="Total Contributions" value={fmtKES(summary.total_contributions)} icon="bi-wallet2" color="green" />
        <KPICard label="Loan Limit" value={fmtKES(summary.loan_limit)} icon="bi-cash-stack" color="blue" />
        <KPICard label="Advance Credit" value={fmtKES(summary.advance_credit)} icon="bi-piggy-bank" color="orange" />
        <KPICard label="Total Arrears" value={fmtKES(summary.total_arrears)} icon="bi-exclamation-triangle" color={Number(summary.total_arrears) > 0 ? 'red' : 'blue'} />
      </div>

      {/* Member details */}
      <div className="card mb-24">
        <div className="card__header"><h3 className="card__title">Member Details</h3></div>
        <div className="card__body">
          <div className="detail-grid">
            <DetailItem label="Phone" value={member.phone} />
            <DetailItem label="Email" value={member.user_email || member.email || '—'} />
            <DetailItem label="ID Number" value={member.id_number || '—'} />
            <DetailItem label="Shares" value={member.shares} />
            <DetailItem label="Date Joined" value={fmtDate(member.date_joined)} />
            <DetailItem label="Active Loans" value={summary.active_loans} />
          </div>
        </div>
      </div>

      {/* Contributions */}
      <div className="card mb-24">
        <div className="card__header"><h3 className="card__title">Contributions ({contributions.length})</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Period</th><th>Expected</th><th>Paid</th><th>Arrears</th><th>Status</th><th>Due Date</th></tr>
            </thead>
            <tbody>
              {contributions.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty"><p>No contribution records.</p></div></td></tr>
              ) : contributions.map(c => (
                <tr key={c.id}>
                  <td>{c.period_month}/{c.period_year}</td>
                  <td>{fmtKES(c.expected)}</td>
                  <td>{fmtKES(c.paid)}</td>
                  <td className={Number(c.arrears) > 0 ? 'text-danger' : ''}>{fmtKES(c.arrears)}</td>
                  <td><span className="badge">{c.status}</span></td>
                  <td className="text-muted text-sm">{fmtDate(c.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loans */}
      <div className="card mb-24">
        <div className="card__header"><h3 className="card__title">Loans ({loans.length})</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Loan #</th><th>Principal</th><th>Balance</th><th>Monthly Installment</th><th>Status</th><th>Disbursed</th></tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty"><p>No loan records.</p></div></td></tr>
              ) : loans.map(l => (
                <tr key={l.id}>
                  <td className="font-semi">{l.loan_number}</td>
                  <td>{fmtKES(l.principal)}</td>
                  <td>{fmtKES(l.balance)}</td>
                  <td>{fmtKES(l.monthly_installment)}</td>
                  <td><span className="badge">{l.status}</span></td>
                  <td className="text-muted text-sm">{fmtDate(l.disbursement_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments */}
      <div className="card mb-24">
        <div className="card__header"><h3 className="card__title">Payments ({payments.length})</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>M-Pesa Ref</th><th>Amount</th><th>Phone</th><th>Date</th><th>Allocated</th></tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={5}><div className="table-empty"><p>No payment records.</p></div></td></tr>
              ) : payments.map(p => (
                <tr key={p.id}>
                  <td className="font-semi">{p.mpesa_ref || '—'}</td>
                  <td>{fmtKES(p.amount)}</td>
                  <td className="text-muted">{p.phone}</td>
                  <td className="text-muted text-sm">{fmtDate(p.payment_date)}</td>
                  <td>
                    <span className={`badge ${p.is_allocated ? 'badge--green' : 'badge--gray'}`}>
                      {p.is_allocated ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Penalties */}
      <div className="card">
        <div className="card__header"><h3 className="card__title">Penalties ({penalties.length})</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Type</th><th>Amount</th><th>Period</th><th>Waived</th><th>Description</th></tr>
            </thead>
            <tbody>
              {penalties.length === 0 ? (
                <tr><td colSpan={5}><div className="table-empty"><p>No penalty records.</p></div></td></tr>
              ) : penalties.map(p => (
                <tr key={p.id}>
                  <td>{p.penalty_type}</td>
                  <td>{fmtKES(p.amount)}</td>
                  <td className="text-muted text-sm">{p.period_month && p.period_year ? `${p.period_month}/${p.period_year}` : '—'}</td>
                  <td>
                    <span className={`badge ${p.is_waived ? 'badge--green' : 'badge--gray'}`}>
                      {p.is_waived ? 'Waived' : 'Active'}
                    </span>
                  </td>
                  <td className="text-muted">{p.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-item__label">{label}</span>
      <span className="detail-item__value">{value}</span>
    </div>
  )
}