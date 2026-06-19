import { useState, useEffect } from 'react'
import { investmentsAPI, investorsAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const TX_TYPES = ['DEPOSIT', 'REINVESTMENT', 'DIVIDEND_CREDIT', 'WITHDRAWAL', 'ADJUSTMENT']
const EMPTY_FORM = { investor: '', transaction_type: 'DEPOSIT', amount: '', transaction_date: '', notes: '' }

export default function Investments() {
  const [transactions, setTransactions] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchInvestors() }, [])
  useEffect(() => { fetchTransactions() }, [typeFilter])

  const fetchInvestors = async () => {
    try {
      const res = await investorsAPI.list({ status: 'ACTIVE' })
      setInvestors(toArray(res.data))
    } catch { }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await investmentsAPI.list()
      let data = toArray(res.data)
      if (typeFilter) data = data.filter(t => t.transaction_type === typeFilter)
      setTransactions(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, transaction_date: new Date().toISOString().slice(0, 10) })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.investor || !form.amount || !form.transaction_date) return setError('All required fields must be filled.')
    setSaving(true)
    try {
      await investmentsAPI.create(form)
      setModalOpen(false)
      fetchTransactions()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record transaction.')
    } finally {
      setSaving(false)
    }
  }

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
        <h1 className="page-header__title">Investments</h1>
        <p className="page-header__sub">Capital transaction history across asset classes</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 180 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {TX_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-plus-lg" /> New Transaction
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
                <th>Asset Class</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty"><i className="bi bi-graph-up-arrow" /><p>No transactions found.</p></div></td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td className="font-semi">{t.investor_name}</td>
                    <td><span className={`badge ${TYPE_BADGE[t.transaction_type] || 'badge--gray'}`}>{t.transaction_type?.replace(/_/g, ' ')}</span></td>
                    <td className="text-muted">{t.asset_class_name || '—'}</td>
                    <td className={`kes ${t.transaction_type === 'WITHDRAWAL' ? 'amount--negative' : 'amount--positive'}`}>
                      {t.transaction_type === 'WITHDRAWAL' ? '-' : '+'}{fmtKES(t.amount)}
                    </td>
                    <td className="text-muted text-sm">{t.transaction_date}</td>
                    <td><span className={`badge status--${t.approval_status?.toLowerCase()}`}>{t.approval_status}</span></td>
                    <td className="text-muted text-sm">{t.reference || '—'}</td>
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
              <h3 className="modal__title">New Investment Transaction</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="form-group">
                  <label className="form-label form-label--required">Investor</label>
                  <select className="form-control" value={form.investor} onChange={e => setForm({ ...form, investor: e.target.value })} required>
                    <option value="">Select investor</option>
                    {investors.map(i => <option key={i.id} value={i.id}>{i.investor_number} — {i.full_name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Transaction Type</label>
                    <select className="form-control" value={form.transaction_type} onChange={e => setForm({ ...form, transaction_type: e.target.value })}>
                      {TX_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label--required">Amount</label>
                    <input type="number" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Transaction Date</label>
                  <input type="date" className="form-control" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Saving…</> : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}