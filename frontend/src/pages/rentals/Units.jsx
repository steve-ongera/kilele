import { useState, useEffect } from 'react'
import { unitsAPI, propertiesAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const OCCUPANCY_OPTIONS = ['OCCUPIED', 'VACANT', 'RESERVED', 'UNDER_MAINTENANCE']
const EMPTY_FORM = { property: '', unit_number: '', unit_type: '', monthly_rent: '', deposit_amount: '' }

export default function Units() {
  const [units, setUnits] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [propertyFilter, setPropertyFilter] = useState('')
  const [occupancyFilter, setOccupancyFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchProperties() }, [])
  useEffect(() => { fetchUnits() }, [propertyFilter, occupancyFilter])

  const fetchProperties = async () => {
    try {
      const res = await propertiesAPI.list()
      setProperties(toArray(res.data))
    } catch { }
  }

  const fetchUnits = async () => {
    setLoading(true)
    try {
      const res = await unitsAPI.list({ property: propertyFilter, occupancy_status: occupancyFilter })
      setUnits(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, property: propertyFilter || properties[0]?.id || '' })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.property || !form.unit_number.trim() || !form.monthly_rent) {
      return setError('Property, unit number and rent are required.')
    }
    setSaving(true)
    try {
      await unitsAPI.create(form)
      setModalOpen(false)
      fetchUnits()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create unit.')
    } finally {
      setSaving(false)
    }
  }

  const OCC_BADGE = {
    OCCUPIED: 'badge--green',
    VACANT: 'badge--gray',
    RESERVED: 'badge--blue',
    UNDER_MAINTENANCE: 'badge--orange',
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Units</h1>
        <p className="page-header__sub">Manage individual rental units</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 200 }} value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)}>
            <option value="">All Properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="form-control" style={{ maxWidth: 180 }} value={occupancyFilter} onChange={e => setOccupancyFilter(e.target.value)}>
            <option value="">All Occupancy</option>
            {OCCUPANCY_OPTIONS.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-door-open" /> New Unit
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unit #</th>
                <th>Property</th>
                <th>Type</th>
                <th>Monthly Rent</th>
                <th>Deposit</th>
                <th>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : units.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty"><i className="bi bi-door-open" /><p>No units found.</p></div></td></tr>
              ) : (
                units.map(u => (
                  <tr key={u.id}>
                    <td className="font-semi">{u.unit_number}</td>
                    <td>{u.property_name} <span className="text-muted text-xs">({u.property_code})</span></td>
                    <td className="text-muted">{u.unit_type || '—'}</td>
                    <td className="kes">{fmtKES(u.monthly_rent)}</td>
                    <td className="kes text-muted">{fmtKES(u.deposit_amount)}</td>
                    <td><span className={`badge ${OCC_BADGE[u.occupancy_status] || 'badge--gray'}`}>{u.occupancy_status?.replace(/_/g, ' ')}</span></td>
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
              <h3 className="modal__title">New Unit</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="form-group">
                  <label className="form-label form-label--required">Property</label>
                  <select className="form-control" value={form.property} onChange={e => setForm({ ...form, property: e.target.value })} required>
                    <option value="">Select property</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label form-label--required">Unit Number</label>
                    <input className="form-control" placeholder="e.g. A12" value={form.unit_number} onChange={e => setForm({ ...form, unit_number: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Type</label>
                    <input className="form-control" placeholder="e.g. 2BR" value={form.unit_type} onChange={e => setForm({ ...form, unit_type: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label form-label--required">Monthly Rent</label>
                    <input type="number" className="form-control" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deposit Amount</label>
                    <input type="number" className="form-control" value={form.deposit_amount} onChange={e => setForm({ ...form, deposit_amount: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Creating…</> : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}