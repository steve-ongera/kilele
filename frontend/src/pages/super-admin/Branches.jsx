import { useState, useEffect } from 'react'
import { branchesAPI, toArray } from '../../services/api'

const BRANCH_TYPES = [
  { value: 'TUJIJENGE', label: 'Tujijenge Savings Circle' },
  { value: 'WEALTH_ALLIANCE', label: 'Wealth Alliance' },
  { value: 'TABLE_BANKING', label: 'Table Banking' },
  { value: 'RENTALS', label: 'Rentals' },
  { value: 'CUSTOM', label: 'Custom' },
]

const EMPTY_FORM = { name: '', branch_type: 'TUJIJENGE', description: '' }

export default function Branches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchBranches() }, [])

  const fetchBranches = async () => {
    setLoading(true)
    try {
      const res = await branchesAPI.list()
      setBranches(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (branch) => {
    setEditing(branch)
    setForm({ name: branch.name, branch_type: branch.branch_type, description: branch.description || '' })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Branch name is required.')
    setSaving(true)
    try {
      if (editing) {
        await branchesAPI.update(editing.id, form)
      } else {
        await branchesAPI.create(form)
      }
      setModalOpen(false)
      fetchBranches()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save branch.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (branch) => {
    try {
      await branchesAPI.update(branch.id, { is_active: !branch.is_active })
      fetchBranches()
    } catch {
      // silent
    }
  }

  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Branches</h1>
        <p className="page-header__sub">Manage all business unit branches</p>
        <div className="page-header__actions">
          <div className="toolbar__search search-input-wrap" style={{ maxWidth: 280 }}>
            <i className="bi bi-search" />
            <input
              className="form-control"
              placeholder="Search branches…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-plus-lg" /> New Branch
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Members</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="table-empty">
                    <i className="bi bi-diagram-3" />
                    <p>No branches found.</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map(branch => (
                  <tr key={branch.id}>
                    <td>
                      <span className="font-semi">{branch.name}</span>
                      {branch.description && (
                        <p className="text-muted text-xs">{branch.description}</p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge--blue">
                        {BRANCH_TYPES.find(t => t.value === branch.branch_type)?.label || branch.branch_type}
                      </span>
                    </td>
                    <td>{branch.member_count ?? 0}</td>
                    <td>
                      <span className={`badge ${branch.is_active ? 'badge--green' : 'badge--gray'}`}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {branch.created_at ? new Date(branch.created_at).toLocaleDateString('en-KE') : '—'}
                    </td>
                    <td>
                      <div className="d-flex gap-8">
                        <button className="btn btn--ghost btn--sm" onClick={() => openEdit(branch)}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className={`btn btn--sm ${branch.is_active ? 'btn--ghost' : 'btn--outline'}`}
                          onClick={() => toggleActive(branch)}
                        >
                          {branch.is_active ? 'Disable' : 'Enable'}
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

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{editing ? 'Edit Branch' : 'New Branch'}</h3>
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
                  <label className="form-label form-label--required">Branch Name</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Tujijenge Nairobi Central"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label--required">Branch Type</label>
                  <select
                    className="form-control"
                    value={form.branch_type}
                    onChange={e => setForm({ ...form, branch_type: e.target.value })}
                  >
                    {BRANCH_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional notes about this branch…"
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Saving…</> : (editing ? 'Save Changes' : 'Create Branch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}