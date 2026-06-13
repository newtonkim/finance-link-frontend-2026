import { tenantClient } from '@/tenant/apis/tenantClient'
import { fetchTableData, Confirm } from '@/Global';
import { pomPinia } from 'septor-store';
export const membersApi = {
  list(params?: { search?: string; page?: number }) {
    return tenantClient.get('/members', { params })
  },
  downloadTemplate() {
    return tenantClient.get('/members/template', { responseType: 'blob' })
  },
  importMembers(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return tenantClient.post('/members/import', formData)
  },
  importJson(rows: Record<string, string>[]) {
    return tenantClient.post('/members/import-json', { rows })
  },
  store(data: Record<string, any>) {
    return tenantClient.post('/members', data)
  },
  storeFormData(data: FormData) {
    return tenantClient.post('/members', data)
  },
  show(id: number) {
    return tenantClient.get(`/members/${id}`)
  },
  update(id: number, data: Record<string, any>) {
    return tenantClient.put(`/members/${id}`, data)
  },
  updateFormData(id: number, data: FormData) {
    return tenantClient.post(`/members/${id}`, data)
  },
  destroy(id: number) {
    return tenantClient.delete(`/members/${id}`)
  },
}


export function membersFunApi() {
    const Store = pomPinia();
    function ChangMemberStatus(data?: object) {
     Confirm({title:"change member status "  ,type:'info', confirm: async() => {

       fetchTableData({
           data: data,
           props: { url: '/members/charge-status', state: 'charge-status' },
           Store,
           saveData: false,
         })
     }})
      
 
    }
    
    return {ChangMemberStatus
    };
}

