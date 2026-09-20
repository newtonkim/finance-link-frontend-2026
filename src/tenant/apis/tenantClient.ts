import { getSubdomainName } from '@/Global'
import axios from 'axios'
import { getBearerToken } from 'septor-store';
import { handleLicenseError } from './licenseState'
import { endTenantSession } from './tenantSession'
// import { getBearerToken } from 'septor-store';


function getBaseURL():string{
  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000/api/v1'
  return backendUrl.replace(/\/+$/, '').replace(/\/tenant\/?$/, '') + '/tenant'
}



export const tenantClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    // Accept: 'application/json',
    // 'Content-Type': 'application/json',
  },
})

tenantClient.interceptors.request.use((config) => {
  // console.log("=====tenants2",getBaseURL());
  const token=getBearerToken()?.token;
  if (token) { // can be remved
    config.headers.Authorization = `Bearer ${token}`
  }
  // Prefer subdomain from hostname (production subdomain routing),
  // fall back to value saved at login time (dev on localhost)
  const subdomain = getSubdomainName()

  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain
  }

  // Inject active branch context so the backend scopes reads and stamps writes.
  // We read directly from localStorage here to avoid a circular Pinia import
  // (the store is not yet created when this module is loaded).
  try {
    const raw = localStorage.getItem('tenant_branch_context')
    if (raw) {
      const ctx = JSON.parse(raw)
      const activeBranchId: number | null = ctx?.active_branch_id ?? null
      if (activeBranchId !== null) {
        // For GET list endpoints — backend reads ?branch_id= for filter
        if (config.method === 'get') {
          config.params = { ...config.params, branch_id: activeBranchId }
        }
        // For all methods — backend reads X-Acting-Branch-Id to stamp writes
        config.headers['X-Acting-Branch-Id'] = String(activeBranchId)
      }
    }
  } catch {
    // localStorage unavailable or corrupt — skip silently
  }

  return config
})

// Flip global read-only mode whenever the backend refuses a write because the
// license has expired, so the UI can react without every caller handling it.
tenantClient.interceptors.response.use(
  (response) => response,
  (error) => {
    handleLicenseError(error)

    // A rejected token means the session is over — the token was revoked, it
    // expired, or the tenant database it belonged to no longer exists. Without
    // this the app kept rendering the lists it had already cached, so a dead
    // session still showed the previous sacco's members and branding.
    if (error?.response?.status === 401) {
      endTenantSession()
    }

    return Promise.reject(error)
  },
)
// return tenantClient
