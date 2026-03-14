import { getSubdomainName, getTenantSubdomain } from '@/Global'
import axios from 'axios'


function getBaseURL():string{
  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000/api/v41'
  return backendUrl.replace(/\/+$/, '').replace(/\/tenant\/?$/, '') + '/tenant'
}
console.log(getBaseURL(),"getBaseURL()");


export const tenantClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

tenantClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tenant_token')
  if (token) { // can be remved 
    config.headers.Authorization = `Bearer `
    // config.headers.Authorization = `Bearer ${token}`
  }

  // Prefer subdomain from hostname (production subdomain routing),
  // fall back to value saved at login time (dev on localhost)
  const subdomain = getSubdomainName()
  console.log(subdomain,"subdomainsubdomaininsepto");
  
  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain
    console.log(config);
    
  }

  return config
})
// return tenantClient
