import { useState, useEffect } from 'react'
import { rentCollectionAPI, tenantsAPI, toArray } from '../../services/api'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function RentCollection() {
  const [collections, setCollections] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ tenant: '', unit: '', expected: '', paid: 0, payment_method: 'MPESA', mpesa_ref: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchTenants() }, [])
  useEffect(() => { fetchCollections() }, [year, month])

  const fetchTenants = async () => {
    try {
      const res = await tenantsAPI.list({ status: 'ACTIVE' })
      setTenants(toArray(res.data))
    } catch { }
  }

  const fetchCollections = async () => {
    setLoading(true)
    try {
      const res = await rentCollectionAPI.list({ year, month })
      setCollections(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ tenant: '', unit: '', expected: '', paid: 0, payment_method: 'MPESA', mpesa_ref: '' })
    setError('')
    setModalOpen(true)
  }

  const handleTenantChange = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId)
    setForm({ ...form, tenant: tenantId, unit: tenant?.unit || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.tenant || !form.unit || !form.expected) return setError('Tenant, unit and expected amount are required.')
    setSaving(true)
    try {
      await rentCollectionAPI.create({ ...form, period_year: year, period_month: month })
      setModalOpen(false)
      fetchCollections()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record rent collection.')
    } finally {
      setSaving(false)
    }
  }

  const totals = collections.reduce((acc, c) => ({
    expected: acc.expected + Number(c.expected || 0),
    paid: acc.paid + Number(c.paid || 0),
    arrears: acc.arrears + Number(c.arrears || 0),
  }), { expected: 0, paid: 0, arrears: 0 })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Rent Collection</h1>
        <p className="page-header__sub">Monthly rent billing and payment tracking</p>
        <div className="page-header__actions">
          <select className="form-control" style={{ maxWidth: 120 }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-control" style={{ maxWidth: 160 }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <button className="btn btn--primary" onClick={openCreate}>
            <i className="bi bi-receipt" /> Record Payment
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__icon"><i className="bi bi-receipt" /></div>
          <p className="kpi-card__label">Expected Rent</p>
          <p className="kpi-card__value">{fmtKES(totals.expected)}</p>
        </div>
        <div className="kpi-card kpi-card--green">
          <div className="kpi-card__icon"><i className="bi bi-check-circle" /></div>
          <p className="kpi-card__label">Collected</p>
          <p className="kpi-card__value">{fmtKES(totals.paid)}</p>
        </div>
        <div className="kpi-card kpi-card--red">
          <div className="kpi-card__icon"><i className="bi bi-exclamation-triangle" /></div>
          <p className="kpi-card__label">Arrears</p>
          <p className="kpi-card__value">{fmtKES(totals.arrears)}</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Unit</th>
                <th>Period</th>
                <th>Expected</th>
                <th>Paid</th>
                <th>Arrears</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-state"><span className="spinner" /></div></td></tr>
              ) : collections.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty"><i className="bi bi-receipt" /><p>No rent collections for this period.</p></div></td></tr>
              ) : (
                collections.map(c => (
                  <tr key={c.id}>
                    <td className="font-semi">{c.tenant_name}</td>
                    <td>{c.unit_number}</td>
                    <td>{MONTHS[c.period_month - 1]} {c.period_year}</td>
                    <td className="kes">{fmtKES(c.expected)}</td>
                    <td className="kes amount--positive">{fmtKES(c.paid)}</td>
                    <td className={`kes ${c.arrears > 0 ? 'amount--negative' : ''}`}>{fmtKES(c.arrears)}</td>
                    <td><span className="badge badge--gray">{c.payment_method}</span></td>
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
              <h3 className="modal__title">Record Rent Payment</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}><i className="bi bi-x" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}
                <div className="form-group">
                  <label className="form-label form-label--required">Tenant</label>
                  <select className="form-control" value={form.tenant} onChange={e => handleTenantChange(e.target.value)} required>
                    <option value="">Select tenant</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.tenant_number} — {t.full_name} ({t.unit_number})</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label form-label--required">Expected Rent</label>
                    <input type="number" className="form-control" value={form.expected} onChange={e => setForm({ ...form, expected: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount Paid</label>
                    <input type="number" className="form-control" value={form.paid} onChange={e => setForm({ ...form, paid: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-control" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                      <option value="MPESA">M-Pesa</option>
                      <option value="BANK">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">M-Pesa Reference</label>
                    <input className="form-control" value={form.mpesa_ref} onChange={e => setForm({ ...form, mpesa_ref: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner--sm spinner--white" /> Saving…</> : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}