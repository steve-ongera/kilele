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
  const [loanProducts, setLoanProducts] = useState([])
  const [hasMemberProfile, setHasMemberProfile] = useState(false)

  const [loanForm, setLoanForm] = useState({ product: '', principal: '', notes: '' })
  const [withdrawalForm, setWithdrawalForm] = useState({ withdrawal_type: 'DIVIDEND', amount_requested: '', notes: '' })
  const [maintenanceForm, setMaintenanceForm] = useState({ title: '', description: '' })

  useEffect(() => { 
    console.log('=== MyRequests Component Mounted ===')
    console.log('User object:', user)
    console.log('User role:', role)
    console.log('User member_id:', user?.member_id)
    
    // Check if user has required profiles
    if (role === 'MEMBER' && !user?.member_id) {
      console.error('User is a MEMBER but has no member_id!')
      setError('Your account is not fully set up. Please contact an administrator.')
    } else if (role === 'MEMBER' && user?.member_id) {
      setHasMemberProfile(true)
    }
    
    fetchRequests()
    if (role === 'MEMBER' && user?.member_id) {
      fetchLoanProducts()
    }
  }, [user])

  const fetchLoanProducts = async () => {
    if (!user?.member_id) {
      console.warn('Cannot fetch loan products: No member_id')
      return
    }
    
    try {
      console.log('=== Fetching Loan Products ===')
      console.log('User:', user)
      console.log('Member ID:', user?.member_id)
      
      const res = await loansAPI.products.list({})
      console.log('API Response status:', res.status)
      console.log('API Response data:', res.data)
      
      const products = toArray(res.data)
      console.log('Processed products:', products)
      console.log('Number of products:', products.length)
      console.log('Product IDs:', products.map(p => ({ id: p.id, name: p.name })))
      
      setLoanProducts(products)
      
      if (products.length === 0) {
        console.warn('No loan products found for this member!')
        setError('No loan products available for your branch. Please contact an administrator.')
      }
    } catch (error) {
      console.error('Error fetching loan products:', error)
      console.error('Error response:', error.response)
      console.error('Error status:', error.response?.status)
      console.error('Error data:', error.response?.data)
      setError('Failed to load loan products. Please try again later.')
    }
  }

  const fetchRequests = async () => {
    setLoading(true)
    try {
      let data = []
      if (role === 'MEMBER' && user?.member_id) {
        console.log('Fetching loans for member:', user.member_id)
        const res = await loansAPI.list({ member: user.member_id })
        console.log('Loans response:', res.data)
        data = toArray(res.data).map(l => ({ ...l, _type: 'Loan', _label: l.loan_number, _status: l.approval_status }))
      } else if (role === 'INVESTOR' && user?.investor_id) {
        console.log('Fetching withdrawals for investor:', user.investor_id)
        const res = await investorWithdrawalsAPI.list({})
        data = toArray(res.data).filter(w => w.investor === user.investor_id).map(w => ({ ...w, _type: 'Withdrawal', _label: w.withdrawal_type, _status: w.status }))
      } else if (role === 'TENANT' && user?.tenant_id) {
        console.log('Fetching maintenance for tenant:', user.tenant_id)
        const res = await maintenanceAPI.list({})
        data = toArray(res.data).map(m => ({ ...m, _type: 'Maintenance', _label: m.title, _status: m.status }))
      } else {
        console.warn(`No valid profile for role: ${role}`, user)
      }
      setRequests(data)
    } catch (error) {
      console.error('Error fetching requests:', error)
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
        if (!user?.member_id) {
          throw new Error('No member profile found. Please contact an administrator.')
        }
        if (!loanForm.product) {
          throw new Error('Please select a loan product.')
        }
        if (!loanForm.principal || parseFloat(loanForm.principal) <= 0) {
          throw new Error('Please enter a valid loan amount.')
        }
        
        const loanData = { 
          member: user.member_id,
          product: loanForm.product,
          principal: parseFloat(loanForm.principal),
          notes: loanForm.notes || ''
        }
        
        console.log('=== Submitting Loan Request ===')
        console.log('User:', user)
        console.log('Member ID:', user.member_id)
        console.log('Loan Data being sent:', JSON.stringify(loanData, null, 2))
        
        const response = await loansAPI.create(loanData)
        console.log('Response:', response)
        console.log('Response data:', response.data)
        
      } else if (role === 'INVESTOR') {
        if (!user?.investor_id) {
          throw new Error('No investor profile found. Please contact an administrator.')
        }
        if (!withdrawalForm.amount_requested || parseFloat(withdrawalForm.amount_requested) <= 0) {
          throw new Error('Please enter a valid amount.')
        }
        
        const withdrawalData = { 
          investor: user.investor_id, 
          branch: user?.branch, 
          withdrawal_type: withdrawalForm.withdrawal_type,
          amount_requested: parseFloat(withdrawalForm.amount_requested),
          notes: withdrawalForm.notes || ''
        }
        
        console.log('=== Submitting Withdrawal Request ===')
        console.log('Withdrawal Data:', JSON.stringify(withdrawalData, null, 2))
        
        await investorWithdrawalsAPI.create(withdrawalData)
        
      } else if (role === 'TENANT') {
        if (!user?.tenant_id) {
          throw new Error('No tenant profile found. Please contact an administrator.')
        }
        if (!maintenanceForm.title) {
          throw new Error('Please enter a title for the maintenance request.')
        }
        
        const maintenanceData = { 
          unit: user?.unit_id, 
          tenant: user.tenant_id, 
          title: maintenanceForm.title,
          description: maintenanceForm.description || ''
        }
        
        console.log('=== Submitting Maintenance Request ===')
        console.log('Maintenance Data:', JSON.stringify(maintenanceData, null, 2))
        
        await maintenanceAPI.create(maintenanceData)
      }
      
      setModalOpen(false)
      // Reset forms
      setLoanForm({ product: '', principal: '', notes: '' })
      setWithdrawalForm({ withdrawal_type: 'DIVIDEND', amount_requested: '', notes: '' })
      setMaintenanceForm({ title: '', description: '' })
      await fetchRequests()
      
    } catch (err) {
      console.error('Submit error:', err)
      console.error('Error response:', err.response)
      console.error('Error response data:', err.response?.data)
      console.error('Error status:', err.response?.status)
      
      // Extract error message
      let errorMessage = err.message || 'Failed to submit request.'
      
      if (err.response?.data) {
        // Handle DRF validation errors
        if (typeof err.response.data === 'object') {
          const errors = []
          for (const [key, value] of Object.entries(err.response.data)) {
            if (Array.isArray(value)) {
              errors.push(`${key}: ${value.join(', ')}`)
            } else if (typeof value === 'string') {
              errors.push(`${key}: ${value}`)
            } else if (typeof value === 'object' && value !== null) {
              errors.push(`${key}: ${JSON.stringify(value)}`)
            }
          }
          if (errors.length > 0) {
            errorMessage = errors.join('; ')
          } else {
            errorMessage = err.response.data.detail || JSON.stringify(err.response.data)
          }
        } else {
          errorMessage = err.response.data || errorMessage
        }
      }
      
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const titleMap = { MEMBER: 'Loan Request', INVESTOR: 'Withdrawal Request', TENANT: 'Maintenance Request' }

  // Check if user can submit requests
  const canSubmit = () => {
    if (role === 'MEMBER') return !!user?.member_id
    if (role === 'INVESTOR') return !!user?.investor_id
    if (role === 'TENANT') return !!user?.tenant_id
    return false
  }

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
          <button 
            className="btn btn--primary" 
            onClick={() => { setError(''); setModalOpen(true) }}
            disabled={!canSubmit()}
            title={!canSubmit() ? 'Your account is not fully set up' : ''}
          >
            <i className="bi bi-plus-lg" /> New {titleMap[role]}
          </button>
        </div>
      </div>

      {!canSubmit() && role === 'MEMBER' && (
        <div className="alert alert--warning" style={{ marginBottom: '1.5rem' }}>
          <i className="bi bi-exclamation-triangle" />
          Your account is not fully set up. You need a member profile to request loans. 
          Please contact an administrator.
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={5}><div className="table-empty"><i className="bi bi-send" /><p>No requests submitted yet.</p></div></td></tr>
              ) : (
                requests.map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="font-semi">{r._label || r.loan_number || r.title || 'N/A'}</td>
                    <td><span className="badge badge--gray">{r._type}</span></td>
                    <td><span className={`badge status--${r._status?.toLowerCase() || 'pending'}`}>
                      {r._status?.replace(/_/g, ' ') || 'Pending'}
                    </span></td>
                    <td>${parseFloat(r.principal || r.amount_requested || r.amount || 0).toFixed(2)}</td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
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
                {error && (
                  <div className="alert alert--danger">
                    <i className="bi bi-exclamation-circle" />
                    <div>
                      <strong>Error:</strong> {error}
                    </div>
                  </div>
                )}

                {role === 'MEMBER' && (
                  <>
                    {!user?.member_id && (
                      <div className="alert alert--warning">
                        <i className="bi bi-exclamation-triangle" />
                        No member profile found. Please contact an administrator.
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label form-label--required">Loan Product</label>
                      <select 
                        className="form-control" 
                        value={loanForm.product} 
                        onChange={e => setLoanForm({ ...loanForm, product: e.target.value })} 
                        required
                        disabled={!user?.member_id || loanProducts.length === 0}
                      >
                        <option value="">Select a loan product...</option>
                        {loanProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.duration_months} months @ {p.interest_rate}%)
                          </option>
                        ))}
                      </select>
                      {loanProducts.length === 0 && user?.member_id && (
                        <small className="form-help" style={{ color: 'var(--color-warning)' }}>
                          <i className="bi bi-info-circle" /> No loan products available for your branch.
                        </small>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label form-label--required">Amount Requested ($)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="Enter amount"
                        min="1"
                        step="0.01"
                        value={loanForm.principal} 
                        onChange={e => setLoanForm({ ...loanForm, principal: e.target.value })} 
                        required
                        disabled={!user?.member_id}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reason / Notes</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        placeholder="Optional reason for the loan"
                        value={loanForm.notes} 
                        onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })} 
                      />
                    </div>
                  </>
                )}

                {role === 'INVESTOR' && (
                  <>
                    {!user?.investor_id && (
                      <div className="alert alert--warning">
                        <i className="bi bi-exclamation-triangle" />
                        No investor profile found. Please contact an administrator.
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Withdrawal Type</label>
                      <select 
                        className="form-control" 
                        value={withdrawalForm.withdrawal_type} 
                        onChange={e => setWithdrawalForm({ ...withdrawalForm, withdrawal_type: e.target.value })}
                        disabled={!user?.investor_id}
                      >
                        <option value="DIVIDEND">Dividend</option>
                        <option value="PARTIAL_CAPITAL">Partial Capital</option>
                        <option value="FULL_EXIT">Full Exit</option>
                        <option value="EMERGENCY">Emergency</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label form-label--required">Amount Requested ($)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="Enter amount"
                        min="1"
                        step="0.01"
                        value={withdrawalForm.amount_requested} 
                        onChange={e => setWithdrawalForm({ ...withdrawalForm, amount_requested: e.target.value })} 
                        required
                        disabled={!user?.investor_id}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notes</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        placeholder="Optional notes"
                        value={withdrawalForm.notes} 
                        onChange={e => setWithdrawalForm({ ...withdrawalForm, notes: e.target.value })} 
                      />
                    </div>
                  </>
                )}

                {role === 'TENANT' && (
                  <>
                    {!user?.tenant_id && (
                      <div className="alert alert--warning">
                        <i className="bi bi-exclamation-triangle" />
                        No tenant profile found. Please contact an administrator.
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label form-label--required">Issue Title</label>
                      <input 
                        className="form-control" 
                        placeholder="e.g. Leaking tap, Broken window"
                        value={maintenanceForm.title} 
                        onChange={e => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })} 
                        required
                        disabled={!user?.tenant_id}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        placeholder="Describe the issue in detail"
                        value={maintenanceForm.description} 
                        onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} 
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn--primary" 
                  disabled={saving || !canSubmit()}
                >
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