import {  fetchTableData,  } from '@/Global'
import { pomPinia } from 'septor-store'


export function transaferApi() {
  const Store = pomPinia()

 
  async function fullTranferDetails(data: any = {}) {
    const getDetails = await fetchTableData({
      data: data,
      Store,
      props: {
        url: 'savings-transfer/details',
        method: 'post',
        time: 0,
        state: 'create-group-account',
      },
    })
    return getDetails.payload
  }
 
  return {
 fullTranferDetails
  }
}
