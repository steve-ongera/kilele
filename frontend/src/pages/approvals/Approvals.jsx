import { useState, useEffect } from 'react'
import { approvalsAPI, toArray } from '../../services/api'

const ACTION_ICON = {
  LOAN: 'bi-cash-stack',
  WITHDRAWAL: 'bi-arrow-up-circle',
  WAIVER: 'bi-shield-x',
  EXIT: 'bi-door-open',
  RULE_CHANGE: 'bi-sliders',
}

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED', 'POSTED']

export default function Approvals() {
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('PENDING')
  const [actionType, setActionType] = useState('')

  const [rejectModal, setRejectModal] = useState(null)
  const [rejectionNote, setRejectionNote] = useState('')
  const [processing, setProcessing] = useState('')

  useEffect(() => { fetchApprovals() }, [status, actionType])

  const fetchApprovals = async () => {
    setLoading(true)
    try {
      const res = await approvalsAPI.list({ status, action_type: actionType })
      setApprovals(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approval) => {
    setProcessing(approval.id)
    try {
      await approvalsAPI.approve(approval.id)
      fetchApprovals()
    } catch {
      // silent
    } finally {
      setProcessing('')
    }
  }

  const handleReject = async () => {
    if (!rejectionNote.trim()) return
    setProcessing(rejectModal.id)
    try {
      await approvalsAPI.reject(rejectModal.id, rejectionNote)
      setRejectModal(null)
      setRejectionNote('')
      fetchApprovals()
    } catch {
      // silent
    } finally {
      setProcessing('')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Approvals</h1>
        <p className="page-header__sub">Review pending loans, withdrawals, waivers and exits</p>
        <div className="page-header__actions">
          <div className="tabs">
            {STATUS_OPTIONS.map(s => (
              <button key={s} className={`tab ${status === s ? 'tab--active' : ''}`} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
          </div>
          <select className="form-control" style={{ maxWidth: 180 }} value={actionType} onChange={e => setActionType(e.target.value)}>
            <option value="">All Types</option>
            <option value="LOAN">Loans</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="WAIVER">Waivers</option>
            <option value="EXIT">Exits</option>
            <option value="RULE_CHANGE">Rule Changes</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state"><span className="spinner spinner--lg" /><p>Loading approvals…</p></div>
        ) : approvals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><i className="bi bi-check2-square" /></div>
            <h3 className="empty-state__title">No {status.toLowerCase()} approvals</h3>
            <p className="empty-state__desc">Everything is up to date.</p>
          </div>
        ) : (
          <div className="approval-list">
            {approvals.map(a => (
              <div key={a.id} className="approval-item">
                <div className="approval-item__icon">
                  <i className={`bi ${ACTION_ICON[a.action_type] || 'bi-question-circle'}`} />
                </div>
                <div className="approval-item__body">
                  <div className="d-flex justify-between align-center">
                    <span className="font-semi">{a.action_type?.replace(/_/g, ' ')}</span>
                    <span className={`badge status--${a.status?.toLowerCase()}`}>{a.status}</span>
                  </div>
                  <p className="text-secondary text-sm mt-4">{a.reason}</p>
                  <p className="text-muted text-xs mt-4">
                    Requested by <strong>{a.requested_by_name}</strong>
                    {a.branch_name && <span> · {a.branch_name}</span>}
                    {' · '}
                    {new Date(a.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </p>
                  {a.payload && Object.keys(a.payload).length > 0 && (
                    <div className="approval-item__payload">
                      {Object.entries(a.payload).map(([k, v]) => (
                        <span key={k} className="badge badge--gray">{k}: {v}</span>
                      ))}
                    </div>
                  )}
                  {a.rejection_note && (
                    <p className="text-danger text-xs mt-8"><i className="bi bi-x-circle" /> {a.rejection_note}</p>
                  )}
                </div>
                {a.status === 'PENDING' && (
                  <div className="approval-item__actions">
                    <button
                      className="btn btn--success btn--sm"
                      onClick={() => handleApprove(a)}
                      disabled={processing === a.id}
                    >
                      {processing === a.id ? <span className="spinner spinner--sm spinner--white" /> : <i className="bi bi-check" />} Approve
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => { setRejectModal(a); setRejectionNote('') }}>
                      <i className="bi bi-x" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Reject Request</h3>
              <button className="modal__close" onClick={() => setRejectModal(null)}><i className="bi bi-x" /></button>
            </div>
            <div className="modal__body">
              <p className="mb-16">Rejecting <strong>{rejectModal.action_type}</strong> request from {rejectModal.requested_by_name}.</p>
              <div className="form-group">
                <label className="form-label form-label--required">Rejection Reason</label>
                <textarea className="form-control" value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleReject} disabled={!rejectionNote.trim() || processing === rejectModal.id}>
                {processing === rejectModal.id ? <span className="spinner spinner--sm spinner--white" /> : <i className="bi bi-x-circle" />} Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}