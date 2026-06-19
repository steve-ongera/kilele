import { useState, useEffect } from 'react'
import { tableBankingAPI, branchesAPI, membersAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const EMPTY_FORM = { branch: '', full_name: '', phone: '', email: '', id_number: '', date_joined: '', shares: 1 }

export default function TBMembers() {
  const [members, setMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchBranches() }, [])
  useEffect(() => { fetchMembers() }, [])

  const fetchBranches = async () => {
    try {
      const res = await branchesAPI.list({ branch_type: 'TABLE_BANKING' })
      setBranches(toArray(res.data))
    } catch { }
  }

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await tableBankingAPI.members()
      setMembers(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, branch: branches[0]?.id || '', date_joined: new Date().toISOString().slice(0, 10) })
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
      await membersAPI.create(form)
      setModalOpen(false)
      fetchMembers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create member.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = members.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.member_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Table Banking Members</h1>
        <p className="page-header__sub">Group savings and lending circle membership</p>
        <div className="page-header__actions">
          <div className="search-input-wrap" style={{ maxWidth: 240 }}>
            <i className="bi bi-search" />
            <input className="form-control" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-person-plus" /> New Member
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member #</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Branch</th>
                <th>Shares</th>
                <th>Total Contributions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty"><i className="bi bi-people-fill" /><p>No members found.</p></div></td></tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id}>
                    <td className="font-semi">{m.member_number}</td>
                    <td>{m.full_name}</td>
                    <td className="text-muted">{m.phone}</td>
                    <td>{m.branch_name}</td>
                    <td>{m.shares}</td>
                    <td className="kes">{fmtKES(m.total_contributions)}</td>
                    <td><span className={`badge status--${m.status?.toLowerCase()}`}>{m.status}</span></td>
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
              <h3 className="modal__title">New Table Banking Member</h3>
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
                    <label className="form-label form-label--required">Date Joined</label>
                    <input type="date" className="form-control" value={form.date_joined} onChange={e => setForm({ ...form, date_joined: e.target.value })} required />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Creating…</> : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}