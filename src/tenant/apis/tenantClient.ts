import axios from 'axios'

const baseURL = import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000/api/v1'

function getTenantSubdomain(): string | null {
  const hostname = window.location.hostname
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null
  const parts = hostname.split('.')
  const subdomain = parts.length >= 2 ? parts[0] : null
  if (!subdomain || ['admin', 'www', 'localhost'].includes(subdomain)) return null
  return subdomain
}

export const tenantClient = axios.create({
  baseURL,
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

  const subdomain = getTenantSubdomain()
  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain
  }

  return config
})
