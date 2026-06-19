import { useState, useEffect } from 'react'
import { contributionsAPI, membersAPI, toArray } from '../../services/api'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

const EMPTY_FORM = { member: '', period_year: new Date().getFullYear(), period_month: new Date().getMonth() + 1, expected: 2000, paid: 0, due_date: '' }

export default function Contributions() {
  const [contributions, setContributions] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchMembers() }, [])
  useEffect(() => { fetchContributions() }, [year, month])

  const fetchMembers = async () => {
    try {
      const res = await membersAPI.list({ status: 'ACTIVE' })
      setMembers(toArray(res.data))
    } catch { }
  }

  const fetchContributions = async () => {
    setLoading(true)
    try {
      const res = await contributionsAPI.list({ year, month })
      setContributions(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, period_year: year, due_date: `${year}-${String(month || new Date().getMonth() + 1).padStart(2, '0')}-10` })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.member || !form.due_date) return setError('Member and due date are required.')
    setSaving(true)
    try {
      await contributionsAPI.create(form)
      setModalOpen(false)
      fetchContributions()
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to record contribution.')
    } finally {
      setSaving(false)
    }
  }

  const totals = contributions.reduce((acc, c) => ({
    expected: acc.expected + Number(c.expected || 0),
    paid: acc.paid + Number(c.paid || 0),
    arrears: acc.arrears + Number(c.arrears || 0),
  }), { expected: 0, paid: 0, arrears: 0 })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Contributions</h1>
        <p className="page-header__sub">Monthly share contributions, arrears & interest tracking</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 120 }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-control" style={{ maxWidth: 160 }} value={month} onChange={e => setMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-plus-lg" /> Record Contribution
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__icon"><i className="bi bi-wallet2" /></div>
          <p className="kpi-card__label">Expected</p>
          <p className="kpi-card__value">{fmtKES(totals.expected)}</p>
        </div>
        <div className="kpi-card kpi-card--green">
          <div className="kpi-card__icon"><i className="bi bi-check-circle" /></div>
          <p className="kpi-card__label">Collected</p>
          <p className="kpi-card__value">{fmtKES(totals.paid)}</p>
        </div>
        <div className="kpi-card kpi-card--red">
          <div className="kpi-card__icon"><i className="bi bi-exclamation-triangle" /></div>
          <p className="kpi-card__label">Arrears</p>
          <p className="kpi-card__value">{fmtKES(totals.arrears)}</p>
        </div>
      </div>

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
                <th>Interest</th>
                <th>Penalty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : contributions.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="table-empty">
                    <i className="bi bi-wallet2" />
                    <p>No contributions for this period.</p>
                  </div>
                </td></tr>
              ) : (
                contributions.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-semi">{c.member_name}</span>
                      <p className="text-muted text-xs">{c.member_number}</p>
                    </td>
                    <td>{MONTHS[c.period_month - 1]} {c.period_year}</td>
                    <td className="kes">{fmtKES(c.expected)}</td>
                    <td className="kes amount--positive">{fmtKES(c.paid)}</td>
                    <td className={`kes ${c.arrears > 0 ? 'amount--negative' : ''}`}>{fmtKES(c.arrears)}</td>
                    <td className="kes text-muted">{fmtKES(c.interest)}</td>
                    <td className="kes text-muted">{fmtKES(c.penalty)}</td>
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
                    <label className="form-label">Year</label>
                    <input type="number" className="form-control" value={form.period_year} onChange={e => setForm({ ...form, period_year: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Month</label>
                    <select className="form-control" value={form.period_month} onChange={e => setForm({ ...form, period_month: Number(e.target.value) })}>
                      {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label form-label--required">Expected Amount</label>
                    <input type="number" className="form-control" value={form.expected} onChange={e => setForm({ ...form, expected: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount Paid</label>
                    <input type="number" className="form-control" value={form.paid} onChange={e => setForm({ ...form, paid: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Due Date</label>
                  <input type="date" className="form-control" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required />
                </div>
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