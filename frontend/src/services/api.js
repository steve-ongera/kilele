import axios from 'axios'

// ─────────────────────────────────────────────
// BASE INSTANCE
// ─────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})


// ─────────────────────────────────────────────
// REQUEST INTERCEPTOR — attach access token
// ─────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kilele_access')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)


// ─────────────────────────────────────────────
// RESPONSE INTERCEPTOR — silent token refresh
// ─────────────────────────────────────────────

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refresh = localStorage.getItem('kilele_refresh')
      if (!refresh) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
        const newAccess = res.data.access
        localStorage.setItem('kilele_access', newAccess)
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)


// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Normalize any DRF response to a plain array.
 * Handles: paginated { results: [] }, plain [], or null.
 */
export const toArray = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  return []
}

const buildParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )


// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const authAPI = {
  requestOTP: (email) =>
    api.post('/auth/request-otp/', { email }),

  verifyOTP: (email, token) =>
    api.post('/auth/verify-otp/', { email, token }),

  refresh: (refresh) =>
    api.post('/auth/refresh/', { refresh }),

  logout: (refresh) =>
    api.post('/auth/logout/', { refresh }),
}


// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export const dashboardAPI = {
  get: () => api.get('/dashboard/'),
  graphs: () => api.get('/dashboard/graphs/'),
}


// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

export const usersAPI = {
  list: (params) => api.get('/users/', { params: buildParams(params) }),
  get: (id) => api.get(`/users/${id}/`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  profile: () => api.get('/profile/'),
  updateProfile: (data) => api.patch('/profile/', data),
}


// ─────────────────────────────────────────────
// BRANCHES
// ─────────────────────────────────────────────

export const branchesAPI = {
  list: (params) => api.get('/branches/', { params: buildParams(params) }),
  get: (id) => api.get(`/branches/${id}/`),
  create: (data) => api.post('/branches/', data),
  update: (id, data) => api.patch(`/branches/${id}/`, data),
  delete: (id) => api.delete(`/branches/${id}/`),
}


// ─────────────────────────────────────────────
// SYSTEM RULES
// ─────────────────────────────────────────────

export const rulesAPI = {
  list: (params) => api.get('/rules/', { params: buildParams(params) }),
  update: (key, data) => api.put(`/rules/${key}/`, data),
}


// ─────────────────────────────────────────────
// MEMBERS (Tujijenge)
// ─────────────────────────────────────────────

export const membersAPI = {
  list: (params) => api.get('/members/', { params: buildParams(params) }),
  get: (id) => api.get(`/members/${id}/`),
  create: (data) => api.post('/members/', data),
  update: (id, data) => api.patch(`/members/${id}/`, data),
  statement: (id) => api.get(`/members/${id}/statement/`),
}


// ─────────────────────────────────────────────
// CONTRIBUTIONS
// ─────────────────────────────────────────────

export const contributionsAPI = {
  list: (params) => api.get('/contributions/', { params: buildParams(params) }),
  get: (id) => api.get(`/contributions/${id}/`),
  create: (data) => api.post('/contributions/', data),
  update: (id, data) => api.patch(`/contributions/${id}/`, data),
}


// ─────────────────────────────────────────────
// LOANS
// ─────────────────────────────────────────────

export const loansAPI = {
  // Products
  products: {
    list: (params) => api.get('/loan-products/', { params: buildParams(params) }),
    create: (data) => api.post('/loan-products/', data),
  },
  // Loans
  list: (params) => api.get('/loans/', { params: buildParams(params) }),
  get: (id) => api.get(`/loans/${id}/`),
  create: (data) => api.post('/loans/', data),
  update: (id, data) => api.patch(`/loans/${id}/`, data),
  approve: (id, data = {}) => api.post(`/loans/${id}/approve/`, data),
  disburse: (id, data) => api.post(`/loans/${id}/disburse/`, data),
}


// ─────────────────────────────────────────────
// PENALTIES
// ─────────────────────────────────────────────

export const penaltiesAPI = {
  list: (params) => api.get('/penalties/', { params: buildParams(params) }),
  create: (data) => api.post('/penalties/', data),
  waive: (id, data) => api.post(`/penalties/${id}/waive/`, data),
}


// ─────────────────────────────────────────────
// DISTRIBUTION
// ─────────────────────────────────────────────

export const distributionAPI = {
  list: (params) => api.get('/distributions/', { params: buildParams(params) }),
  get: (id) => api.get(`/distributions/${id}/`),
  create: (data) => api.post('/distributions/', data),
  update: (id, data) => api.patch(`/distributions/${id}/`, data),
}


// ─────────────────────────────────────────────
// WEALTH ALLIANCE
// ─────────────────────────────────────────────

export const investorsAPI = {
  list: (params) => api.get('/investors/', { params: buildParams(params) }),
  get: (id) => api.get(`/investors/${id}/`),
  create: (data) => api.post('/investors/', data),
  update: (id, data) => api.patch(`/investors/${id}/`, data),
}

export const investmentsAPI = {
  list: (params) => api.get('/investments/', { params: buildParams(params) }),
  create: (data) => api.post('/investments/', data),
}

export const dividendsAPI = {
  list: (params) => api.get('/dividends/', { params: buildParams(params) }),
  get: (id) => api.get(`/dividends/${id}/`),
  create: (data) => api.post('/dividends/', data),
  update: (id, data) => api.patch(`/dividends/${id}/`, data),
}

export const investorWithdrawalsAPI = {
  list: (params) => api.get('/investor-withdrawals/', { params: buildParams(params) }),
  create: (data) => api.post('/investor-withdrawals/', data),
}


// ─────────────────────────────────────────────
// TABLE BANKING
// ─────────────────────────────────────────────

export const tableBankingAPI = {
  members: (params) => api.get('/table-banking/members/', { params: buildParams(params) }),
  lendingFund: () => api.get('/table-banking/lending-fund/'),
  // Loans and contributions reuse the same endpoints with branch filtering
  contributions: (params) => contributionsAPI.list(params),
  loans: (params) => loansAPI.list(params),
}


// ─────────────────────────────────────────────
// RENTALS
// ─────────────────────────────────────────────

export const propertiesAPI = {
  list: (params) => api.get('/properties/', { params: buildParams(params) }),
  get: (id) => api.get(`/properties/${id}/`),
  create: (data) => api.post('/properties/', data),
  update: (id, data) => api.patch(`/properties/${id}/`, data),
  delete: (id) => api.delete(`/properties/${id}/`),
}

export const unitsAPI = {
  list: (params) => api.get('/units/', { params: buildParams(params) }),
  get: (id) => api.get(`/units/${id}/`),
  create: (data) => api.post('/units/', data),
  update: (id, data) => api.patch(`/units/${id}/`, data),
}

export const tenantsAPI = {
  list: (params) => api.get('/tenants/', { params: buildParams(params) }),
  get: (id) => api.get(`/tenants/${id}/`),
  create: (data) => api.post('/tenants/', data),
  update: (id, data) => api.patch(`/tenants/${id}/`, data),
}

export const leasesAPI = {
  list: (params) => api.get('/leases/', { params: buildParams(params) }),
  get: (id) => api.get(`/leases/${id}/`),
  create: (data) => api.post('/leases/', data),
  update: (id, data) => api.patch(`/leases/${id}/`, data),
}

export const rentCollectionAPI = {
  list: (params) => api.get('/rent-collections/', { params: buildParams(params) }),
  create: (data) => api.post('/rent-collections/', data),
  update: (id, data) => api.patch(`/rent-collections/${id}/`, data),
}

export const maintenanceAPI = {
  list: (params) => api.get('/maintenance/', { params: buildParams(params) }),
  get: (id) => api.get(`/maintenance/${id}/`),
  create: (data) => api.post('/maintenance/', data),
  update: (id, data) => api.patch(`/maintenance/${id}/`, data),
}


// ─────────────────────────────────────────────
// MPESA
// ─────────────────────────────────────────────

export const mpesaAPI = {
  queue: (params) =>
    api.get('/mpesa/queue/', { params: buildParams({ confidence: 'REVIEW', ...params }) }),

  exceptions: (params) =>
    api.get('/mpesa/exceptions/', { params: buildParams(params) }),

  uploadCSV: (branchId, file) => {
    const form = new FormData()
    form.append('branch', branchId)
    form.append('file', file)
    return api.post('/mpesa/upload-csv/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  allocate: (mpesaTransactionId, memberId, notes = '') =>
    api.post('/mpesa/allocate/', {
      mpesa_transaction_id: mpesaTransactionId,
      member_id: memberId,
      notes,
    }),
}


// ─────────────────────────────────────────────
// APPROVALS
// ─────────────────────────────────────────────

export const approvalsAPI = {
  list: (params) => api.get('/approvals/', { params: buildParams(params) }),
  approve: (id, notes = '') => api.post(`/approvals/${id}/approve/`, { notes }),
  reject: (id, rejectionNote) =>
    api.post(`/approvals/${id}/reject/`, { rejection_note: rejectionNote }),
}


// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────

export const auditAPI = {
  list: (params) => api.get('/audit-logs/', { params: buildParams(params) }),
}


// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────

export const reportsAPI = {
  get: (type, params = {}) =>
    api.get(`/reports/${type}/`, {
      params: buildParams(params),
      responseType: params.format === 'csv' ? 'blob' : 'json',
    }),

  downloadCSV: async (type, params = {}, filename) => {
    const res = await reportsAPI.get(type, { ...params, format: 'csv' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `${type}-report.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },

  tujijengeSummary: (params) => api.get('/tujijenge/reports/summary/', { params: buildParams(params) }),

  // NEW
  rentalsSummary: (params) => api.get('/rentals/reports/summary/', { params: buildParams(params) }),
  tbSummary: (params) => api.get('/table-banking/reports/summary/', { params: buildParams(params) }),

}




// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export const notificationsAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
}


// ─────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────

export default api