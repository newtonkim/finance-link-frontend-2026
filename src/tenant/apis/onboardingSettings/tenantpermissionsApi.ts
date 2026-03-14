import { fetchTableData, formDataFormat, scopeValues } from '@/Global'
import { notify } from '@/Global/Toasters'
import { pomPinia } from 'septor-store'
 
export function tenantpermissionsApi() {
  const Store = pomPinia()
  function feedback(res: any, success: string, fail: string) {
    let msg: Record<string, string> = {
      msg: success,
      type: 'Error',
    }
    if (!res || res.code == 200) {
      msg = {
        msg: fail,
        type: 'Success',
      }
    }
    notify(msg)
    return res
  }

  function create(data: any) {
    const formDataScoping: any = formDataFormat(scopeValues(data))
    const collection: any = {
      reload: 1,
      StateStore: 'createpemissions',
      time: 0,
      reqs: {
        url: '/Permisions/pemissions',
        method: 'post',
        data: formDataScoping,
      },
    }
    feedback(collection, 'pemissions created successfully', 'Failed to create pemissions')
  }

  function Erase(data: any) {
    const collection: any = {
      reload: 1,
      StateStore: 'fetchPositions',
      time: 0,
      reqs: {
        url: '/pemissions/list',
        method: 'post',
        data,
      },
      mStore: { mUse: true },
    }
    return feedback(collection, '', '')
  }
  async function ErasePermissionFromUser(data: any) {
    const res = await fetchTableData({
      data,
      props: { url: '/settings/permisions/remove_ability', state: 'staff-attached-permission' },
      Store,
      saveData: false,
    })
    feedback(res, 'roles created successfully', 'Failed to create roles')
  }

  async function AttachPermissionToUser(data: any) { 
    const res = await fetchTableData({
      data,
      props: { url: '/settings/permisions/add_ability', state: 'staff-attached-permission' },
      Store,
      saveData: false,
    })
    feedback(res, 'roles created successfully', 'Failed to create roles')
  }

  return {
    create,
    Erase,
    ErasePermissionFromUser,
    AttachPermissionToUser,
  }
}
