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

const EMPTY_FORM = { email: '', full_name: '', phone: '', role: 'MEMBER', branch: '', password: '' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ role: '', branch: '', is_active: true })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [pwUser, setPwUser] = useState(null)
  const [pwValue, setPwValue] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

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

  // ── CREATE ──────────────────────────────────
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
      if (!payload.password) delete payload.password
      await usersAPI.create(payload)
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      const detail = err.response?.data
      setError(
        detail?.email?.[0] || detail?.password?.[0] || detail?.detail || 'Failed to create user.'
      )
    } finally {
      setSaving(false)
    }
  }

  // ── EDIT ROLE / BRANCH / STATUS ─────────────
  const openEdit = (user) => {
    setEditUser(user)
    setEditForm({ role: user.role, branch: user.branch || '', is_active: user.is_active })
    setEditError('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditSaving(true)
    try {
      await usersAPI.update(editUser.id, {
        role: editForm.role,
        branch: editForm.branch || null,
        is_active: editForm.is_active,
      })
      setEditUser(null)
      fetchAll()
    } catch (err) {
      setEditError(err.response?.data?.detail || 'Failed to update user.')
    } finally {
      setEditSaving(false)
    }
  }

  const toggleActive = async (user) => {
    try {
      await usersAPI.update(user.id, { is_active: !user.is_active })
      fetchAll()
    } catch { }
  }

  // ── SET PASSWORD ────────────────────────────
  const openSetPassword = (user) => {
    setPwUser(user)
    setPwValue('')
    setPwError('')
    setPwSuccess(false)
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwValue.length < 6) {
      return setPwError('Password must be at least 6 characters.')
    }
    setPwSaving(true)
    try {
      await usersAPI.setPassword(pwUser.id, pwValue)
      setPwSuccess(true)
      setTimeout(() => setPwUser(null), 1200)
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Failed to set password.')
    } finally {
      setPwSaving(false)
    }
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
                      <div className="d-flex gap-8">
                        <button className="btn btn--sm btn--outline" onClick={() => openEdit(u)}>
                          <i className="bi bi-pencil" /> Edit
                        </button>
                        <button className="btn btn--sm btn--outline" onClick={() => openSetPassword(u)}>
                          <i className="bi bi-key" /> Password
                        </button>
                        <button
                          className={`btn btn--sm ${u.is_active ? 'btn--ghost' : 'btn--outline'}`}
                          onClick={() => toggleActive(u)}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
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
                <div className="form-group">
                  <label className="form-label">Password (optional)</label>
                  <input
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Leave blank to require OTP-only login"
                    minLength={6}
                  />
                  <span className="form-hint">
                    If set, this user can log in with a password in addition to OTP. Leave blank for OTP-only access.
                  </span>
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

      {/* EDIT ROLE / BRANCH MODAL */}
      {editUser && (
        <div className="modal-backdrop" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Edit {editUser.full_name}</h3>
              <button className="modal__close" onClick={() => setEditUser(null)}>
                <i className="bi bi-x" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal__body">
                {editError && (
                  <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{editError}</div>
                )}
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-control"
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <select
                    className="form-control"
                    value={editForm.branch}
                    onChange={e => setEditForm({ ...editForm, branch: e.target.value })}
                  >
                    <option value="">— No branch —</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group form-group--checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                    />
                    Account active
                  </label>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setEditUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={editSaving}>
                  {editSaving ? <><span className="spinner spinner--sm spinner--white" /> Saving…</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SET PASSWORD MODAL */}
      {pwUser && (
        <div className="modal-backdrop" onClick={() => setPwUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Set Password — {pwUser.full_name}</h3>
              <button className="modal__close" onClick={() => setPwUser(null)}>
                <i className="bi bi-x" />
              </button>
            </div>
            <form onSubmit={handleSetPassword}>
              <div className="modal__body">
                {pwError && (
                  <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{pwError}</div>
                )}
                {pwSuccess && (
                  <div className="alert alert--success"><i className="bi bi-check-circle" /> Password updated successfully.</div>
                )}
                <div className="form-group">
                  <label className="form-label form-label--required">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={pwValue}
                    onChange={e => setPwValue(e.target.value)}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setPwUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={pwSaving}>
                  {pwSaving ? <><span className="spinner spinner--sm spinner--white" /> Saving…</> : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}