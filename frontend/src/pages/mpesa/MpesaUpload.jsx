import { useState, useRef, useEffect } from 'react'
import { mpesaAPI, branchesAPI, toArray } from '../../services/api'

export default function MpesaUpload() {
  const [branches, setBranches] = useState([])
  const [branch, setBranch] = useState('')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    branchesAPI.list().then(res => setBranches(toArray(res.data))).catch(() => { })
  }, [])

  const handleFileSelect = (selected) => {
    if (!selected) return
    if (!selected.name.endsWith('.csv')) {
      setError('Please upload a .csv file.')
      return
    }
    setFile(selected)
    setError('')
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file || !branch) return setError('Please select a branch and a CSV file.')
    setUploading(true)
    setError('')
    try {
      const res = await mpesaAPI.uploadCSV(branch, file)
      setResult(res.data)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please check the file format.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Upload M-Pesa Statement</h1>
        <p className="page-header__sub">Bulk import transactions via CSV for automatic allocation</p>
      </div>

      <div className="upload-layout">
        <div className="card">
          <div className="card__body">
            <div className="form-group">
              <label className="form-label form-label--required">Branch</label>
              <select className="form-control" value={branch} onChange={e => setBranch(e.target.value)}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {error && <div className="alert alert--danger"><i className="bi bi-exclamation-circle" />{error}</div>}

            <div
              className={`dropzone ${dragging ? 'dropzone--active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                hidden
                onChange={e => handleFileSelect(e.target.files[0])}
              />
              {file ? (
                <>
                  <i className="bi bi-file-earmark-spreadsheet dropzone__icon" />
                  <p className="dropzone__filename">{file.name}</p>
                  <p className="text-muted text-sm">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-upload dropzone__icon" />
                  <p className="dropzone__title">Drag & drop your CSV here</p>
                  <p className="text-muted text-sm">or click to browse</p>
                </>
              )}
            </div>

            <button className="btn btn--primary w-full mt-16" onClick={handleUpload} disabled={!file || !branch || uploading}>
              {uploading ? <><span className="spinner spinner--sm spinner--white" /> Processing…</> : <><i className="bi bi-cloud-upload" /> Upload & Process</>}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card__header"><h3 className="card__title">CSV Format</h3></div>
          <div className="card__body">
            <p className="text-sm text-secondary mb-16">Your CSV should include these columns:</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Column</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr><td className="font-semi">receipt</td><td className="text-muted">M-Pesa receipt number</td></tr>
                  <tr><td className="font-semi">phone</td><td className="text-muted">Sender's phone number</td></tr>
                  <tr><td className="font-semi">amount</td><td className="text-muted">Transaction amount</td></tr>
                  <tr><td className="font-semi">sender</td><td className="text-muted">Sender's name</td></tr>
                  <tr><td className="font-semi">account_ref</td><td className="text-muted">Account reference / member number</td></tr>
                </tbody>
              </table>
            </div>
            <p className="form-hint mt-16">Duplicate receipt numbers are automatically skipped.</p>
          </div>
        </div>
      </div>

      {result && (
        <div className="card mt-24">
          <div className="card__header"><h3 className="card__title">Upload Results</h3></div>
          <div className="card__body">
            <div className="kpi-grid">
              <div className="kpi-card kpi-card--green">
                <div className="kpi-card__icon"><i className="bi bi-check-circle" /></div>
                <p className="kpi-card__label">Created</p>
                <p className="kpi-card__value">{result.created}</p>
              </div>
              <div className="kpi-card kpi-card--orange">
                <div className="kpi-card__icon"><i className="bi bi-skip-forward" /></div>
                <p className="kpi-card__label">Skipped (duplicates)</p>
                <p className="kpi-card__value">{result.skipped}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}