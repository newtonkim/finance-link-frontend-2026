import { fetchTableData, formDataFormatV2 } from '@/Global'
import { pomPinia } from 'septor-store'
export function groupSavingsApi() {
  const Store = pomPinia()

  async function addNoneExistingMember(data: any, outletData: any) {
    const dataPrepare = data
    dataPrepare.push({ name: 'group_id',value: outletData?.id },)
    const getCharges = await fetchTableData({
      data: formDataFormatV2(dataPrepare),
      Store,
      saveData: true,
      props: {
        url: 'group-account-savings/none-existing/create',
        method: 'post',
        state: 'groupAccountList',
        time: 0,
      },
    })
    return getCharges.payload
  }

  return {
    addNoneExistingMember,
  }
}
