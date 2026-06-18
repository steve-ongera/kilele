import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { authAPI, notificationsAPI, toArray } from '../services/api'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list()
      setNotifications(toArray(res.data).slice(0, 10))
    } catch {
      // silent
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch { }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch { }
  }

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('kilele_refresh')
      await authAPI.logout(refresh)
    } catch { }
    logout()
    navigate('/login')
  }

  const roleLabel = {
    SUPER_ADMIN: 'Super Admin',
    BRANCH_ADMIN: 'Branch Admin',
    FINANCE_OFFICER: 'Finance Officer',
    AUDITOR: 'Auditor',
    MEMBER: 'Member',
    INVESTOR: 'Investor',
    TENANT: 'Tenant',
  }[user?.role] || user?.role

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'KR'

  return (
    <header className="navbar">
      <div className="navbar__left">
        <button className="navbar__menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <i className="bi bi-list" />
        </button>
        <div className="navbar__brand">
          <span className="navbar__brand-logo">KR</span>
          <span className="navbar__brand-name">Kilele Ridge</span>
        </div>
      </div>

      <div className="navbar__right">
        {/* Notifications */}
        <div className="navbar__dropdown" ref={notifRef}>
          <button
            className="navbar__icon-btn"
            onClick={() => { setNotifOpen(prev => !prev); setProfileOpen(false) }}
            aria-label="Notifications"
          >
            <i className="bi bi-bell" />
            {unreadCount > 0 && (
              <span className="navbar__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="navbar__dropdown-panel navbar__dropdown-panel--notif">
              <div className="navbar__dropdown-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="navbar__dropdown-action" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="navbar__notif-list">
                {notifications.length === 0 ? (
                  <div className="navbar__notif-empty">
                    <i className="bi bi-bell-slash" />
                    <span>No notifications</span>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`navbar__notif-item ${!notif.is_read ? 'navbar__notif-item--unread' : ''}`}
                      onClick={() => handleMarkRead(notif.id)}
                    >
                      <div className="navbar__notif-dot" />
                      <div className="navbar__notif-body">
                        <p className="navbar__notif-title">{notif.title}</p>
                        <p className="navbar__notif-msg">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="navbar__dropdown-footer">
                <Link to="/notifications" onClick={() => setNotifOpen(false)}>
                  View all
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="navbar__dropdown" ref={profileRef}>
          <button
            className="navbar__avatar"
            onClick={() => { setProfileOpen(prev => !prev); setNotifOpen(false) }}
            aria-label="Profile menu"
          >
            <span className="navbar__avatar-initials">{initials}</span>
          </button>

          {profileOpen && (
            <div className="navbar__dropdown-panel navbar__dropdown-panel--profile">
              <div className="navbar__profile-header">
                <div className="navbar__avatar navbar__avatar--lg">
                  <span className="navbar__avatar-initials">{initials}</span>
                </div>
                <div>
                  <p className="navbar__profile-name">{user?.full_name}</p>
                  <p className="navbar__profile-role">{roleLabel}</p>
                  {user?.branch_name && (
                    <p className="navbar__profile-branch">
                      <i className="bi bi-building" /> {user.branch_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="navbar__profile-links">
                <Link
                  to="/profile"
                  className="navbar__profile-link"
                  onClick={() => setProfileOpen(false)}
                >
                  <i className="bi bi-person" /> My Profile
                </Link>
                <Link
                  to="/notifications"
                  className="navbar__profile-link"
                  onClick={() => setProfileOpen(false)}
                >
                  <i className="bi bi-bell" /> Notifications
                </Link>
              </div>
              <div className="navbar__profile-footer">
                <button className="navbar__logout-btn" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}