// import { notify } from '../../Global/Toasters';
import { fetchTableData, formDataFormat, scopeValues } from '@/Global'
import { notify } from '@/Global/Toasters/ToastMsg'
import { pomPinia } from 'septor-store'

export function tenantsApi() {
  const Store = pomPinia()

  async function create(data: any) {
    
    const res: any = await fetchTableData({
      data: formDataFormat(scopeValues(data)),
      props: { url: 'central/tenants', state: 'createTenants' },
      Store,
    })

    let msg: Record<string, string> = {
      msg: 'Failed to create Tenants',
      type: 'Error',
    }
    if (!res || res.status == 200) {
      msg = {
        msg: 'Tenants created successfully',
        type: 'Success',
      }
    }
    notify(msg)
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
