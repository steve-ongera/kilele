import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { usersAPI } from '../../services/api'

export default function Profile() {
  const { user, login } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || '', phone: user.phone || '' })
    }
  }, [user])

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'KR'

  const roleLabel = {
    SUPER_ADMIN: 'Super Admin',
    BRANCH_ADMIN: 'Branch Admin',
    FINANCE_OFFICER: 'Finance Officer',
    AUDITOR: 'Auditor',
    MEMBER: 'Member',
    INVESTOR: 'Investor',
    TENANT: 'Tenant',
  }[user?.role] || user?.role

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await usersAPI.updateProfile(form)
      const updatedUser = { ...user, ...res.data }
      const access = localStorage.getItem('kilele_access')
      const refresh = localStorage.getItem('kilele_refresh')
      login(updatedUser, access, refresh)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">My Profile</h1>
        <p className="page-header__sub">Manage your personal information</p>
      </div>

      <div className="profile-layout">
        {/* Identity card */}
        <div className="card profile-card">
          <div className="card__body profile-card__body">
            <div className="profile-card__avatar">
              <span>{initials}</span>
            </div>
            <h3 className="profile-card__name">{user?.full_name}</h3>
            <span className="badge badge--blue">{roleLabel}</span>

            <div className="divider" />

            <div className="profile-card__row">
              <i className="bi bi-envelope" />
              <span>{user?.email}</span>
            </div>
            {user?.branch_name && (
              <div className="profile-card__row">
                <i className="bi bi-building" />
                <span>{user.branch_name}</span>
              </div>
            )}
            {user?.date_joined && (
              <div className="profile-card__row">
                <i className="bi bi-calendar3" />
                <span>Joined {new Date(user.date_joined).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Edit Details</h3>
          </div>
          <div className="card__body">
            {saved && (
              <div className="alert alert--success">
                <i className="bi bi-check-circle" /> Profile updated successfully.
              </div>
            )}
            {error && (
              <div className="alert alert--danger">
                <i className="bi bi-exclamation-circle" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label form-label--required">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    className="form-control"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    placeholder="07XXXXXXXX"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={user?.email || ''}
                  disabled
                />
                <span className="form-hint">Email cannot be changed. Contact an administrator if needed.</span>
              </div>

              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? <><span className="spinner spinner--sm spinner--white" /> Saving…</> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}