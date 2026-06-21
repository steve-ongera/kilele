import { useState, useEffect } from 'react'
import { mpesaAPI, membersAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function MpesaQueue() {
  const [transactions, setTransactions] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [allocateModal, setAllocateModal] = useState(null)
  const [selectedMember, setSelectedMember] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [txRes, memberRes] = await Promise.all([
        mpesaAPI.queue(),
        membersAPI.list({ status: 'ACTIVE' }),
      ])
      setTransactions(toArray(txRes.data))
      setMembers(toArray(memberRes.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openAllocate = (txn) => {
    setAllocateModal(txn)
    setSelectedMember(txn.matched_member || '')
    setNotes('')
  }

  const handleAllocate = async () => {
    if (!selectedMember) return
    setSaving(true)
    try {
      await mpesaAPI.allocate(allocateModal.id, selectedMember, notes)
      setAllocateModal(null)
      fetchAll()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">M-Pesa Review Queue</h1>
        <p className="page-header__sub">Transactions with 70–89% match confidence — confirm or reassign</p>
      </div>

      <div className="alert alert--info">
        <i className="bi bi-info-circle" />
        These transactions have a suggested member match but need human confirmation before posting.
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>M-Pesa Ref</th>
                <th>Sender</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Suggested Match</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="table-empty">
                    <i className="bi bi-inbox" />
                    <p>Review queue is empty. 🎉</p>
                  </div>
                </td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td className="font-semi">{t.mpesa_ref}</td>
                    <td>{t.sender_name || '—'}</td>
                    <td className="text-muted">{t.phone}</td>
                    <td className="kes font-semi">{fmtKES(t.amount)}</td>
                    <td>
                      {t.matched_member_name ? (
                        <span className="badge badge--blue">{t.matched_member_name}</span>
                      ) : (
                        <span className="text-muted text-sm">No suggestion</span>
                      )}
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(t.transaction_date).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td>
                      <button className="btn btn--primary btn--sm" onClick={() => openAllocate(t)}>
                        <i className="bi bi-hand-index" /> Allocate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {allocateModal && (
        <div className="modal-backdrop" onClick={() => setAllocateModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Allocate Transaction</h3>
              <button className="modal__close" onClick={() => setAllocateModal(null)}><i className="bi bi-x" /></button>
            </div>
            <div className="modal__body">
              <div className="mpesa-detail-card mb-16">
                <div className="d-flex justify-between mb-8">
                  <span className="text-muted text-sm">Reference</span>
                  <span className="font-semi">{allocateModal.mpesa_ref}</span>
                </div>
                <div className="d-flex justify-between mb-8">
                  <span className="text-muted text-sm">Amount</span>
                  <span className="font-semi kes">{fmtKES(allocateModal.amount)}</span>
                </div>
                <div className="d-flex justify-between mb-8">
                  <span className="text-muted text-sm">Sender</span>
                  <span>{allocateModal.sender_name || '—'}</span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-muted text-sm">Phone</span>
                  <span>{allocateModal.phone}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label form-label--required">Allocate to Member</label>
                <select className="form-control" value={selectedMember} onChange={e => setSelectedMember(e.target.value)} required>
                  <option value="">Select member</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.member_number} — {m.full_name} ({m.phone})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional allocation notes…" />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setAllocateModal(null)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleAllocate} disabled={!selectedMember || saving}>
                {saving ? <><span className="spinner spinner--sm spinner--white" /> Allocating…</> : 'Confirm Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}