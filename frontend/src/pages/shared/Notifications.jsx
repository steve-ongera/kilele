import { useState, useEffect } from 'react'
import { notificationsAPI, toArray } from '../../services/api'

const CHANNEL_ICON = {
  WHATSAPP: 'bi-whatsapp',
  SMS: 'bi-chat-dots',
  EMAIL: 'bi-envelope',
  IN_APP: 'bi-bell',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationsAPI.list()
      setNotifications(toArray(res.data))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch { }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch { }
  }

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Notifications</h1>
        <p className="page-header__sub">
          {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
        </p>
        <div className="page-header__actions">
          <div className="tabs">
            <button
              className={`tab ${filter === 'all' ? 'tab--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`tab ${filter === 'unread' ? 'tab--active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn--secondary btn--sm" onClick={handleMarkAllRead}>
              <i className="bi bi-check2-all" /> Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">
            <span className="spinner spinner--lg" />
            <p>Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <i className="bi bi-bell-slash" />
            </div>
            <h3 className="empty-state__title">No notifications</h3>
            <p className="empty-state__desc">
              {filter === 'unread' ? "You're all caught up." : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="notif-list-full">
            {filtered.map(n => (
              <div
                key={n.id}
                className={`notif-list-item ${!n.is_read ? 'notif-list-item--unread' : ''}`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div className="notif-list-item__icon">
                  <i className={`bi ${CHANNEL_ICON[n.channel] || 'bi-bell'}`} />
                </div>
                <div className="notif-list-item__body">
                  <div className="notif-list-item__top">
                    <p className="notif-list-item__title">{n.title}</p>
                    {!n.is_read && <span className="notif-dot-sm" />}
                  </div>
                  <p className="notif-list-item__msg">{n.message}</p>
                  <p className="notif-list-item__time">
                    {n.created_at ? new Date(n.created_at).toLocaleString('en-KE', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}