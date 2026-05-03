import { feedback, fetchTableData, formDataFormatV2, getLocalValues } from '@/Global'
import { pomPinia } from 'septor-store'
import { notify } from '@/Global/Toasters'


export function groupSavingsApi() {
  const Store = pomPinia()

  async function addNoneExistingMember(data: any, outletData: any) {
    const dataPrepare = data ?? []

    if (Array.isArray(dataPrepare)) {
      dataPrepare.push({ name: 'group_id', value: outletData?.id, type: 'hidden', hidden: true })
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

      const res = await feedback(getCharges, msg.msg, 'Failed to add member')

      return res
    }
  }
  
  async function getGroupProfileDetail(data: any = {}) {
    const getDetails = await fetchTableData({
      data: { ...data, group_id: getLocalValues('groupProfile' as any).id },
      Store,
      saveData: true,
      props: {
        url: 'group-account-savings/profile-completeness',
        method: 'post',
        time: 0,
        state: 'groupProfileList',
      },
    })
      // const res = await feedback(getDetails,"", 'Failed to add member')
    
    return getDetails?.payload
  }
  async function createAgroupSavingAccount(data: any = {}) {
    const dataPrepare = data ?? []
    dataPrepare.push({
      name: 'group_id',
      value: getLocalValues('groupProfile' as any).id,
      type: 'hidden',
      hidden: true,
    })
    const getDetails = await fetchTableData({
      data: formDataFormatV2(dataPrepare),
      Store,
      props: {
        url: 'group-account-savings/create-group-saving-account',
        method: 'post',
        time: 0,
        state: 'create-group-account',
      },
    })
    return getDetails
  }
  async function DepositAndWithdrawAgroupSavingAccount(
    data: any = {},
    type: string,
    account?: any,
  ) {
    // console.log(account);

    const dataPrepare = data ?? []
    dataPrepare.push(
      { name: 'group_account_id', value: account.id, type: 'hidden', hidden: true },
      { name: 'type', value: type, type: 'hidden', hidden: true },
    )
    const getDetails = await fetchTableData({
      data: formDataFormatV2(dataPrepare),
      Store,
      props: {
        url: 'group-account-savings/group-saving-account-deposit-withdrawal',
        method: 'post',
        time: 0,
        state: 'create-group-account',
      },
    })
    const res = await feedback(getDetails)
    return res?.success
  }

  return {
    addNoneExistingMember,
    getGroupProfileDetail,
    createAgroupSavingAccount,
    DepositAndWithdrawAgroupSavingAccount,
  }
}
