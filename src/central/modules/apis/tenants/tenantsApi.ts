// import { notify } from '../../Global/Toasters';
import { fetchTableData, formDataFormat, scopeValues } from '@/Global'
import { notify } from '@/Global/Toasters/ToastMsg'
import { pomPinia } from 'septor-store'
import { apiClient } from '@/central/api/client'

export function tenantsApi() {
  const Store = pomPinia()

  async function create(data: any) {
    const payload = formDataFormat(scopeValues(data))
    // Use apiClient directly so validation errors (422) are thrown and
    // can be caught by the caller with the full backend error payload.
    const res = await apiClient.post('central/tenants', payload)
    return res
  }
  async function fetchPositions(data?: any) {
    const res: any = await fetchTableData({
      data: formDataFormat(scopeValues(data)),
      props: { url: 'central/tenants', state: 'createTenants' },
      Store,
    })
    return res
  }
  async function fetchTenants(data: any) {
    const res: any = await fetchTableData({
      data: formDataFormat(scopeValues(data)),
      props: { url: '/Tenants/list', state: 'fetchPositions', method: 'post' },
      Store,
    })
    return res
  }
  async function Erase(data: any) {
    const res: any = await fetchTableData({
      data: formDataFormat(scopeValues(data)),
      props: { url: '/Tenants/delete', state: 'fetchPositions', method: 'post' },
      Store,
    })
    return res
  }

  return {
    create,
    Erase,
    fetchTenants,
    fetchPositions,
  }
}
