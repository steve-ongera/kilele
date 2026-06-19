import { useState, useEffect } from 'react'
import { penaltiesAPI, membersAPI, toArray } from '../../services/api'
import { useAuth } from '../../App'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
const PENALTY_TYPES = ['LATE_CONTRIBUTION', 'LATE_LOAN_REPAYMENT', 'MISSED_MEETING', 'OTHER']
const EMPTY_FORM = { member: '', penalty_type: 'LATE_CONTRIBUTION', amount: '', description: '' }

export default function Penalties() {
  const { user } = useAuth()
  const canWaive = ['SUPER_ADMIN', 'BRANCH_ADMIN'].includes(user?.role)

  const [penalties, setPenalties] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('') // '' | active | waived

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [waiveModal, setWaiveModal] = useState(null)
  const [waiverReason, setWaiverReason] = useState('')

  useEffect(() => { fetchMembers() }, [])
  useEffect(() => { fetchPenalties() }, [])

  const fetchMembers = async () => {
    try {
      const res = await membersAPI.list({ status: 'ACTIVE' })
      setMembers(toArray(res.data))
    } catch { }
  }

  const fetchPenalties = async () => {
    setLoading(true)
    try {
      const res = await penaltiesAPI.list()
      setPenalties(toArray(res.data))
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
    if (!form.member || !form.amount) return setError('Member and amount are required.')
    setSaving(true)
    try {
      await penaltiesAPI.create(form)
      setModalOpen(false)
      fetchPenalties()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create penalty.')
    } finally {
      setSaving(false)
    }
  }

  const handleWaive = async () => {
    if (!waiverReason.trim()) return
    try {
      await penaltiesAPI.waive(waiveModal.id, { waiver_reason: waiverReason })
      setWaiveModal(null)
      setWaiverReason('')
      fetchPenalties()
    } catch { }
  }

  const filtered = penalties.filter(p => {
    if (filter === 'active') return !p.is_waived
    if (filter === 'waived') return p.is_waived
    return true
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Penalties</h1>
        <p className="page-header__sub">Track and manage member penalties</p>
        <div className="page-header__actions">
          <div className="tabs">
            <button className={`tab ${filter === '' ? 'tab--active' : ''}`} onClick={() => setFilter('')}>All</button>
            <button className={`tab ${filter === 'active' ? 'tab--active' : ''}`} onClick={() => setFilter('active')}>Active</button>
            <button className={`tab ${filter === 'waived' ? 'tab--active' : ''}`} onClick={() => setFilter('waived')}>Waived</button>
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-plus-lg" /> Add Penalty
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="table-empty">
                    <i className="bi bi-exclamation-triangle" />
                    <p>No penalties found.</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td className="font-semi">{p.member_name}</td>
                    <td><span className="badge badge--gray">{p.penalty_type?.replace(/_/g, ' ')}</span></td>
                    <td className="kes amount--negative">{fmtKES(p.amount)}</td>
                    <td className="text-muted">{p.description || '—'}</td>
                    <td>
                      <span className={`badge ${p.is_waived ? 'badge--gray' : 'badge--red'}`}>
                        {p.is_waived ? 'Waived' : 'Active'}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-KE') : '—'}
                    </td>
                    <td>
                      {!p.is_waived && canWaive && (
                        <button className="btn btn--ghost btn--sm" onClick={() => setWaiveModal(p)}>
                          <i className="bi bi-shield-x" /> Waive
                        </button>
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Add Penalty</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="form-group">
                  <label className="form-label form-label--required">Member</label>
                  <select className="form-control" value={form.member} onChange={e => setForm({ ...form, member: e.target.value })} required>
                    <option value="">Select member</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.member_number} — {m.full_name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Penalty Type</label>
                    <select className="form-control" value={form.penalty_type} onChange={e => setForm({ ...form, penalty_type: e.target.value })}>
                      {PENALTY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label--required">Amount</label>
                    <input type="number" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Saving…</> : 'Add Penalty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {waiveModal && (
        <div className="modal-backdrop" onClick={() => setWaiveModal(null)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Waive Penalty</h3>
              <button className="modal__close" onClick={() => setWaiveModal(null)}><i className="bi bi-x" /></button>
            </div>
            <div className="modal__body">
              <p className="mb-16">
                Waiving <strong>{fmtKES(waiveModal.amount)}</strong> penalty for <strong>{waiveModal.member_name}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label form-label--required">Reason for Waiver</label>
                <textarea className="form-control" value={waiverReason} onChange={e => setWaiverReason(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setWaiveModal(null)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleWaive} disabled={!waiverReason.trim()}>
                <i className="bi bi-shield-x" /> Confirm Waiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}