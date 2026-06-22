import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { loansAPI, investorWithdrawalsAPI, maintenanceAPI, toArray } from '../../services/api'

export default function MyRequests() {
  const { user } = useAuth()
  const role = user?.role

  const [modalOpen, setModalOpen] = useState(false)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [loanForm, setLoanForm] = useState({ product: '', principal: '', notes: '' })
  const [withdrawalForm, setWithdrawalForm] = useState({ withdrawal_type: 'DIVIDEND', amount_requested: '', notes: '' })
  const [maintenanceForm, setMaintenanceForm] = useState({ title: '', description: '' })

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      let data = []
      if (role === 'MEMBER') {
        const res = await loansAPI.list({ member: user?.member_id })
        data = toArray(res.data).map(l => ({ ...l, _type: 'Loan', _label: l.loan_number, _status: l.approval_status }))
      } else if (role === 'INVESTOR') {
        const res = await investorWithdrawalsAPI.list({})
        data = toArray(res.data).filter(w => w.investor === user?.investor_id).map(w => ({ ...w, _type: 'Withdrawal', _label: w.withdrawal_type, _status: w.status }))
      } else if (role === 'TENANT') {
        const res = await maintenanceAPI.list({})
        data = toArray(res.data).map(m => ({ ...m, _type: 'Maintenance', _label: m.title, _status: m.status }))
      }
      setRequests(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (role === 'MEMBER') {
        await loansAPI.create({ member: user?.member_id, branch: user?.branch, ...loanForm })
      } else if (role === 'INVESTOR') {
        await investorWithdrawalsAPI.create({ investor: user?.investor_id, branch: user?.branch, ...withdrawalForm })
      } else if (role === 'TENANT') {
        await maintenanceAPI.create({ unit: user?.unit_id, tenant: user?.tenant_id, ...maintenanceForm })
      }
      setModalOpen(false)
      fetchRequests()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request.')
    } finally {
      setSaving(false)
    }
  }

  const titleMap = { MEMBER: 'Loan Request', INVESTOR: 'Withdrawal Request', TENANT: 'Maintenance Request' }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">My Requests</h1>
        <p className="page-header__sub">
          {role === 'MEMBER' && 'Submit and track loan applications'}
          {role === 'INVESTOR' && 'Submit and track withdrawal requests'}
          {role === 'TENANT' && 'Submit and track maintenance requests'}
        </p>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => { setError(''); setModalOpen(true) }}>
            <i className="bi bi-plus-lg" /> New {titleMap[role]}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Reference</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={3}><div className="table-empty"><i className="bi bi-send" /><p>No requests submitted yet.</p></div></td></tr>
              ) : (
                requests.map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="font-semi">{r._label}</td>
                    <td><span className="badge badge--gray">{r._type}</span></td>
                    <td><span className={`badge status--${r._status?.toLowerCase()}`}>{r._status?.replace(/_/g, ' ')}</span></td>
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
              <h3 className="modal__title">New {titleMap[role]}</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}

                {role === 'MEMBER' && (
                  <>
                    <div className="form-group">
                      <label className="form-label form-label--required">Amount Requested</label>
                      <input type="number" className="form-control" value={loanForm.principal} onChange={e => setLoanForm({ ...loanForm, principal: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reason / Notes</label>
                      <textarea className="form-control" value={loanForm.notes} onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })} />
                    </div>
                  </>
                )}

                {role === 'INVESTOR' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Withdrawal Type</label>
                      <select className="form-control" value={withdrawalForm.withdrawal_type} onChange={e => setWithdrawalForm({ ...withdrawalForm, withdrawal_type: e.target.value })}>
                        <option value="DIVIDEND">Dividend</option>
                        <option value="PARTIAL_CAPITAL">Partial Capital</option>
                        <option value="FULL_EXIT">Full Exit</option>
                        <option value="EMERGENCY">Emergency</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label form-label--required">Amount Requested</label>
                      <input type="number" className="form-control" value={withdrawalForm.amount_requested} onChange={e => setWithdrawalForm({ ...withdrawalForm, amount_requested: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notes</label>
                      <textarea className="form-control" value={withdrawalForm.notes} onChange={e => setWithdrawalForm({ ...withdrawalForm, notes: e.target.value })} />
                    </div>
                  </>
                )}

                {role === 'TENANT' && (
                  <>
                    <div className="form-group">
                      <label className="form-label form-label--required">Issue Title</label>
                      <input className="form-control" placeholder="e.g. Leaking tap" value={maintenanceForm.title} onChange={e => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Submitting…</> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}