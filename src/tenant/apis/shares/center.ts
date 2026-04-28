import { feedback, fetchTableData, formDataFormat, formDataFormatV2, scopeValues } from '@/Global'
import { pomPinia } from 'septor-store'

export function shareCenterApi() {
  const Store = pomPinia()

  async function TranUniShares(ends:string,data: any[]) {
    const getCharges = await fetchTableData({
      data: formDataFormatV2(data),
      Store,
      props: {
          url: '/shares/'+ends,
        method: 'post',
        time: 0,
        state: 'memberAccountList',
      },
    })
    feedback(getCharges)
    return getCharges
  }
  async function shareTransactionCharge(data: {type:string,shares:any}) {
    const getCharges = await fetchTableData({
      data: formDataFormat(data),
      Store,
      props: {
          url: '/shares/transactions/charge',
        method: 'post',
        time: 0,
        state: 'charge-transactions',
      },
    })
    return getCharges.payload
  }

  return {
    TranUniShares,shareTransactionCharge
  }
}
