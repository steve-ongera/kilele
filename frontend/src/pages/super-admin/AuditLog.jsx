import { useState, useEffect } from 'react'
import { auditAPI, toArray } from '../../services/api'

const ACTION_ICON = {
  LOGIN: 'bi-box-arrow-in-right',
  LOGOUT: 'bi-box-arrow-right',
  CREATE_MEMBER: 'bi-person-plus',
  CREATE_LOAN: 'bi-cash-stack',
  APPROVE_LOAN: 'bi-check-circle',
  DISBURSE_LOAN: 'bi-send',
  WAIVE_PENALTY: 'bi-shield-x',
  UPDATE_RULE: 'bi-sliders',
  CREATE_BRANCH: 'bi-diagram-3',
  UPDATE_BRANCH: 'bi-pencil',
  CREATE_INVESTOR: 'bi-person-badge',
  MANUAL_ALLOCATE_MPESA: 'bi-hand-index',
  APPROVE_REQUEST: 'bi-check2-square',
  REJECT_REQUEST: 'bi-x-square',
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', model: '', date_from: '', date_to: '' })
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async (params = {}) => {
    setLoading(true)
    try {
      const res = await auditAPI.list(params)
      setLogs(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (e) => {
    e.preventDefault()
    fetchLogs(filters)
  }

  const clearFilters = () => {
    setFilters({ action: '', model: '', date_from: '', date_to: '' })
    fetchLogs({})
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Audit Log</h1>
        <p className="page-header__sub">Complete trail of system actions — read-only</p>
      </div>

      {/* Filters */}
      <div className="card mb-24">
        <div className="card__body">
          <form onSubmit={applyFilters} className="form-row" style={{ alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Action</label>
              <input
                className="form-control"
                placeholder="e.g. CREATE_LOAN"
                value={filters.action}
                onChange={e => setFilters({ ...filters, action: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Model</label>
              <input
                className="form-control"
                placeholder="e.g. Loan"
                value={filters.model}
                onChange={e => setFilters({ ...filters, model: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-control"
                value={filters.date_from}
                onChange={e => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-control"
                value={filters.date_to}
                onChange={e => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
            <div className="d-flex gap-8">
              <button type="submit" className="btn btn--primary"><i className="bi bi-funnel" /> Filter</button>
              <button type="button" className="btn btn--ghost" onClick={clearFilters}>Clear</button>
            </div>
          </form>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        {loading ? (
          <div className="loading-state"><span className="spinner spinner--lg" /><p>Loading audit trail…</p></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><i className="bi bi-shield-check" /></div>
            <h3 className="empty-state__title">No audit entries found</h3>
            <p className="empty-state__desc">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="audit-timeline">
            {logs.map(log => (
              <div key={log.id} className="audit-entry" onClick={() => setSelected(log)}>
                <div className="audit-entry__icon">
                  <i className={`bi ${ACTION_ICON[log.action] || 'bi-dot'}`} />
                </div>
                <div className="audit-entry__body">
                  <div className="audit-entry__top">
                    <span className="audit-entry__action">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-muted text-xs">
                      {new Date(log.timestamp).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="audit-entry__meta">
                    <strong>{log.user_name || 'System'}</strong>
                    {log.role && <span className="badge badge--gray text-xs" style={{ marginLeft: 6 }}>{log.role.replace('_', ' ')}</span>}
                    {log.model_name && <span> · {log.model_name}</span>}
                    {log.branch_name && <span> · {log.branch_name}</span>}
                  </p>
                  {log.ip_address && (
                    <p className="text-muted text-xs">IP: {log.ip_address}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{selected.action.replace(/_/g, ' ')}</h3>
              <button className="modal__close" onClick={() => setSelected(null)}><i className="bi bi-x" /></button>
            </div>
            <div className="modal__body">
              <div className="form-row mb-16">
                <div>
                  <p className="text-xs text-muted">User</p>
                  <p className="font-semi">{selected.user_name || 'System'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Timestamp</p>
                  <p className="font-semi">{new Date(selected.timestamp).toLocaleString('en-KE')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Model</p>
                  <p className="font-semi">{selected.model_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">IP Address</p>
                  <p className="font-semi">{selected.ip_address || '—'}</p>
                </div>
              </div>
              {selected.old_value && (
                <div className="mb-16">
                  <p className="text-xs text-muted mb-8">Before</p>
                  <pre className="audit-json">{JSON.stringify(selected.old_value, null, 2)}</pre>
                </div>
              )}
              {selected.new_value && (
                <div>
                  <p className="text-xs text-muted mb-8">After</p>
                  <pre className="audit-json">{JSON.stringify(selected.new_value, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}