import { useState, useEffect } from 'react'
import { tenantsAPI, branchesAPI, unitsAPI, leasesAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const EMPTY_FORM = { branch: '', full_name: '', phone: '', email: '', id_number: '', move_in_date: '', unit: '', deposit_paid: '' }
const EMPTY_LEASE = { start_date: '', end_date: '', rent_amount: '', deposit: '', notice_period_days: 30 }

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [branches, setBranches] = useState([])
  const [vacantUnits, setVacantUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [leaseForm, setLeaseForm] = useState(EMPTY_LEASE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchSupport() }, [])
  useEffect(() => { fetchTenants() }, [search])

  const fetchSupport = async () => {
    try {
      const [branchRes, unitRes] = await Promise.all([
        branchesAPI.list({ branch_type: 'RENTALS' }),
        unitsAPI.list({ occupancy_status: 'VACANT' }),
      ])
      setBranches(toArray(branchRes.data))
      setVacantUnits(toArray(unitRes.data))
    } catch { }
  }

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const res = await tenantsAPI.list({ search })
      setTenants(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, branch: branches[0]?.id || '', move_in_date: new Date().toISOString().slice(0, 10) })
    setLeaseForm({ ...EMPTY_LEASE, start_date: new Date().toISOString().slice(0, 10) })
    setError('')
    setModalOpen(true)
  }

  const handleUnitChange = (unitId) => {
    const unit = vacantUnits.find(u => u.id === unitId)
    setForm({ ...form, unit: unitId, deposit_paid: unit?.deposit_amount || '' })
    if (unit) {
      setLeaseForm({ ...leaseForm, rent_amount: unit.monthly_rent, deposit: unit.deposit_amount })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.full_name.trim() || !form.phone.trim() || !form.branch) {
      return setError('Branch, full name and phone are required.')
    }
    setSaving(true)
    try {
      const res = await tenantsAPI.create(form)
      if (form.unit && leaseForm.start_date && leaseForm.end_date && leaseForm.rent_amount) {
        await leasesAPI.create({
          tenant: res.data.id,
          unit: form.unit,
          ...leaseForm,
        })
      }
      setModalOpen(false)
      fetchSupport()
      fetchTenants()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create tenant.')
    } finally {
      setSaving(false)
    }
  }

  const STATUS_BADGE = { ACTIVE: 'badge--green', NOTICE_GIVEN: 'badge--orange', EXITED: 'badge--gray', EVICTED: 'badge--red' }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Tenants</h1>
        <p className="page-header__sub">Tenant registration and lease management</p>
        <div className="page-header__actions">
          <div className="search-input-wrap" style={{ maxWidth: 240 }}>
            <i className="bi bi-search" />
            <input className="form-control" placeholder="Search tenants…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-house-add" /> New Tenant
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tenant #</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Unit</th>
                <th>Move-In Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty"><i className="bi bi-house-heart" /><p>No tenants found.</p></div></td></tr>
              ) : (
                tenants.map(t => (
                  <tr key={t.id}>
                    <td className="font-semi">{t.tenant_number}</td>
                    <td>{t.full_name}</td>
                    <td className="text-muted">{t.phone}</td>
                    <td>{t.unit_number || <span className="text-muted">Unassigned</span>}</td>
                    <td className="text-muted text-sm">{t.move_in_date}</td>
                    <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge--gray'}`}>{t.status?.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">New Tenant & Lease</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}

                <h4 className="settings-section-title" style={{ fontSize: 13, marginBottom: 12 }}>Tenant Details</h4>
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

                <div className="divider" />
                <h4 className="settings-section-title" style={{ fontSize: 13, marginBottom: 12 }}>Unit & Lease (Optional)</h4>
                <div className="form-group">
                  <label className="form-label">Assign Unit</label>
                  <select className="form-control" value={form.unit} onChange={e => handleUnitChange(e.target.value)}>
                    <option value="">No unit (assign later)</option>
                    {vacantUnits.map(u => (
                      <option key={u.id} value={u.id}>{u.property_name} — {u.unit_number} ({fmtKES(u.monthly_rent)}/mo)</option>
                    ))}
                  </select>
                </div>
                {form.unit && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Lease Start</label>
                      <input type="date" className="form-control" value={leaseForm.start_date} onChange={e => setLeaseForm({ ...leaseForm, start_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lease End</label>
                      <input type="date" className="form-control" value={leaseForm.end_date} onChange={e => setLeaseForm({ ...leaseForm, end_date: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Creating…</> : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}