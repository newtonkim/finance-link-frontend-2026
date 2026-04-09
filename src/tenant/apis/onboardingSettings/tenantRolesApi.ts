import { formDataFormat, scopeValues,feedback } from '@/Global'
import { notify } from '@/Global/Toasters'
import { pomPinia } from 'septor-store'
import { fetchTableData } from '@/Global'

export function tenantRolesApi() {
  const Store = pomPinia()
  

  async function create(data: any) {
    const formDataScoping: any = formDataFormat(scopeValues(data))
    const res = await fetchTableData({
      data: formDataScoping,
      props: { url: '/settings/roles/create', state: 'tenant_settings_roles_list' },
      Store,
      saveData: false,
    })
    
    feedback(res, 'roles created successfully', 'Failed to create roles')
  }

  async function EraseRolesFromUser(data: any) {
    const res = await fetchTableData({
      data: formDataFormat((data)),
      props: {
        url: '/settings/roles/remove_ability',
        state: 'staff-attached-roles',
      },
      Store,
    })
    feedback(res, 'roles created successfully', 'Failed to create roles')
  }
  
  async function AttachRolesToUser(data: any) { 
     const formDataScoping: any = formDataFormat((data))
     
    const res = await fetchTableData({
      data: formDataScoping,
      props: { url: '/settings/roles/add_ability', state: 'staff-attached-roles' },
      Store,
      saveData: false,
    })
    feedback(res, 'roles created successfully', 'Failed to create roles')
    return feedback(res, ' Roles attached ', ' Failed to attach Roles')
  }

  return {
    create,
    EraseRolesFromUser,
    AttachRolesToUser,
  }
}
