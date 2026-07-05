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

  async function listGroupWithdrawalRequests(status?: string) {
    const res = await fetchTableData({
      data: { group_id: getLocalValues('groupProfile' as any).id, status },
      Store,
      props: {
        url: 'group-account-savings/withdrawal-requests-list',
        method: 'post',
        time: 0,
        state: 'groupWithdrawalRequests',
      },
    })
    return res?.payload ?? []
  }

  async function actOnGroupWithdrawalRequest(
    requestId: number,
    approverMemberId: number,
    decision: 'approved' | 'rejected',
    comment?: string,
  ) {
    const res = await fetchTableData({
      data: { request_id: requestId, approver_member_id: approverMemberId, decision, comment },
      Store,
      props: {
        url: 'group-account-savings/withdrawal-request-act',
        method: 'post',
        time: 0,
        state: 'groupWithdrawalRequests',
      },
    })
    const out = await feedback(res)
    return out?.success
  }

  async function cancelGroupWithdrawalRequest(requestId: number) {
    const res = await fetchTableData({
      data: { request_id: requestId },
      Store,
      props: {
        url: 'group-account-savings/withdrawal-request-cancel',
        method: 'post',
        time: 0,
        state: 'groupWithdrawalRequests',
      },
    })
    const out = await feedback(res)
    return out?.success
  }

  async function toggleGroupWithdrawalApprover(
    memberId: number,
    isApprover: boolean,
    approverRole?: string,
  ) {
    const res = await fetchTableData({
      data: {
        group_id: getLocalValues('groupProfile' as any).id,
        member_id: memberId,
        is_approver: isApprover,
        approver_role: approverRole,
      },
      Store,
      props: {
        url: 'group-account-savings/toggle-withdrawal-approver',
        method: 'post',
        time: 0,
        state: 'groupWithdrawalRequests',
      },
    })
    const out = await feedback(res)
    return out?.success
  }

  return {
    addNoneExistingMember,
    getGroupProfileDetail,
    createAgroupSavingAccount,
    DepositAndWithdrawAgroupSavingAccount,
    listGroupWithdrawalRequests,
    actOnGroupWithdrawalRequest,
    cancelGroupWithdrawalRequest,
    toggleGroupWithdrawalApprover,
  }
}
