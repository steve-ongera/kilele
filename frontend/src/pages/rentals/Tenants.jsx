import { useState, useEffect } from 'react'
import { tenantsAPI, branchesAPI, unitsAPI, leasesAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const EMPTY_FORM = { 
  branch: '', 
  full_name: '', 
  phone: '', 
  email: '', 
  id_number: '', 
  move_in_date: '', 
  unit: '', 
  deposit_paid: '',
  create_user: true,
  password: '',
  confirm_password: ''
}
const EMPTY_LEASE = { start_date: '', end_date: '', rent_amount: '', deposit: '', notice_period_days: 30 }

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [branches, setBranches] = useState([])
  const [vacantUnits, setVacantUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
    setForm({ 
      ...EMPTY_FORM, 
      branch: branches[0]?.id || '', 
      move_in_date: new Date().toISOString().slice(0, 10),
      create_user: true
    })
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
    
    // Validate required fields
    if (!form.full_name.trim() || !form.phone.trim() || !form.branch) {
      return setError('Branch, full name and phone are required.')
    }

    // Validate user account fields if creating user
    if (form.create_user) {
      if (!form.email || !form.email.includes('@')) {
        return setError('Please enter a valid email address for the user account.')
      }
      if (!form.password || form.password.length < 6) {
        return setError('Password must be at least 6 characters long.')
      }
      if (form.password !== form.confirm_password) {
        return setError('Passwords do not match.')
      }
    }

    setSaving(true)
    try {
      // Prepare tenant data with user account fields
      const tenantData = {
        branch: form.branch,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || '',
        id_number: form.id_number || '',
        move_in_date: form.move_in_date,
        unit: form.unit || '',
        deposit_paid: form.deposit_paid || 0,
        create_user: form.create_user,
        password: form.create_user ? form.password : '',
      }
      
      console.log('Creating tenant with data:', tenantData)
      const res = await tenantsAPI.create(tenantData)
      console.log('Tenant created:', res.data)
      
      // Create lease if unit is assigned
      if (form.unit && leaseForm.start_date && leaseForm.end_date && leaseForm.rent_amount) {
        await leasesAPI.create({
          tenant: res.data.id,
          unit: form.unit,
          ...leaseForm,
        })
        console.log('Lease created for tenant')
      }
      
      setModalOpen(false)
      fetchSupport()
      fetchTenants()
    } catch (err) {
      console.error('Error creating tenant:', err)
      let errorMessage = 'Failed to create tenant.'
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const errors = []
          for (const [key, value] of Object.entries(err.response.data)) {
            if (Array.isArray(value)) {
              errors.push(`${key}: ${value.join(', ')}`)
            } else if (typeof value === 'string') {
              errors.push(`${key}: ${value}`)
            }
          }
          errorMessage = errors.join('; ')
        } else {
          errorMessage = err.response.data || errorMessage
        }
      }
      setError(errorMessage)
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
                <th>Email</th>
                <th>Unit</th>
                <th>Move-In Date</th>
                <th>Status</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan={8}><div className="table-empty"><i className="bi bi-house-heart" /><p>No tenants found.</p></div></td></tr>
              ) : (
                tenants.map(t => (
                  <tr key={t.id}>
                    <td className="font-semi">{t.tenant_number}</td>
                    <td>{t.full_name}</td>
                    <td className="text-muted">{t.phone}</td>
                    <td className="text-muted">{t.email || '-'}</td>
                    <td>{t.unit_number || <span className="text-muted">Unassigned</span>}</td>
                    <td className="text-muted text-sm">{t.move_in_date}</td>
                    <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge--gray'}`}>{t.status?.replace(/_/g, ' ')}</span></td>
                    <td>
                      {t.user ? (
                        <span className="badge badge--success" style={{ fontSize: '0.7rem' }}>
                          <i className="bi bi-check-circle" /> Yes
                        </span>
                      ) : (
                        <span className="badge badge--gray" style={{ fontSize: '0.7rem' }}>
                          <i className="bi bi-x-circle" /> No
                        </span>
                      )}
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
          <div className="modal" style={{ maxWidth: '600px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">New Tenant</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem' }}>
                {error && (
                  <div className="alert alert--danger" style={{ marginBottom: '1rem' }}>
                    <i className="bi bi-exclamation-circle" /> {error}
                  </div>
                )}

                {/* Tenant Information Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '0.5rem'
                  }}>
                    <i className="bi bi-person" /> Tenant Information
                  </h4>

                  <div className="form-group">
                    <label className="form-label form-label--required">Branch</label>
                    <select 
                      className="form-control" 
                      value={form.branch} 
                      onChange={e => setForm({ ...form, branch: e.target.value })} 
                      required
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label--required">Full Name</label>
                    <input 
                      className="form-control" 
                      placeholder="Enter full name"
                      value={form.full_name} 
                      onChange={e => setForm({ ...form, full_name: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label form-label--required">Phone</label>
                      <input 
                        className="form-control" 
                        placeholder="07XXXXXXXX" 
                        value={form.phone} 
                        onChange={e => setForm({ ...form, phone: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        placeholder="tenant@example.com" 
                        value={form.email} 
                        onChange={e => setForm({ ...form, email: e.target.value })} 
                        required={form.create_user}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">ID Number</label>
                      <input 
                        className="form-control" 
                        placeholder="ID / Passport number"
                        value={form.id_number} 
                        onChange={e => setForm({ ...form, id_number: e.target.value })} 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label form-label--required">Move-In Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={form.move_in_date} 
                        onChange={e => setForm({ ...form, move_in_date: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                </div>

                {/* Unit & Lease Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '0.5rem'
                  }}>
                    <i className="bi bi-door-open" /> Unit & Lease
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Assign Unit</label>
                    <select 
                      className="form-control" 
                      value={form.unit} 
                      onChange={e => handleUnitChange(e.target.value)}
                    >
                      <option value="">No unit (assign later)</option>
                      {vacantUnits.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.property_name} — {u.unit_number} ({fmtKES(u.monthly_rent)}/mo)
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.unit && (
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Lease Start</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={leaseForm.start_date} 
                          onChange={e => setLeaseForm({ ...leaseForm, start_date: e.target.value })} 
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Lease End</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={leaseForm.end_date} 
                          onChange={e => setLeaseForm({ ...leaseForm, end_date: e.target.value })} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* User Account Section */}
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '0.5rem'
                  }}>
                    <i className="bi bi-person-circle" /> User Account
                  </h4>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={form.create_user} 
                        onChange={e => setForm({ ...form, create_user: e.target.checked })} 
                      />
                      <span>Create user account automatically</span>
                    </label>
                    <small className="form-help" style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      <i className="bi bi-info-circle" /> 
                      {form.create_user ? 'A user account will be created with TENANT role. The tenant can log in using their email and password.' : 'No user account will be created. The tenant will not be able to log in.'}
                    </small>
                  </div>

                  {form.create_user && (
                    <>
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label form-label--required">Password</label>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type={showPassword ? 'text' : 'password'} 
                              className="form-control" 
                              placeholder="Min 6 characters"
                              value={form.password} 
                              onChange={e => setForm({ ...form, password: e.target.value })} 
                              required={form.create_user}
                              minLength="6"
                            />
                            <button 
                              type="button"
                              style={{ 
                                position: 'absolute', 
                                right: '8px', 
                                top: '50%', 
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                padding: '4px'
                              }}
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              <i className={`bi bi-eye${showPassword ? '' : '-slash'}`} />
                            </button>
                          </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label form-label--required">Confirm Password</label>
                          <input 
                            type="password" 
                            className="form-control" 
                            placeholder="Confirm password"
                            value={form.confirm_password} 
                            onChange={e => setForm({ ...form, confirm_password: e.target.value })} 
                            required={form.create_user}
                          />
                        </div>
                      </div>
                      <small className="form-help" style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                        <i className="bi bi-shield-check" /> 
                        The user will be able to log in with their email and this password.
                      </small>
                    </>
                  )}
                </div>
              </div>
              <div className="modal__footer" style={{ 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving} style={{ minWidth: '120px' }}>
                  {saving ? (
                    <><span className="spinner spinner--sm spinner--white" /> Creating…</>
                  ) : (
                    'Create Tenant'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}