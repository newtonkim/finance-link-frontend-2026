import axios from 'axios'

function getTenantSubdomain(): string | null {
  const hostname = window.location.hostname
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null
  const parts = hostname.split('.')
  const subdomain = parts.length >= 2 ? parts[0] : null
  if (!subdomain || ['admin', 'www', 'localhost'].includes(subdomain)) return null
  return subdomain
}

/**
 * All tenant API routes are mounted at /api/v1/tenant/*.
 * On a subdomain (e.g. nakuru-sacco.localhost:8000) use the page origin so
 * the Host header carries the subdomain for tenant resolution.
 * On dev (localhost:3000 → backend at 127.0.0.1:8000) use VITE_BACKEND_URL.
 */
function getBaseURL(): string {
  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000/api/v1'
  return backendUrl.replace(/\/+$/, '').replace(/\/tenant\/?$/, '') + '/tenant'
}

export const tenantClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

tenantClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tenant_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Prefer subdomain from hostname (production subdomain routing),
  // fall back to value saved at login time (dev on localhost)
  const subdomain = getTenantSubdomain() ?? localStorage.getItem('tenant_subdomain')
  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain
  }

  return config
})
