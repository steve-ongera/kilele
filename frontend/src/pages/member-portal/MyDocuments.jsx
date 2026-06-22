import { useState } from 'react'
import { useAuth } from '../../App'
import { reportsAPI } from '../../services/api'

export default function MyDocuments() {
  const { user } = useAuth()
  const [generating, setGenerating] = useState('')

  const documents = [
    { id: 'statement', label: 'Account Statement', icon: 'bi-file-text', desc: 'Full transaction history and balances' },
    { id: 'contributions', label: 'Contribution Summary', icon: 'bi-wallet2', desc: 'Year-to-date contribution records', roles: ['MEMBER'] },
    { id: 'loan-schedule', label: 'Loan Repayment Schedule', icon: 'bi-cash-stack', desc: 'Active loan repayment plan', roles: ['MEMBER'] },
    { id: 'dividend-history', label: 'Dividend History', icon: 'bi-currency-dollar', desc: 'All dividend payments received', roles: ['INVESTOR'] },
    { id: 'lease-agreement', label: 'Lease Agreement', icon: 'bi-house-heart', desc: 'Current lease terms and conditions', roles: ['TENANT'] },
    { id: 'rent-receipts', label: 'Rent Receipts', icon: 'bi-receipt', desc: 'All rent payment receipts', roles: ['TENANT'] },
  ]

  const visibleDocs = documents.filter(d => !d.roles || d.roles.includes(user?.role))

  const handleDownload = async (docId) => {
    setGenerating(docId)
    try {
      // Maps to the appropriate report endpoint; falls back gracefully
      const typeMap = { statement: 'members', contributions: 'contributions', 'loan-schedule': 'loans', 'dividend-history': 'contributions', 'rent-receipts': 'rent-collection' }
      const type = typeMap[docId] || 'members'
      await reportsAPI.downloadCSV(type, {}, `${docId}-${user?.full_name?.replace(/\s+/g, '-')}.csv`)
    } catch {
      // silent
    } finally {
      setGenerating('')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">My Documents</h1>
        <p className="page-header__sub">Download your statements and account documents</p>
      </div>

      <div className="report-grid">
        {visibleDocs.map(doc => (
          <div key={doc.id} className="card report-card">
            <div className="card__body">
              <div className="report-card__icon"><i className={`bi ${doc.icon}`} /></div>
              <h3 className="report-card__title">{doc.label}</h3>
              <p className="report-card__desc">{doc.desc}</p>
              <button
                className="btn btn--secondary btn--sm mt-16"
                onClick={() => handleDownload(doc.id)}
                disabled={generating === doc.id}
              >
                {generating === doc.id ? <span className="spinner spinner--sm" /> : <i className="bi bi-download" />} Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}