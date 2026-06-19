import { useState, useEffect } from 'react'
import { distributionAPI, branchesAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

const STATUS_FLOW = ['DRAFT', 'SIMULATED', 'REVIEWED', 'APPROVED', 'POSTED', 'COMPLETED']

export default function Distribution() {
  const [distributions, setDistributions] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ branch: '', year: new Date().getFullYear(), total_pool: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [distRes, branchRes] = await Promise.all([
        distributionAPI.list(),
        branchesAPI.list({ branch_type: 'TUJIJENGE' }),
      ])
      setDistributions(toArray(distRes.data))
      setBranches(toArray(branchRes.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ branch: branches[0]?.id || '', year: new Date().getFullYear(), total_pool: '' })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.branch || !form.total_pool) return setError('Branch and pool amount are required.')
    setSaving(true)
    try {
      await distributionAPI.create(form)
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create distribution.')
    } finally {
      setSaving(false)
    }
  }

  const advanceStatus = async (dist) => {
    const idx = STATUS_FLOW.indexOf(dist.status)
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return
    try {
      await distributionAPI.update(dist.id, { status: STATUS_FLOW[idx + 1] })
      fetchAll()
      if (selected?.id === dist.id) {
        const res = await distributionAPI.get(dist.id)
        setSelected(res.data)
      }
    } catch { }
  }

  const viewDetail = async (dist) => {
    try {
      const res = await distributionAPI.get(dist.id)
      setSelected(res.data)
    } catch { }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Annual Distribution</h1>
        <p className="page-header__sub">Simulate and post yearly member distributions</p>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-plus-lg" /> New Distribution
          </button>
        </div>
      </div>

      <div className="distribution-grid">
        {loading ? (
          <div className="loading-state"><span className="spinner spinner--lg" /></div>
        ) : distributions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state__icon"><i className="bi bi-pie-chart" /></div>
              <h3 className="empty-state__title">No distributions yet</h3>
              <p className="empty-state__desc">Create your first annual distribution to get started.</p>
            </div>
          </div>
        ) : (
          distributions.map(dist => {
            const idx = STATUS_FLOW.indexOf(dist.status)
            return (
              <div key={dist.id} className="card distribution-card" onClick={() => viewDetail(dist)}>
                <div className="card__body">
                  <div className="d-flex justify-between align-center mb-16">
                    <div>
                      <h3 className="font-display font-bold text-lg">{dist.branch} — {dist.year}</h3>
                      <p className="kes text-muted">{fmtKES(dist.total_pool)} pool</p>
                    </div>
                    <span className={`badge status--${dist.status?.toLowerCase()}`}>{dist.status}</span>
                  </div>
                  <div className="distribution-progress">
                    {STATUS_FLOW.map((s, i) => (
                      <div key={s} className={`distribution-step ${i <= idx ? 'distribution-step--done' : ''}`}>
                        <span className="distribution-step__dot" />
                        <span className="distribution-step__label">{s}</span>
                      </div>
                    ))}
                  </div>
                  {idx < STATUS_FLOW.length - 1 && (
                    <button
                      className="btn btn--outline btn--sm mt-16"
                      onClick={(e) => { e.stopPropagation(); advanceStatus(dist) }}
                    >
                      Advance to {STATUS_FLOW[idx + 1]} <i className="bi bi-arrow-right" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">New Annual Distribution</h3>
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
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input type="number" className="form-control" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label--required">Total Pool Amount</label>
                    <input type="number" className="form-control" value={form.total_pool} onChange={e => setForm({ ...form, total_pool: e.target.value })} required />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Creating…</> : 'Create Distribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{selected.branch} — {selected.year} Distribution</h3>
              <button className="modal__close" onClick={() => setSelected(null)}><i className="bi bi-x" /></button>
            </div>
            <div className="modal__body">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Contribution</th>
                      <th>Interest</th>
                      <th>Bonus</th>
                      <th>Loans</th>
                      <th>Net</th>
                      <th>Eligible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.entries || []).length === 0 ? (
                      <tr><td colSpan={7}><div className="table-empty"><i className="bi bi-pie-chart" /><p>No entries computed yet.</p></div></td></tr>
                    ) : (
                      selected.entries.map(entry => (
                        <tr key={entry.id}>
                          <td className="font-semi">{entry.member_name}</td>
                          <td className="kes">{fmtKES(entry.contribution_value)}</td>
                          <td className="kes">{fmtKES(entry.interest_share)}</td>
                          <td className="kes">{fmtKES(entry.bonus)}</td>
                          <td className="kes amount--negative">{fmtKES(entry.outstanding_loans)}</td>
                          <td className="kes font-semi amount--positive">{fmtKES(entry.net_distribution)}</td>
                          <td>
                            <span className={`badge ${entry.is_eligible ? 'badge--green' : 'badge--red'}`}>
                              {entry.is_eligible ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}