import { feedback, fetchTableData, formDataFormatV2, getLocalValues,Confirm } from '@/Global'
import { notify } from '@/Global/Toasters'
import { pomPinia } from 'septor-store'
export function memberProfileApi() {
  const Store = pomPinia()

  async function getMemberProfileDetail(data: any={}) {
    const getCharges = await fetchTableData({
      data:{...data, member_id:     getLocalValues('memberProfile').id},
      Store,
      saveData: true,
      props: {
        url: 'members/profile-completeness',
        method: 'post',
        time: 0,
        state: 'memberProfileList',
      },
    })
    return getCharges?.payload
  }
    function ChangMemberStatus(data?: object) {
     Confirm({title:"change member status ",des:"Are you sure"  ,type:'warning', confirm: async() => {

       fetchTableData({
           data: data,
           props: { url: '/members/charge-status', state: 'charge-status' },
           Store,
           saveData: false,
         })
     }})
      
 
    }
    
  async function DeleteMemberAccount(data: any={}) {
    const getCharges = await fetchTableData({
      data:{...data, member_id:     getLocalValues('memberProfile').id},
      Store,
      saveData: true,
      props: {
        url: 'members-account/delete',
        method: 'post',
        time: 0,
        state: 'deleteMemberAccount',
      },
    })
    feedback(getCharges, 'Account deleted successfully', 'Failed to delete account')
    getMemberProfileDetail()
    return getCharges?.payload
  }

  return {
    getMemberProfileDetail,ChangMemberStatus,
    DeleteMemberAccount

  }
}
