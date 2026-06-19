import { useState, useEffect } from 'react'
import { loansAPI, membersAPI, toArray } from '../../services/api'
import { useAuth } from '../../App'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const STATUS_OPTIONS = ['DRAFT','PENDING','APPROVED','DISBURSED','PERFORMING','WATCHLIST','OVERDUE','DEFAULTED','CLOSED','WRITTEN_OFF']
const EMPTY_FORM = { member: '', product: '', principal: '', notes: '' }

export default function Loans() {
  const { user } = useAuth()
  const canApprove = ['SUPER_ADMIN', 'BRANCH_ADMIN'].includes(user?.role)

  const [loans, setLoans] = useState([])
  const [members, setMembers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [disburseModal, setDisburseModal] = useState(null)
  const [disburseDate, setDisburseDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => { fetchSupport() }, [])
  useEffect(() => { fetchLoans() }, [statusFilter])

  const fetchSupport = async () => {
    try {
      const [memberRes, productRes] = await Promise.all([
        membersAPI.list({ status: 'ACTIVE' }),
        loansAPI.products.list(),
      ])
      setMembers(toArray(memberRes.data))
      setProducts(toArray(productRes.data))
    } catch { }
  }

  const fetchLoans = async () => {
    setLoading(true)
    try {
      const res = await loansAPI.list({ status: statusFilter })
      setLoans(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.member || !form.product || !form.principal) return setError('All fields are required.')
    setSaving(true)
    try {
      await loansAPI.create(form)
      setModalOpen(false)
      fetchLoans()
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to create loan.')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (loan) => {
    try {
      await loansAPI.approve(loan.id)
      fetchLoans()
    } catch { }
  }

  const handleDisburse = async () => {
    try {
      await loansAPI.disburse(disburseModal.id, { disbursement_date: disburseDate })
      setDisburseModal(null)
      fetchLoans()
    } catch { }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Loans</h1>
        <p className="page-header__sub">Loan applications, approvals & repayments</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-file-earmark-plus" /> New Loan
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Member</th>
                <th>Product</th>
                <th>Principal</th>
                <th>Balance</th>
                <th>Installment</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="table-empty">
                    <i className="bi bi-cash-stack" />
                    <p>No loans found.</p>
                  </div>
                </td></tr>
              ) : (
                loans.map(loan => (
                  <tr key={loan.id}>
                    <td className="font-semi">{loan.loan_number}</td>
                    <td>
                      <span>{loan.member_name}</span>
                      <p className="text-muted text-xs">{loan.member_number}</p>
                    </td>
                    <td>{loan.product_name}</td>
                    <td className="kes">{fmtKES(loan.principal)}</td>
                    <td className="kes font-semi">{fmtKES(loan.balance)}</td>
                    <td className="kes text-muted">{fmtKES(loan.monthly_installment)}</td>
                    <td><span className={`badge status--${loan.status?.toLowerCase()}`}>{loan.status}</span></td>
                    <td>
                      <div className="d-flex gap-8">
                        {canApprove && loan.approval_status === 'PENDING' && (
                          <button className="btn btn--success btn--sm" onClick={() => handleApprove(loan)}>
                            <i className="bi bi-check" /> Approve
                          </button>
                        )}
                        {canApprove && loan.status === 'APPROVED' && (
                          <button className="btn btn--primary btn--sm" onClick={() => setDisburseModal(loan)}>
                            <i className="bi bi-send" /> Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Loan Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">New Loan Application</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="form-group">
                  <label className="form-label form-label--required">Member</label>
                  <select className="form-control" value={form.member} onChange={e => setForm({ ...form, member: e.target.value })} required>
                    <option value="">Select member</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.member_number} — {m.full_name} (Limit: {fmtKES(m.loan_limit)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Loan Product</label>
                  <select className="form-control" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} required>
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.duration_months}m @ {p.interest_rate}%)</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Principal Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.principal}
                    onChange={e => setForm({ ...form, principal: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Submitting…</> : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {disburseModal && (
        <div className="modal-backdrop" onClick={() => setDisburseModal(null)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Disburse Loan</h3>
              <button className="modal__close" onClick={() => setDisburseModal(null)}><i className="bi bi-x" /></button>
            </div>
            <div className="modal__body">
              <p className="mb-16">
                Disbursing <strong>{disburseModal.loan_number}</strong> — {fmtKES(disburseModal.principal)} to <strong>{disburseModal.member_name}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label form-label--required">Disbursement Date</label>
                <input type="date" className="form-control" value={disburseDate} onChange={e => setDisburseDate(e.target.value)} />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDisburseModal(null)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleDisburse}>
                <i className="bi bi-send" /> Confirm Disbursement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}