import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../App'
import { authAPI } from '../services/api'

const STEP = { EMAIL: 'EMAIL', OTP: 'OTP' }

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [step, setStep]       = useState(STEP.EMAIL)
  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef([])
  const timerRef = useRef(null)

  // Already logged in
  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user])

  // Resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(t => t - 1), 1000)
    }
    return () => clearTimeout(timerRef.current)
  }, [resendTimer])

  /* ── Step 1: request OTP ── */
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Please enter your email address.')
    setLoading(true)
    try {
      await authAPI.requestOTP(email.trim().toLowerCase())
      setStep(STEP.OTP)
      setResendTimer(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── OTP input handling ── */
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    setError('')
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) {
      handleOtpSubmit(next.join(''))
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setOtp(next)
      otpRefs.current[5]?.focus()
      handleOtpSubmit(pasted)
    }
  }

  /* ── Step 2: verify OTP ── */
  const handleOtpSubmit = async (code) => {
    const token = code || otp.join('')
    if (token.length < 6) return setError('Please enter the full 6-digit code.')
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.verifyOTP(email, token)
      login(res.data.user, res.data.access, res.data.refresh)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setError('')
    setOtp(['', '', '', '', '', ''])
    try {
      await authAPI.requestOTP(email)
      setResendTimer(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch {
      setError('Failed to resend. Please try again.')
    }
  }

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-panel login-panel--left">
        <div className="login-panel__brand">
          <div className="login-brand-icon">KR</div>
          <span className="login-brand-name">Kilele Ridge Group</span>
        </div>
        <div className="login-panel__hero">
          <h1 className="login-hero__title">
            One platform.<br />Every business unit.
          </h1>
          <p className="login-hero__sub">
            Manage Tujijenge savings, Wealth Alliance investments, Table Banking,
            and Rentals — all from a single secure dashboard.
          </p>
          <div className="login-features">
            {[
              { icon: 'bi-shield-lock', label: 'OTP-secured login' },
              { icon: 'bi-phone',       label: 'M-Pesa auto-allocation' },
              { icon: 'bi-graph-up',    label: 'Real-time KPI dashboards' },
              { icon: 'bi-people',      label: 'Role-based access control' },
            ].map(f => (
              <div key={f.label} className="login-feature">
                <i className={`bi ${f.icon}`} />
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-panel login-panel--right">
        <div className="login-form-wrap">

          {step === STEP.EMAIL ? (
            <>
              <div className="login-form-header">
                <h2 className="login-form-title">Welcome back</h2>
                <p className="login-form-sub">Enter your email to receive a login code.</p>
              </div>

              {error && (
                <div className="alert alert--danger">
                  <i className="bi bi-exclamation-circle" />
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label form-label--required">Email address</label>
                  <div className="search-input-wrap">
                    <i className="bi bi-envelope" />
                    <input
                      type="email"
                      className="form-control"
                      placeholder="you@kileleridge.co.ke"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      autoFocus
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn--primary w-full"
                  disabled={loading}
                  style={{ marginTop: 8 }}
                >
                  {loading ? <><span className="spinner spinner--sm spinner--white" /> Sending…</> : 'Send login code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="login-form-header">
                <button
                  className="login-back-btn"
                  onClick={() => { setStep(STEP.EMAIL); setError(''); setOtp(['','','','','','']) }}
                >
                  <i className="bi bi-arrow-left" /> Back
                </button>
                <h2 className="login-form-title" style={{ marginTop: 12 }}>Check your email</h2>
                <p className="login-form-sub">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              {error && (
                <div className="alert alert--danger">
                  <i className="bi bi-exclamation-circle" />
                  {error}
                </div>
              )}

              <div className="otp-group" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-input ${error ? 'otp-input--error' : ''}`}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    disabled={loading}
                  />
                ))}
              </div>

              <button
                className="btn btn--primary w-full"
                disabled={loading || otp.some(d => !d)}
                onClick={() => handleOtpSubmit()}
                style={{ marginTop: 24 }}
              >
                {loading ? <><span className="spinner spinner--sm spinner--white" /> Verifying…</> : 'Verify & sign in'}
              </button>

              <div className="otp-resend">
                {resendTimer > 0 ? (
                  <span className="text-muted text-sm">Resend code in {resendTimer}s</span>
                ) : (
                  <button className="otp-resend-btn" onClick={handleResend}>
                    <i className="bi bi-arrow-clockwise" /> Resend code
                  </button>
                )}
              </div>
            </>
          )}

          <p className="login-footer-note">
            Having trouble? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  )
}