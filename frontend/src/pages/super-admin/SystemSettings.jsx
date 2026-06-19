import { useState } from 'react'

const TABS = [
  { key: 'general', label: 'General', icon: 'bi-gear' },
  { key: 'branding', label: 'Branding', icon: 'bi-palette' },
  { key: 'notifications', label: 'Notifications', icon: 'bi-bell' },
  { key: 'security', label: 'Security', icon: 'bi-shield-lock' },
]

export default function SystemSettings() {
  const [tab, setTab] = useState('general')
  const [saved, setSaved] = useState(false)

  const [general, setGeneral] = useState({
    platform_name: 'Kilele Ridge Group',
    support_email: 'support@kileleridge.co.ke',
    timezone: 'Africa/Nairobi',
    currency: 'KES',
  })

  const [branding, setBranding] = useState({
    primary_color: '#2563eb',
    company_tagline: 'One platform. Every business unit.',
  })

  const [notifSettings, setNotifSettings] = useState({
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    otp_expiry_minutes: 10,
  })

  const [security, setSecurity] = useState({
    jwt_expiry_hours: 24,
    max_login_attempts: 5,
    require_otp: true,
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">System Settings</h1>
        <p className="page-header__sub">Global platform configuration</p>
      </div>

      {saved && (
        <div className="alert alert--success">
          <i className="bi bi-check-circle" /> Settings saved successfully.
        </div>
      )}

      <div className="settings-layout">
        {/* Tabs */}
        <div className="settings-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`settings-tab ${tab === t.key ? 'settings-tab--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <i className={`bi ${t.icon}`} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="card settings-panel">
          <div className="card__body">

            {tab === 'general' && (
              <>
                <h3 className="settings-section-title">General Settings</h3>
                <div className="form-group">
                  <label className="form-label">Platform Name</label>
                  <input
                    className="form-control"
                    value={general.platform_name}
                    onChange={e => setGeneral({ ...general, platform_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Support Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={general.support_email}
                    onChange={e => setGeneral({ ...general, support_email: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select
                      className="form-control"
                      value={general.timezone}
                      onChange={e => setGeneral({ ...general, timezone: e.target.value })}
                    >
                      <option value="Africa/Nairobi">Africa/Nairobi</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select
                      className="form-control"
                      value={general.currency}
                      onChange={e => setGeneral({ ...general, currency: e.target.value })}
                    >
                      <option value="KES">KES — Kenyan Shilling</option>
                      <option value="USD">USD — US Dollar</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {tab === 'branding' && (
              <>
                <h3 className="settings-section-title">Branding</h3>
                <div className="form-group">
                  <label className="form-label">Primary Color</label>
                  <div className="d-flex align-center gap-12">
                    <input
                      type="color"
                      value={branding.primary_color}
                      onChange={e => setBranding({ ...branding, primary_color: e.target.value })}
                      style={{ width: 48, height: 38, border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer' }}
                    />
                    <input
                      className="form-control"
                      value={branding.primary_color}
                      onChange={e => setBranding({ ...branding, primary_color: e.target.value })}
                      style={{ maxWidth: 140 }}
                    />
                  </div>
                  <span className="form-hint">Used across buttons, links, and active states.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Company Tagline</label>
                  <input
                    className="form-control"
                    value={branding.company_tagline}
                    onChange={e => setBranding({ ...branding, company_tagline: e.target.value })}
                  />
                  <span className="form-hint">Shown on the login screen.</span>
                </div>
              </>
            )}

            {tab === 'notifications' && (
              <>
                <h3 className="settings-section-title">Notification Channels</h3>
                <ToggleRow
                  icon="bi-envelope" label="Email Notifications" desc="OTP codes, statements, alerts"
                  checked={notifSettings.email_enabled}
                  onChange={v => setNotifSettings({ ...notifSettings, email_enabled: v })}
                />
                <ToggleRow
                  icon="bi-chat-dots" label="SMS Notifications" desc="Payment confirmations, reminders"
                  checked={notifSettings.sms_enabled}
                  onChange={v => setNotifSettings({ ...notifSettings, sms_enabled: v })}
                />
                <ToggleRow
                  icon="bi-whatsapp" label="WhatsApp Notifications" desc="Loan updates, statements"
                  checked={notifSettings.whatsapp_enabled}
                  onChange={v => setNotifSettings({ ...notifSettings, whatsapp_enabled: v })}
                />
                <div className="form-group mt-16">
                  <label className="form-label">OTP Expiry (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ maxWidth: 120 }}
                    value={notifSettings.otp_expiry_minutes}
                    onChange={e => setNotifSettings({ ...notifSettings, otp_expiry_minutes: e.target.value })}
                  />
                </div>
              </>
            )}

            {tab === 'security' && (
              <>
                <h3 className="settings-section-title">Security</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">JWT Token Expiry (hours)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={security.jwt_expiry_hours}
                      onChange={e => setSecurity({ ...security, jwt_expiry_hours: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Login Attempts</label>
                    <input
                      type="number"
                      className="form-control"
                      value={security.max_login_attempts}
                      onChange={e => setSecurity({ ...security, max_login_attempts: e.target.value })}
                    />
                  </div>
                </div>
                <ToggleRow
                  icon="bi-shield-lock" label="Require OTP for all logins" desc="Disabling this is not recommended"
                  checked={security.require_otp}
                  onChange={v => setSecurity({ ...security, require_otp: v })}
                />
              </>
            )}

            <div className="divider" />
            <button className="btn btn--primary" onClick={handleSave}>
              <i className="bi bi-check2" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ icon, label, desc, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-row__icon"><i className={`bi ${icon}`} /></div>
      <div className="toggle-row__body">
        <p className="toggle-row__label">{label}</p>
        <p className="toggle-row__desc">{desc}</p>
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="switch__track"><span className="switch__thumb" /></span>
      </label>
    </div>
  )
}