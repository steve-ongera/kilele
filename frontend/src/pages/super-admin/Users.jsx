import { useState, useEffect } from 'react'
import { usersAPI, branchesAPI, toArray } from '../../services/api'

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'BRANCH_ADMIN', label: 'Branch Admin' },
  { value: 'FINANCE_OFFICER', label: 'Finance Officer' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'INVESTOR', label: 'Investor' },
  { value: 'TENANT', label: 'Tenant' },
]

const ROLE_BADGE = {
  SUPER_ADMIN: 'badge--black',
  BRANCH_ADMIN: 'badge--blue',
  FINANCE_OFFICER: 'badge--blue',
  AUDITOR: 'badge--gray',
  MEMBER: 'badge--green',
  INVESTOR: 'badge--orange',
  TENANT: 'badge--orange',
}

const EMPTY_FORM = { email: '', full_name: '', phone: '', role: 'MEMBER', branch: '' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [userRes, branchRes] = await Promise.all([
        usersAPI.list(),
        branchesAPI.list(),
      ])
      setUsers(toArray(userRes.data))
      setBranches(toArray(branchRes.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email.trim() || !form.full_name.trim()) {
      return setError('Email and full name are required.')
    }
    setSaving(true)
    try {
      const payload = { ...form, branch: form.branch || null }
      await usersAPI.create(payload)
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      const detail = err.response?.data
      setError(
        detail?.email?.[0] || detail?.detail || 'Failed to create user.'
      )
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (user) => {
    try {
      await usersAPI.update(user.id, { is_active: !user.is_active })
      fetchAll()
    } catch { }
  }

  const filtered = users.filter(u => {
    const matchSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Users</h1>
        <p className="page-header__sub">Create and manage platform users</p>
        <div className="page-header__actions">
          <div className="toolbar__search search-input-wrap" style={{ maxWidth: 240 }}>
            <i className="bi bi-search" />
            <input
              className="form-control"
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-control" style={{ maxWidth: 180 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-person-plus" /> New User
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="table-empty">
                    <i className="bi bi-people" />
                    <p>No users found.</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id}>
                    <td className="font-semi">{u.full_name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] || 'badge--gray'}`}>{ROLES.find(r => r.value === u.role)?.label || u.role}</span></td>
                    <td>{u.branch_name || <span className="text-muted">—</span>}</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge--green' : 'badge--gray'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-KE') : '—'}
                    </td>
                    <td>
                      <button
                        className={`btn btn--sm ${u.is_active ? 'btn--ghost' : 'btn--outline'}`}
                        onClick={() => toggleActive(u)}
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
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
              <h3 className="modal__title">New User</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                <i className="bi bi-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && (
                  <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>
                )}
                <div className="form-group">
                  <label className="form-label form-label--required">Full Name</label>
                  <input
                    className="form-control"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="user@kileleridge.co.ke"
                    required
                  />
                  <span className="form-hint">Login OTP codes will be sent to this email.</span>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      className="form-control"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label--required">Role</label>
                    <select
                      className="form-control"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <select
                    className="form-control"
                    value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                  >
                    <option value="">— No branch (Super Admin / unassigned) —</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Creating…</> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}