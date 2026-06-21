import { useState, useEffect } from 'react'
import { maintenanceAPI, unitsAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const STATUS_FLOW = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED']
const STATUS_BADGE = { NEW: 'badge--orange', ASSIGNED: 'badge--blue', IN_PROGRESS: 'badge--blue', COMPLETED: 'badge--green', CLOSED: 'badge--gray' }

export default function Maintenance() {
  const [requests, setRequests] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ unit: '', title: '', description: '', cost: '', contractor: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchUnits() }, [])
  useEffect(() => { fetchRequests() }, [statusFilter])

  const fetchUnits = async () => {
    try {
      const res = await unitsAPI.list()
      setUnits(toArray(res.data))
    } catch { }
  }

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await maintenanceAPI.list({ status: statusFilter })
      setRequests(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ unit: '', title: '', description: '', cost: '', contractor: '' })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.unit || !form.title.trim()) return setError('Unit and title are required.')
    setSaving(true)
    try {
      await maintenanceAPI.create(form)
      setModalOpen(false)
      fetchRequests()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create request.')
    } finally {
      setSaving(false)
    }
  }

  const advanceStatus = async (req) => {
    const idx = STATUS_FLOW.indexOf(req.status)
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return
    try {
      const updates = { status: STATUS_FLOW[idx + 1] }
      if (STATUS_FLOW[idx + 1] === 'COMPLETED') {
        updates.completion_date = new Date().toISOString().slice(0, 10)
      }
      await maintenanceAPI.update(req.id, updates)
      fetchRequests()
    } catch { }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Maintenance</h1>
        <p className="page-header__sub">Track maintenance requests and contractor costs</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-tools" /> New Request
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Unit</th>
                <th>Tenant</th>
                <th>Cost</th>
                <th>Contractor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty"><i className="bi bi-tools" /><p>No maintenance requests found.</p></div></td></tr>
              ) : (
                requests.map(r => {
                  const idx = STATUS_FLOW.indexOf(r.status)
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="font-semi">{r.title}</span>
                        {r.description && <p className="text-muted text-xs">{r.description}</p>}
                      </td>
                      <td>{r.unit_number}</td>
                      <td className="text-muted">{r.tenant_name || '—'}</td>
                      <td className="kes">{r.cost ? fmtKES(r.cost) : '—'}</td>
                      <td className="text-muted">{r.contractor || '—'}</td>
                      <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge--gray'}`}>{r.status?.replace(/_/g, ' ')}</span></td>
                      <td>
                        {idx >= 0 && idx < STATUS_FLOW.length - 1 && (
                          <button className="btn btn--ghost btn--sm" onClick={() => advanceStatus(r)}>
                            {STATUS_FLOW[idx + 1].replace(/_/g, ' ')} <i className="bi bi-arrow-right" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">New Maintenance Request</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="form-group">
                  <label className="form-label form-label--required">Unit</label>
                  <select className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required>
                    <option value="">Select unit</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.property_name} — {u.unit_number}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Title</label>
                  <input className="form-control" placeholder="e.g. Leaking kitchen tap" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Estimated Cost</label>
                    <input type="number" className="form-control" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contractor</label>
                    <input className="form-control" value={form.contractor} onChange={e => setForm({ ...form, contractor: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Creating…</> : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}