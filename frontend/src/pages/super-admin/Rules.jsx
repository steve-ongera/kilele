import { useState, useEffect } from 'react'
import { rulesAPI, branchesAPI, toArray } from '../../services/api'

const RULE_LABELS = {
  CONTRIBUTION_PER_SHARE: 'Contribution per Share',
  CONTRIBUTION_DEADLINE: 'Contribution Deadline',
  INTEREST_RATE: 'Interest Rate (Monthly)',
  LOAN_MULTIPLIER: 'Loan Multiplier',
  REGISTRATION_FEE: 'Registration Fee',
  TABLE_BANKING_DEADLINE: 'Table Banking Deadline',
  EXIT_NOTICE_PERIOD: 'Exit Notice Period (days)',
  MPESA_AUTO_CONFIDENCE: 'M-Pesa Auto-Allocate Confidence (%)',
  MPESA_REVIEW_CONFIDENCE: 'M-Pesa Review Queue Confidence (%)',
  MPESA_EXCEPTION_THRESHOLD: 'M-Pesa Exception Threshold (%)',
}

export default function Rules() {
  const [rules, setRules] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [branchFilter, setBranchFilter] = useState('')
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ruleRes, branchRes] = await Promise.all([
        rulesAPI.list(),
        branchesAPI.list(),
      ])
      setRules(toArray(ruleRes.data))
      setBranches(toArray(branchRes.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (rule) => {
    setEditingKey(rule.id)
    setEditValue(rule.value)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditValue('')
  }

  const saveEdit = async (rule) => {
    setSaving(true)
    try {
      await rulesAPI.update(rule.key, { value: editValue })
      setEditingKey(null)
      fetchAll()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const filtered = branchFilter
    ? rules.filter(r => r.branch === branchFilter)
    : rules

  // Group by branch
  const grouped = filtered.reduce((acc, rule) => {
    const key = rule.branch_name || 'Global'
    if (!acc[key]) acc[key] = []
    acc[key].push(rule)
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Business Rules</h1>
        <p className="page-header__sub">Configure platform behavior without touching code</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 220 }} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div className="alert alert--info">
        <i className="bi bi-info-circle" />
        Changes take effect immediately and apply to new transactions. Each update is versioned and logged in the audit trail.
      </div>

      {loading ? (
        <div className="loading-state"><span className="spinner spinner--lg" /><p>Loading rules…</p></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon"><i className="bi bi-sliders" /></div>
            <h3 className="empty-state__title">No rules configured</h3>
            <p className="empty-state__desc">Business rules will appear here once seeded.</p>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([branchName, branchRules]) => (
          <div key={branchName} className="card mb-24">
            <div className="card__header">
              <h3 className="card__title">{branchName}</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Value</th>
                    <th>Version</th>
                    <th>Effective Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {branchRules.map(rule => (
                    <tr key={rule.id}>
                      <td>
                        <span className="font-semi">{RULE_LABELS[rule.key] || rule.key}</span>
                        {rule.description && <p className="text-muted text-xs">{rule.description}</p>}
                      </td>
                      <td>
                        {editingKey === rule.id ? (
                          <input
                            className="form-control"
                            style={{ maxWidth: 160 }}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <span className="kes font-semi">{rule.value}</span>
                        )}
                      </td>
                      <td><span className="badge badge--gray">v{rule.version}</span></td>
                      <td className="text-muted text-sm">{rule.effective_date}</td>
                      <td>
                        {editingKey === rule.id ? (
                          <div className="d-flex gap-8">
                            <button className="btn btn--primary btn--sm" onClick={() => saveEdit(rule)} disabled={saving}>
                              {saving ? <span className="spinner spinner--sm spinner--white" /> : <i className="bi bi-check" />}
                            </button>
                            <button className="btn btn--ghost btn--sm" onClick={cancelEdit}>
                              <i className="bi bi-x" />
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn--ghost btn--sm" onClick={() => startEdit(rule)}>
                            <i className="bi bi-pencil" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}