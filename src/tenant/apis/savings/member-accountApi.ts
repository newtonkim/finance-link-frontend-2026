import { feedback, fetchTableData, formDataFormatV2 } from '@/Global'
import { notify } from '@/Global/Toasters'
import { pomPinia } from 'septor-store'
export function memberAccountApi() {
  const Store = pomPinia()
  async function memebrAccountDepositAmount(data: any, outletAction: any) {
    const dataPrepare = data
    dataPrepare.push(
      { value: 'depositing', name: 'new_account', hidden: true },
      { name: 'group_id', value: outletAction?.id, hidden: true },
    )
    const unique = Object.values(
      dataPrepare.reduce(
        (acc, item) => {
          acc[item.name] = item
          return acc
        },
        {} as Record<string, any>,
      ),
    )
    const getCharges = await fetchTableData({
      data: formDataFormatV2(unique),
      Store,
      saveData: true,
      props: {
        url: 'members-account/create',
        method: 'post',
        time: 0,
        state: 'memberAccountList',
      },
    })
    let msg: any = {
      msg: 'deposit amount added successfully',
      type: 'Success',
      success: true,
    }
    if (getCharges?.error?.response?.data?.payload?.code == '422') {
      msg = {
        msg: getCharges.error.response.data.payload.message,
        type: 'Error',
        success: false,
      }
      notify(msg)
      return false
    }
    notify(msg)

    return true

    // return getCharges.payload
  }
  async function memebrAccountWithdrawalAmount(data: any, outletAction: any) {
    const dataPrepare = data
    dataPrepare.push({ name: 'account_id', value: outletAction?.id, hidden: true })
    const unique = Object.values(
      dataPrepare.reduce(
        (acc, item) => {
          acc[item.name] = item
          return acc
        },
        {} as Record<string, any>,
      ),
    )
    const getCharges = await fetchTableData({
      data: formDataFormatV2(unique),
      Store,
      saveData: true,
      props: {
        url: 'members-account/withdrawal',
        method: 'post',
        time: 0,
        state: 'memberAccountList',
      },
    })
    feedback(getCharges, 'withdrawal amount  successfully')

    return true
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
    memebrAccountWithdrawalAmount,
  }
}
