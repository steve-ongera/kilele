import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { propertiesAPI, branchesAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const PROPERTY_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE', 'LAND']
const EMPTY_FORM = { branch: '', name: '', property_type: 'RESIDENTIAL', location: '', total_units: 0, purchase_value: '', current_value: '' }

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchBranches() }, [])
  useEffect(() => { fetchProperties() }, [])

  const fetchBranches = async () => {
    try {
      const res = await branchesAPI.list({ branch_type: 'RENTALS' })
      setBranches(toArray(res.data))
    } catch { }
  }

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const res = await propertiesAPI.list()
      setProperties(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, branch: branches[0]?.id || '' })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      branch: p.branch, name: p.name, property_type: p.property_type,
      location: p.location, total_units: p.total_units,
      purchase_value: p.purchase_value, current_value: p.current_value,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.location.trim() || !form.branch) {
      return setError('Branch, name and location are required.')
    }
    setSaving(true)
    try {
      if (editing) {
        await propertiesAPI.update(editing.id, form)
      } else {
        await propertiesAPI.create(form)
      }
      setModalOpen(false)
      fetchProperties()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save property.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = properties.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.property_code?.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Properties</h1>
        <p className="page-header__sub">Manage rental property portfolio</p>
        <div className="page-header__actions">
          <div className="search-input-wrap" style={{ maxWidth: 240 }}>
            <i className="bi bi-search" />
            <input className="form-control" placeholder="Search properties…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-building-add" /> New Property
          </button>
        </div>
      </div>

      <div className="property-grid">
        {loading ? (
          <div className="loading-state"><span className="spinner spinner--lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state__icon"><i className="bi bi-building" /></div>
              <h3 className="empty-state__title">No properties found</h3>
              <p className="empty-state__desc">Add your first property to get started.</p>
            </div>
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="card property-card">
              <div className="card__body">
                <div className="d-flex justify-between align-center mb-12">
                  <span className="badge badge--blue">{p.property_type?.replace(/_/g, ' ')}</span>
                  <span className={`badge status--${p.status?.toLowerCase()}`}>{p.status}</span>
                </div>
                <h3 className="property-card__name">{p.name}</h3>
                <p className="property-card__location"><i className="bi bi-geo-alt" /> {p.location}</p>
                <p className="text-muted text-xs mb-12">{p.property_code}</p>

                <div className="property-card__occupancy">
                  <div className="d-flex justify-between align-center mb-4">
                    <span className="text-xs text-muted">Occupancy</span>
                    <span className="text-xs font-semi">{p.occupancy_rate}%</span>
                  </div>
                  <div className="occupancy-bar">
                    <div
                      className="occupancy-bar__fill"
                      style={{
                        width: `${p.occupancy_rate}%`,
                        background: p.occupancy_rate >= 80 ? 'var(--success)' : p.occupancy_rate >= 50 ? 'var(--warning)' : 'var(--danger)',
                      }}
                    />
                  </div>
                </div>

                <div className="property-card__stats">
                  <div><span className="text-muted text-xs">Units</span><p className="font-semi">{p.total_units}</p></div>
                  <div><span className="text-muted text-xs">Value</span><p className="font-semi">{fmtKES(p.current_value)}</p></div>
                </div>

                <div className="d-flex gap-8 mt-16">
                  <Link to="/rentals/units" className="btn btn--secondary btn--sm flex-1">
                    <i className="bi bi-door-open" /> Units
                  </Link>
                  <button className="btn btn--ghost btn--sm" onClick={() => openEdit(p)}>
                    <i className="bi bi-pencil" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{editing ? 'Edit Property' : 'New Property'}</h3>
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
                  <label className="form-label form-label--required">Property Name</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Property Type</label>
                    <select className="form-control" value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })}>
                      {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Units</label>
                    <input type="number" className="form-control" value={form.total_units} onChange={e => setForm({ ...form, total_units: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Location</label>
                  <input className="form-control" placeholder="e.g. Westlands, Nairobi" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Purchase Value</label>
                    <input type="number" className="form-control" value={form.purchase_value} onChange={e => setForm({ ...form, purchase_value: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current Value</label>
                    <input type="number" className="form-control" value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Saving…</> : (editing ? 'Save Changes' : 'Create Property')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}