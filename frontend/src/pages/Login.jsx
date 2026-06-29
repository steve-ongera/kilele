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
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          padding: 20px;
        }

        .login-panel {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
          padding: 48px 40px;
          transition: all 0.3s ease;
        }

        @media (max-width: 480px) {
          .login-panel {
            padding: 32px 24px;
          }
        }

        /* Brand */
        .login-brand-centered {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 36px;
        }

        .login-brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .login-brand-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .login-brand-name {
          font-size: 20px;
          font-weight: 600;
          color: #1a3a5c;
          letter-spacing: -0.3px;
        }

        /* Form Header */
        .login-form-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .login-form-title {
          font-size: 26px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .login-form-sub {
          font-size: 15px;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .login-form-sub strong {
          color: #1a3a5c;
          font-weight: 600;
        }

        /* Back Button */
        .login-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #6b7280;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 0;
          transition: color 0.2s;
          font-weight: 500;
        }

        .login-back-btn:hover {
          color: #1a3a5c;
        }

        .login-back-btn i {
          font-size: 16px;
        }

        /* Form Elements */
        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 6px;
        }

        .form-label--required::after {
          content: ' *';
          color: #ef4444;
        }

        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input-wrap i {
          position: absolute;
          left: 14px;
          color: #9ca3af;
          font-size: 18px;
          pointer-events: none;
        }

        .form-control {
          width: 100%;
          padding: 12px 14px 12px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.2s;
          background: #fafbfc;
          color: #1f2937;
          outline: none;
          font-family: inherit;
        }

        .form-control:focus {
          border-color: #1a3a5c;
          background: white;
          box-shadow: 0 0 0 3px rgba(26, 58, 92, 0.1);
        }

        .form-control::placeholder {
          color: #9ca3af;
        }

        /* Button */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          text-decoration: none;
        }

        .btn--primary {
          background: linear-gradient(135deg, #1a3a5c 0%, #2a5a7c 100%);
          color: white;
          width: 100%;
        }

        .btn--primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26, 58, 92, 0.3);
        }

        .btn--primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn--primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .w-full {
          width: 100%;
        }

        /* Alert */
        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 20px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert i {
          font-size: 18px;
          flex-shrink: 0;
        }

        .alert--danger {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        /* OTP Inputs */
        .otp-group {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 8px 0 4px;
        }

        .otp-input {
          width: 48px;
          height: 56px;
          text-align: center;
          font-size: 22px;
          font-weight: 600;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          background: #fafbfc;
          transition: all 0.2s;
          outline: none;
          font-family: inherit;
          color: #1f2937;
        }

        .otp-input:focus {
          border-color: #1a3a5c;
          background: white;
          box-shadow: 0 0 0 3px rgba(26, 58, 92, 0.1);
        }

        .otp-input--error {
          border-color: #dc2626;
        }

        .otp-input--error:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .otp-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .otp-input {
            width: 40px;
            height: 48px;
            font-size: 18px;
          }
          .otp-group {
            gap: 6px;
          }
        }

        /* Resend */
        .otp-resend {
          text-align: center;
          margin-top: 20px;
        }

        .otp-resend-btn {
          background: none;
          border: none;
          color: #1a3a5c;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }

        .otp-resend-btn:hover {
          color: #2a5a7c;
          text-decoration: underline;
        }

        .text-muted {
          color: #6b7280;
        }

        .text-sm {
          font-size: 14px;
        }

        /* Footer */
        .login-footer-note {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #f3f4f6;
        }

        /* Spinner */
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          flex-shrink: 0;
        }

        .spinner--sm {
          width: 14px;
          height: 14px;
          border-width: 2px;
        }

        .spinner--white {
          border-color: rgba(255, 255, 255, 0.3);
          border-top-color: white;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Bootstrap Icons placeholder (if you don't use Bootstrap Icons) */
        .bi {
          font-style: normal;
          font-weight: normal;
          display: inline-block;
        }

        .bi-envelope::before { content: "✉"; }
        .bi-arrow-left::before { content: "←"; }
        .bi-arrow-clockwise::before { content: "⟳"; }
        .bi-exclamation-circle::before { content: "⚠"; }
      `}</style>

      <div className="login-page">
        <div className="login-panel">
          <div className="login-form-wrap">
            {/* Brand title at top with logo */}
            <div className="login-brand-centered">
              <div className="login-brand-icon">
                <img src="/assets/kilele_logo.png" alt="Kilele Ridge Group logo" />
              </div>
              <span className="login-brand-name">Kilele Ridge Group</span>
            </div>

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
    </>
  )
}