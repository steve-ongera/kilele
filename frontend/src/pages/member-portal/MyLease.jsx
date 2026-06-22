import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { leasesAPI, rentCollectionAPI, toArray } from '../../services/api'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`

export default function MyLease() {
  const { user } = useAuth()
  const [lease, setLease] = useState(null)
  const [rentHistory, setRentHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leaseRes, rentRes] = await Promise.all([
        leasesAPI.list({ tenant: user?.tenant_id }),
        rentCollectionAPI.list({ tenant: user?.tenant_id }),
      ])
      const leases = toArray(leaseRes.data)
      setLease(leases.find(l => l.status === 'ACTIVE') || leases[0])
      setRentHistory(toArray(rentRes.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading-state"><span className="spinner spinner--lg" /><p>Loading lease details…</p></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">My Lease</h1>
        <p className="page-header__sub">Your tenancy details and rent payment history</p>
      </div>

      {!lease ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon"><i className="bi bi-house-heart" /></div>
            <h3 className="empty-state__title">No active lease</h3>
            <p className="empty-state__desc">You don't have an active lease on record.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card mb-24">
            <div className="card__header">
              <h3 className="card__title">Lease Details</h3>
              <span className={`badge status--${lease.status?.toLowerCase()}`}>{lease.status}</span>
            </div>
            <div className="card__body">
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div>
                  <p className="text-xs text-muted">Unit</p>
                  <p className="font-semi">{lease.unit_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Monthly Rent</p>
                  <p className="font-semi kes">{fmtKES(lease.rent_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Lease Start</p>
                  <p className="font-semi">{lease.start_date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Lease End</p>
                  <p className="font-semi">{lease.end_date}</p>
                </div>
              </div>
              <div className="divider" />
              <div className="d-flex justify-between">
                <span className="text-sm text-muted">Deposit Paid</span>
                <span className="font-semi kes">{fmtKES(lease.deposit)}</span>
              </div>
              <div className="d-flex justify-between mt-8">
                <span className="text-sm text-muted">Notice Period</span>
                <span className="font-semi">{lease.notice_period_days} days</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__header"><h3 className="card__title">Rent Payment History</h3></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Period</th><th>Expected</th><th>Paid</th><th>Arrears</th><th>Method</th></tr></thead>
                <tbody>
                  {rentHistory.length === 0 ? (
                    <tr><td colSpan={5}><div className="table-empty"><i className="bi bi-receipt" /><p>No rent payments recorded yet.</p></div></td></tr>
                  ) : (
                    rentHistory
                      .sort((a, b) => b.period_year - a.period_year || b.period_month - a.period_month)
                      .map(r => (
                        <tr key={r.id}>
                          <td className="font-semi">{MONTHS[r.period_month - 1]} {r.period_year}</td>
                          <td className="kes">{fmtKES(r.expected)}</td>
                          <td className="kes amount--positive">{fmtKES(r.paid)}</td>
                          <td className={`kes ${r.arrears > 0 ? 'amount--negative' : ''}`}>{fmtKES(r.arrears)}</td>
                          <td><span className="badge badge--gray">{r.payment_method}</span></td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}