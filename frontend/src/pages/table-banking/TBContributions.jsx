import { useState, useEffect } from 'react'
import { tableBankingAPI, membersAPI, contributionsAPI, toArray } from '../../services/api'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function TBContributions() {
  const [contributions, setContributions] = useState([])
  const [lendingFund, setLendingFund] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ member: '', expected: 1000, paid: 0, due_date: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchSupport() }, [])
  useEffect(() => { fetchContributions() }, [year, month])

  const fetchSupport = async () => {
    try {
      const [memberRes, fundRes] = await Promise.all([
        tableBankingAPI.members(),
        tableBankingAPI.lendingFund(),
      ])
      setMembers(toArray(memberRes.data))
      setLendingFund(toArray(fundRes.data))
    } catch { }
  }

  const fetchContributions = async () => {
    setLoading(true)
    try {
      const res = await tableBankingAPI.contributions({ year, month })
      setContributions(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ member: '', expected: 1000, paid: 0, due_date: `${year}-${String(month).padStart(2, '0')}-15` })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.member || !form.due_date) return setError('Member and due date are required.')
    setSaving(true)
    try {
      await contributionsAPI.create({ ...form, period_year: year, period_month: month })
      setModalOpen(false)
      fetchContributions()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record contribution.')
    } finally {
      setSaving(false)
    }
  }

  const totalFund = lendingFund.reduce((sum, f) => sum + Number(f.available_fund || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Table Banking Contributions</h1>
        <p className="page-header__sub">Track contributions and lending fund availability</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 120 }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-control" style={{ maxWidth: 160 }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-plus-lg" /> Record Contribution
          </button>
        </div>
      </div>

      {/* Lending Fund Strip */}
      <div className="card mb-24">
        <div className="card__header">
          <h3 className="card__title">Lending Fund — All Branches</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Branch</th>
                <th>Contributions</th>
                <th>Interest</th>
                <th>Outstanding Loans</th>
                <th>Withdrawals</th>
                <th>Available Fund</th>
              </tr>
            </thead>
            <tbody>
              {lendingFund.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty"><i className="bi bi-piggy-bank" /><p>No data available.</p></div></td></tr>
              ) : (
                lendingFund.map(f => (
                  <tr key={f.branch_id}>
                    <td className="font-semi">{f.branch_name}</td>
                    <td className="kes">{fmtKES(f.total_contributions)}</td>
                    <td className="kes text-muted">{fmtKES(f.total_interest)}</td>
                    <td className="kes amount--negative">{fmtKES(f.outstanding_loans)}</td>
                    <td className="kes text-muted">{fmtKES(f.total_withdrawals)}</td>
                    <td className="kes font-semi amount--positive">{fmtKES(f.available_fund)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {lendingFund.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--gray-50)' }}>
                  <td className="font-bold">Total</td>
                  <td></td><td></td><td></td><td></td>
                  <td className="kes font-bold amount--positive">{fmtKES(totalFund)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Period</th>
                <th>Expected</th>
                <th>Paid</th>
                <th>Arrears</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : contributions.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty"><i className="bi bi-wallet2" /><p>No contributions for this period.</p></div></td></tr>
              ) : (
                contributions.map(c => (
                  <tr key={c.id}>
                    <td className="font-semi">{c.member_name}</td>
                    <td>{MONTHS[c.period_month - 1]} {c.period_year}</td>
                    <td className="kes">{fmtKES(c.expected)}</td>
                    <td className="kes amount--positive">{fmtKES(c.paid)}</td>
                    <td className={`kes ${c.arrears > 0 ? 'amount--negative' : ''}`}>{fmtKES(c.arrears)}</td>
                    <td><span className={`badge status--${c.status?.toLowerCase()}`}>{c.status}</span></td>
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
              <h3 className="modal__title">Record Contribution</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="form-group">
                  <label className="form-label form-label--required">Member</label>
                  <select className="form-control" value={form.member} onChange={e => setForm({ ...form, member: e.target.value })} required>
                    <option value="">Select member</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.member_number} — {m.full_name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label form-label--required">Expected</label>
                    <input type="number" className="form-control" value={form.expected} onChange={e => setForm({ ...form, expected: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Paid</label>
                    <input type="number" className="form-control" value={form.paid} onChange={e => setForm({ ...form, paid: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Due Date</label>
                  <input type="date" className="form-control" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required />
                </div>
                <p className="form-hint">Table Banking deadline is the 15th of each month.</p>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Saving…</> : 'Record Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}