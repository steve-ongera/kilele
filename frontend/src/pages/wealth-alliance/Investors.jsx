import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { investorsAPI, branchesAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const EMPTY_FORM = { branch: '', full_name: '', phone: '', email: '', id_number: '', join_date: '' }

export default function Investors() {
  const [investors, setInvestors] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchBranches() }, [])
  useEffect(() => { fetchInvestors() }, [search])

  const fetchBranches = async () => {
    try {
      const res = await branchesAPI.list({ branch_type: 'WEALTH_ALLIANCE' })
      setBranches(toArray(res.data))
    } catch { }
  }

  const fetchInvestors = async () => {
    setLoading(true)
    try {
      const res = await investorsAPI.list({ search })
      setInvestors(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, branch: branches[0]?.id || '', join_date: new Date().toISOString().slice(0, 10) })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.full_name.trim() || !form.phone.trim() || !form.branch) {
      return setError('Branch, full name and phone are required.')
    }
    setSaving(true)
    try {
      await investorsAPI.create(form)
      setModalOpen(false)
      fetchInvestors()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create investor.')
    } finally {
      setSaving(false)
    }
  }

  const totalCapital = investors.reduce((sum, i) => sum + Number(i.current_capital || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Investors</h1>
        <p className="page-header__sub">Wealth Alliance investor accounts</p>
        <div className="page-header__actions">
          <div className="search-input-wrap" style={{ maxWidth: 240 }}>
            <i className="bi bi-search" />
            <input className="form-control" placeholder="Search name, number, phone…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-person-badge" /> New Investor
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__icon"><i className="bi bi-person-badge" /></div>
          <p className="kpi-card__label">Active Investors</p>
          <p className="kpi-card__value">{investors.length}</p>
        </div>
        <div className="kpi-card kpi-card--green">
          <div className="kpi-card__icon"><i className="bi bi-graph-up-arrow" /></div>
          <p className="kpi-card__label">Total Capital</p>
          <p className="kpi-card__value">{fmtKES(totalCapital)}</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Investor #</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Branch</th>
                <th>Current Capital</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : investors.length === 0 ? (
                <tr><td colSpan={8}><div className="table-empty"><i className="bi bi-person-badge" /><p>No investors found.</p></div></td></tr>
              ) : (
                investors.map(inv => (
                  <tr key={inv.id}>
                    <td className="font-semi">{inv.investor_number}</td>
                    <td>{inv.full_name}</td>
                    <td className="text-muted">{inv.phone}</td>
                    <td>{inv.branch_name}</td>
                    <td className="kes font-semi">{fmtKES(inv.current_capital)}</td>
                    <td><span className={`badge status--${inv.status?.toLowerCase()}`}>{inv.status}</span></td>
                    <td className="text-muted text-sm">{inv.join_date}</td>
                    <td>
                      <Link to={`/my-statement?investor=${inv.id}`} className="btn btn--ghost btn--sm">
                        <i className="bi bi-file-text" /> Statement
                      </Link>
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
              <h3 className="modal__title">New Investor</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="form-group">
                  <label className="form-label form-label--required">Branch</label>
                  <select className="form-control" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} required>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Full Name</label>
                  <input className="form-control" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label form-label--required">Phone</label>
                    <input className="form-control" placeholder="07XXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ID Number</label>
                    <input className="form-control" value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label--required">Join Date</label>
                    <input type="date" className="form-control" value={form.join_date} onChange={e => setForm({ ...form, join_date: e.target.value })} required />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Creating…</> : 'Create Investor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}