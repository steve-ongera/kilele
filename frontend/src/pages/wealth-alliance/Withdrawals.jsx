import { useState, useEffect } from 'react'
import { investorWithdrawalsAPI, investorsAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const WITHDRAWAL_TYPES = ['DIVIDEND', 'PARTIAL_CAPITAL', 'FULL_EXIT', 'EMERGENCY']
const EMPTY_FORM = { investor: '', withdrawal_type: 'DIVIDEND', amount_requested: '', notes: '' }

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchInvestors() }, [])
  useEffect(() => { fetchWithdrawals() }, [statusFilter])

  const fetchInvestors = async () => {
    try {
      const res = await investorsAPI.list({ status: 'ACTIVE' })
      setInvestors(toArray(res.data))
    } catch { }
  }

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const res = await investorWithdrawalsAPI.list({ status: statusFilter })
      setWithdrawals(toArray(res.data))
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
    if (!form.investor || !form.amount_requested) return setError('Investor and amount are required.')
    setSaving(true)
    try {
      await investorWithdrawalsAPI.create(form)
      setModalOpen(false)
      fetchWithdrawals()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit withdrawal request.')
    } finally {
      setSaving(false)
    }
  }

  const STATUS_OPTIONS = ['DRAFT','PENDING','UNDER_REVIEW','APPROVED','REJECTED','PROCESSING','PAID','CLOSED']

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Withdrawals</h1>
        <p className="page-header__sub">Investor withdrawal requests and processing</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-arrow-up-circle" /> New Request
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Investor</th>
                <th>Type</th>
                <th>Requested</th>
                <th>Paid</th>
                <th>Charges</th>
                <th>Exit Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : withdrawals.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty"><i className="bi bi-arrow-up-circle" /><p>No withdrawal requests found.</p></div></td></tr>
              ) : (
                withdrawals.map(w => (
                  <tr key={w.id}>
                    <td className="font-semi">{w.investor_name}</td>
                    <td><span className="badge badge--gray">{w.withdrawal_type?.replace(/_/g, ' ')}</span></td>
                    <td className="kes">{fmtKES(w.amount_requested)}</td>
                    <td className="kes text-muted">{fmtKES(w.amount_paid)}</td>
                    <td className="kes text-muted">{fmtKES(w.charges)}</td>
                    <td className="kes text-muted">{fmtKES(w.exit_fee)}</td>
                    <td><span className={`badge status--${w.status?.toLowerCase()}`}>{w.status?.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">New Withdrawal Request</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="form-group">
                  <label className="form-label form-label--required">Investor</label>
                  <select className="form-control" value={form.investor} onChange={e => setForm({ ...form, investor: e.target.value })} required>
                    <option value="">Select investor</option>
                    {investors.map(i => (
                      <option key={i.id} value={i.id}>{i.investor_number} — {i.full_name} (Capital: {fmtKES(i.current_capital)})</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Withdrawal Type</label>
                    <select className="form-control" value={form.withdrawal_type} onChange={e => setForm({ ...form, withdrawal_type: e.target.value })}>
                      {WITHDRAWAL_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label--required">Amount Requested</label>
                    <input type="number" className="form-control" value={form.amount_requested} onChange={e => setForm({ ...form, amount_requested: e.target.value })} required />
                  </div>
                </div>
                {form.withdrawal_type === 'FULL_EXIT' && (
                  <div className="alert alert--warning">
                    <i className="bi bi-exclamation-triangle" />
                    Full exit requests are subject to the standard exit notice period and exit fee.
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Submitting…</> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}