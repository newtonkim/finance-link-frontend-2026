import { fetchTableData, formDataFormatV2 } from '@/Global'
import { pomPinia } from 'septor-store'
import { notify } from '@/Global/Toasters'

export function groupSavingsApi() {
  const Store = pomPinia()

  async function addNoneExistingMember(data: any, outletData: any) {
    const dataPrepare = data
    
    dataPrepare.push({ name: 'group_id', value: outletData?.id, type: 'hidden',hidden:true })
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
    let msg = {
      msg: 'member added successfully',
      type: 'Success',
      success: true,
    }

    if (getCharges?.error?.response?.data?.payload?.status == 'FAILED') {
      msg = {
        msg: getCharges.error.response.data.payload.message,
        type: 'Error',
        success: false,
      }
      notify(msg)
      return false
    }
    notify(msg)
    return getCharges.payload
  }

  return {
    addNoneExistingMember,
  }
}
