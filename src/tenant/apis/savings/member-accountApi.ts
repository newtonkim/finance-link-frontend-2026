import { fetchTableData, formDataFormatV2 } from '@/Global'
import { pomPinia } from 'septor-store'
export function memberAccountApi() {
  const Store = pomPinia()
  async function memebrAccountDepositAmount(data: any, outletAction: any) {
    const dataPrepare = data
    dataPrepare.push(
      { value: 'depositing', name: 'new_account' },
      { name: 'id', value: outletAction?.id },
    )
    const getCharges = await fetchTableData({
      data: formDataFormatV2(dataPrepare),
      Store,
      saveData: true,
      props: {
        url: 'members-account/create',
        method: 'post',
        time: 0,
        state: 'memberAccountList',
      },
    })
    return getCharges.payload
  }
  async function getProductCharges(data: any) {
    const getCharges = await fetchTableData({
      data: data,
      Store,
      saveData: true,
      props: {
        url: 'global/get-product-charges',
        method: 'post',
        time: 0,
      },
    })
    return getCharges.payload
  }

  return {
    getProductCharges,
    memebrAccountDepositAmount,
  }
}
