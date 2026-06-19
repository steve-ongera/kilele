import { useState, useEffect } from 'react'
import { dividendsAPI, branchesAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function Dividends() {
  const [declarations, setDeclarations] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ branch: '', pool_amount: '', declaration_date: '', period: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [divRes, branchRes] = await Promise.all([
        dividendsAPI.list(),
        branchesAPI.list({ branch_type: 'WEALTH_ALLIANCE' }),
      ])
      setDeclarations(toArray(divRes.data))
      setBranches(toArray(branchRes.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    const now = new Date()
    setForm({
      branch: branches[0]?.id || '',
      pool_amount: '',
      declaration_date: now.toISOString().slice(0, 10),
      period: `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.branch || !form.pool_amount || !form.period) return setError('All fields are required.')
    setSaving(true)
    try {
      await dividendsAPI.create(form)
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to declare dividend.')
    } finally {
      setSaving(false)
    }
  }

  const viewDetail = async (dec) => {
    try {
      const res = await dividendsAPI.get(dec.id)
      setSelected(res.data)
    } catch { }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Dividends</h1>
        <p className="page-header__sub">Declare dividend pools and review per-investor splits</p>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-currency-dollar" /> Declare Dividend
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Branch</th>
                <th>Period</th>
                <th>Pool Amount</th>
                <th>Total Capital</th>
                <th>Status</th>
                <th>Declared</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : declarations.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty"><i className="bi bi-currency-dollar" /><p>No dividend declarations yet.</p></div></td></tr>
              ) : (
                declarations.map(d => (
                  <tr key={d.id}>
                    <td className="font-semi">{d.branch}</td>
                    <td>{d.period}</td>
                    <td className="kes">{fmtKES(d.pool_amount)}</td>
                    <td className="kes text-muted">{fmtKES(d.total_capital)}</td>
                    <td><span className={`badge status--${d.status?.toLowerCase()}`}>{d.status}</span></td>
                    <td className="text-muted text-sm">{d.declaration_date}</td>
                    <td>
                      <button className="btn btn--ghost btn--sm" onClick={() => viewDetail(d)}>
                        <i className="bi bi-eye" /> View Split
                      </button>
                    </td>
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
              <h3 className="modal__title">Declare Dividend</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="alert alert--info">
                  <i className="bi bi-info-circle" />
                  The pool will be split proportionally across all active investors based on their current capital.
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Branch</label>
                  <select className="form-control" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} required>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label form-label--required">Period</label>
                    <input className="form-control" placeholder="e.g. Q1 2026" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label--required">Declaration Date</label>
                    <input type="date" className="form-control" value={form.declaration_date} onChange={e => setForm({ ...form, declaration_date: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Pool Amount</label>
                  <input type="number" className="form-control" value={form.pool_amount} onChange={e => setForm({ ...form, pool_amount: e.target.value })} required />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Declaring…</> : 'Declare Dividend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{selected.period} — Investor Split</h3>
              <button className="modal__close" onClick={() => setSelected(null)}><i className="bi bi-x" /></button>
            </div>
            <div className="modal__body">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Investor</th>
                      <th>Share %</th>
                      <th>Dividend Amount</th>
                      <th>Option</th>
                      <th>Processed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.investor_dividends || []).length === 0 ? (
                      <tr><td colSpan={5}><div className="table-empty"><i className="bi bi-pie-chart" /><p>No splits computed.</p></div></td></tr>
                    ) : (
                      selected.investor_dividends.map(id => (
                        <tr key={id.id}>
                          <td className="font-semi">{id.investor_name}</td>
                          <td>{Number(id.investor_share_pct).toFixed(2)}%</td>
                          <td className="kes font-semi amount--positive">{fmtKES(id.dividend_amount)}</td>
                          <td><span className="badge badge--blue">{id.option}</span></td>
                          <td>
                            <span className={`badge ${id.is_processed ? 'badge--green' : 'badge--gray'}`}>
                              {id.is_processed ? 'Yes' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}