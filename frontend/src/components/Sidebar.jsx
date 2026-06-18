import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../App'

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  FINANCE_OFFICER: 'FINANCE_OFFICER',
  AUDITOR: 'AUDITOR',
  MEMBER: 'MEMBER',
  INVESTOR: 'INVESTOR',
  TENANT: 'TENANT',
}

// ─────────────────────────────────────────────
// MENU DEFINITIONS PER ROLE
// ─────────────────────────────────────────────

const MENU = {
  [ROLES.SUPER_ADMIN]: [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', icon: 'bi-speedometer2', to: '/super-dashboard' },
        { label: 'Branches', icon: 'bi-diagram-3', to: '/branches' },
      ],
    },
    {
      section: 'Tujijenge',
      items: [
        { label: 'Members', icon: 'bi-people', to: '/tujijenge/members' },
        { label: 'Contributions', icon: 'bi-wallet2', to: '/tujijenge/contributions' },
        { label: 'Loans', icon: 'bi-cash-stack', to: '/tujijenge/loans' },
        { label: 'Penalties', icon: 'bi-exclamation-triangle', to: '/tujijenge/penalties' },
        { label: 'Distribution', icon: 'bi-pie-chart', to: '/tujijenge/distribution' },
        { label: 'Reports', icon: 'bi-file-earmark-bar-graph', to: '/tujijenge/reports' },
      ],
    },
    {
      section: 'Wealth Alliance',
      items: [
        { label: 'Investors', icon: 'bi-person-badge', to: '/wealth-alliance/investors' },
        { label: 'Investments', icon: 'bi-graph-up-arrow', to: '/wealth-alliance/investments' },
        { label: 'Dividends', icon: 'bi-currency-dollar', to: '/wealth-alliance/dividends' },
        { label: 'Withdrawals', icon: 'bi-arrow-up-circle', to: '/wealth-alliance/withdrawals' },
        { label: 'Reports', icon: 'bi-file-earmark-bar-graph', to: '/wealth-alliance/reports' },
      ],
    },
    {
      section: 'Table Banking',
      items: [
        { label: 'Members', icon: 'bi-people-fill', to: '/table-banking/members' },
        { label: 'Contributions', icon: 'bi-wallet2', to: '/table-banking/contributions' },
        { label: 'Loans', icon: 'bi-cash-stack', to: '/table-banking/loans' },
        { label: 'Reports', icon: 'bi-file-earmark-bar-graph', to: '/table-banking/reports' },
      ],
    },
    {
      section: 'Rentals',
      items: [
        { label: 'Properties', icon: 'bi-building', to: '/rentals/properties' },
        { label: 'Units', icon: 'bi-door-open', to: '/rentals/units' },
        { label: 'Tenants', icon: 'bi-house-heart', to: '/rentals/tenants' },
        { label: 'Rent Collection', icon: 'bi-receipt', to: '/rentals/rent-collection' },
        { label: 'Maintenance', icon: 'bi-tools', to: '/rentals/maintenance' },
        { label: 'Reports', icon: 'bi-file-earmark-bar-graph', to: '/rentals/reports' },
      ],
    },
    {
      section: 'M-Pesa',
      items: [
        { label: 'Review Queue', icon: 'bi-inbox', to: '/mpesa/queue' },
        { label: 'Exceptions', icon: 'bi-exclamation-octagon', to: '/mpesa/exceptions' },
        { label: 'Upload CSV', icon: 'bi-cloud-upload', to: '/mpesa/upload' },
      ],
    },
    {
      section: 'Operations',
      items: [
        { label: 'Approvals', icon: 'bi-check2-square', to: '/approvals' },
        { label: 'Reports', icon: 'bi-bar-chart-line', to: '/reports' },
        { label: 'Audit Log', icon: 'bi-shield-check', to: '/audit-log' },
      ],
    },
    {
      section: 'Admin',
      items: [
        { label: 'Users', icon: 'bi-person-gear', to: '/users' },
        { label: 'Business Rules', icon: 'bi-sliders', to: '/rules' },
        { label: 'Settings', icon: 'bi-gear', to: '/system-settings' },
      ],
    },
  ],

  [ROLES.BRANCH_ADMIN]: [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', icon: 'bi-speedometer2', to: '/dashboard' },
      ],
    },
    {
      section: 'Tujijenge',
      items: [
        { label: 'Members', icon: 'bi-people', to: '/tujijenge/members' },
        { label: 'Contributions', icon: 'bi-wallet2', to: '/tujijenge/contributions' },
        { label: 'Loans', icon: 'bi-cash-stack', to: '/tujijenge/loans' },
        { label: 'Penalties', icon: 'bi-exclamation-triangle', to: '/tujijenge/penalties' },
        { label: 'Distribution', icon: 'bi-pie-chart', to: '/tujijenge/distribution' },
        { label: 'Reports', icon: 'bi-file-earmark-bar-graph', to: '/tujijenge/reports' },
      ],
    },
    {
      section: 'M-Pesa',
      items: [
        { label: 'Review Queue', icon: 'bi-inbox', to: '/mpesa/queue' },
        { label: 'Exceptions', icon: 'bi-exclamation-octagon', to: '/mpesa/exceptions' },
        { label: 'Upload CSV', icon: 'bi-cloud-upload', to: '/mpesa/upload' },
      ],
    },
    {
      section: 'Operations',
      items: [
        { label: 'Approvals', icon: 'bi-check2-square', to: '/approvals' },
        { label: 'Reports', icon: 'bi-bar-chart-line', to: '/reports' },
      ],
    },
  ],

  [ROLES.FINANCE_OFFICER]: [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', icon: 'bi-speedometer2', to: '/dashboard' },
      ],
    },
    {
      section: 'Tujijenge',
      items: [
        { label: 'Members', icon: 'bi-people', to: '/tujijenge/members' },
        { label: 'Contributions', icon: 'bi-wallet2', to: '/tujijenge/contributions' },
        { label: 'Loans', icon: 'bi-cash-stack', to: '/tujijenge/loans' },
        { label: 'Penalties', icon: 'bi-exclamation-triangle', to: '/tujijenge/penalties' },
      ],
    },
    {
      section: 'M-Pesa',
      items: [
        { label: 'Review Queue', icon: 'bi-inbox', to: '/mpesa/queue' },
        { label: 'Exceptions', icon: 'bi-exclamation-octagon', to: '/mpesa/exceptions' },
        { label: 'Upload CSV', icon: 'bi-cloud-upload', to: '/mpesa/upload' },
      ],
    },
    {
      section: 'Operations',
      items: [
        { label: 'Approvals', icon: 'bi-check2-square', to: '/approvals' },
      ],
    },
  ],

  [ROLES.AUDITOR]: [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', icon: 'bi-speedometer2', to: '/dashboard' },
      ],
    },
    {
      section: 'Reports & Audit',
      items: [
        { label: 'Reports', icon: 'bi-bar-chart-line', to: '/reports' },
        { label: 'Audit Log', icon: 'bi-shield-check', to: '/audit-log' },
      ],
    },
  ],

  [ROLES.MEMBER]: [
    {
      section: 'My Account',
      items: [
        { label: 'Dashboard', icon: 'bi-speedometer2', to: '/my-dashboard' },
        { label: 'Contributions', icon: 'bi-wallet2', to: '/my-contributions' },
        { label: 'Loans', icon: 'bi-cash-stack', to: '/my-loans' },
        { label: 'Statement', icon: 'bi-file-text', to: '/my-statement' },
        { label: 'Requests', icon: 'bi-send', to: '/my-requests' },
        { label: 'Documents', icon: 'bi-folder', to: '/my-documents' },
      ],
    },
  ],

  [ROLES.INVESTOR]: [
    {
      section: 'My Portfolio',
      items: [
        { label: 'Dashboard', icon: 'bi-speedometer2', to: '/my-dashboard' },
        { label: 'Investment', icon: 'bi-graph-up-arrow', to: '/my-investment' },
        { label: 'Statement', icon: 'bi-file-text', to: '/my-statement' },
        { label: 'Requests', icon: 'bi-send', to: '/my-requests' },
        { label: 'Documents', icon: 'bi-folder', to: '/my-documents' },
      ],
    },
  ],

  [ROLES.TENANT]: [
    {
      section: 'My Tenancy',
      items: [
        { label: 'Dashboard', icon: 'bi-speedometer2', to: '/my-dashboard' },
        { label: 'My Lease', icon: 'bi-house-heart', to: '/my-lease' },
        { label: 'Statement', icon: 'bi-file-text', to: '/my-statement' },
        { label: 'Maintenance', icon: 'bi-tools', to: '/my-requests' },
        { label: 'Documents', icon: 'bi-folder', to: '/my-documents' },
      ],
    },
  ],
}


// ─────────────────────────────────────────────
// SIDEBAR COMPONENT
// ─────────────────────────────────────────────

export default function Sidebar({ isOpen, isCollapsed, onClose }) {
  const { user } = useAuth()
  const location = useLocation()
  const menu = MENU[user?.role] || []

  return (
    <>
      <aside
        className={[
          'sidebar',
          isOpen ? 'sidebar--open' : '',
          isCollapsed ? 'sidebar--collapsed' : '',
        ].join(' ')}
      >
        {/* Logo / Brand */}
        <div className="sidebar__brand">
          <div className="sidebar__brand-icon">KR</div>
          {!isCollapsed && (
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-name">Kilele Ridge</span>
              <span className="sidebar__brand-sub">Group Platform</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {menu.map((group) => (
            <div key={group.section} className="sidebar__group">
              {!isCollapsed && (
                <p className="sidebar__group-label">{group.section}</p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    ['sidebar__link', isActive ? 'sidebar__link--active' : ''].join(' ')
                  }
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => {
                    if (window.innerWidth <= 768) onClose()
                  }}
                >
                  <i className={`bi ${item.icon} sidebar__link-icon`} />
                  {!isCollapsed && (
                    <span className="sidebar__link-label">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom user strip */}
        {!isCollapsed && user && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {user.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'KR'}
            </div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{user.full_name}</p>
              <p className="sidebar__user-role">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}