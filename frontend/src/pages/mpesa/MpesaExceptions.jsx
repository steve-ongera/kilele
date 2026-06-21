import { useState, useEffect } from 'react'
import { mpesaAPI, membersAPI, toArray } from '../../services/api'

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function MpesaExceptions() {
  const [transactions, setTransactions] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [allocateModal, setAllocateModal] = useState(null)
  const [selectedMember, setSelectedMember] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [txRes, memberRes] = await Promise.all([
        mpesaAPI.exceptions(),
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
    setSelectedMember('')
    setMemberSearch('')
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

  const filteredTx = transactions.filter(t =>
    t.mpesa_ref?.toLowerCase().includes(search.toLowerCase()) ||
    t.phone?.includes(search) ||
    t.sender_name?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredMembers = members.filter(m =>
    m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.member_number?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone?.includes(memberSearch)
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">M-Pesa Exceptions</h1>
        <p className="page-header__sub">Transactions below 70% confidence — manual review required</p>
        <div className="page-header__actions">
          <div className="search-input-wrap" style={{ maxWidth: 280 }}>
            <i className="bi bi-search" />
            <input className="form-control" placeholder="Search ref, phone, sender…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="alert alert--warning">
        <i className="bi bi-exclamation-triangle" />
        These transactions could not be confidently matched to any member. Manual identification required.
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>M-Pesa Ref</th>
                <th>Sender</th>
                <th>Phone</th>
                <th>Account Ref</th>
                <th>Amount</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : filteredTx.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="table-empty">
                    <i className="bi bi-check2-circle" />
                    <p>No exceptions found. Clean queue!</p>
                  </div>
                </td></tr>
              ) : (
                filteredTx.map(t => (
                  <tr key={t.id}>
                    <td className="font-semi">{t.mpesa_ref}</td>
                    <td>{t.sender_name || '—'}</td>
                    <td className="text-muted">{t.phone}</td>
                    <td className="text-muted">{t.account_ref || '—'}</td>
                    <td className="kes font-semi">{fmtKES(t.amount)}</td>
                    <td className="text-muted text-sm">
                      {new Date(t.transaction_date).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td>
                      <button className="btn btn--primary btn--sm" onClick={() => openAllocate(t)}>
                        <i className="bi bi-search" /> Identify
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
              <h3 className="modal__title">Identify Transaction</h3>
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
                  <span className="text-muted text-sm">Phone / Account Ref</span>
                  <span>{allocateModal.phone} · {allocateModal.account_ref || '—'}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label form-label--required">Search Member</label>
                <div className="search-input-wrap">
                  <i className="bi bi-search" />
                  <input className="form-control" placeholder="Name, number, or phone…" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} autoFocus />
                </div>
              </div>

              <div className="member-pick-list">
                {filteredMembers.slice(0, 8).map(m => (
                  <div
                    key={m.id}
                    className={`member-pick-item ${selectedMember === m.id ? 'member-pick-item--selected' : ''}`}
                    onClick={() => setSelectedMember(m.id)}
                  >
                    <div>
                      <p className="font-semi">{m.full_name}</p>
                      <p className="text-muted text-xs">{m.member_number} · {m.phone}</p>
                    </div>
                    {selectedMember === m.id && <i className="bi bi-check-circle-fill text-blue" />}
                  </div>
                ))}
                {memberSearch && filteredMembers.length === 0 && (
                  <p className="text-muted text-sm" style={{ padding: '12px 0' }}>No members match your search.</p>
                )}
              </div>

              <div className="form-group mt-16">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Why this member was identified…" />
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