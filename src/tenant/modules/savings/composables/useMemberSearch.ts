import { ref, computed, watch } from 'vue'
import { membersApi } from '@/tenant/apis/members/membersApi'
import { toast } from 'vue-sonner'

interface MemberOption { id: number; name: string; member_number: string }

export interface MemberDetails {
  id: number
  name: string
  member_number: string
  status: string
  savings_accounts: Array<{ id: number; account_no: string; account_type: string }>
}

export function useMemberSearch(form: { value: { member_id: number } }) {
  const memberSelectValue = ref<string | number>('')
  const memberLoading = ref(false)
  const memberOptions = ref<MemberOption[]>([])
  const selectedMember = ref<MemberDetails | null>(null)

  const memberSelectOptions = computed(() =>
    (memberOptions.value ?? []).map(m => ({ id: m.id, name: `${m.name} — ${m.member_number}` }))
  )

  async function searchMembers(query: string) {
    memberLoading.value = true
    try {
      const res = await membersApi.list({ search: query || undefined, page: 1 })
      const list = res.data?.data ?? []
      memberOptions.value = list.map((m: any) => ({ id: m.id, name: m.name, member_number: m.member_number }))
    } catch {
      memberOptions.value = []
    } finally {
      memberLoading.value = false
    }
  }

  async function fetchMemberDetails(memberId: number) {
    try {
      const res = await membersApi.show(memberId)
      const body = res.data
      const memberData: Record<string, any> = body?.data?.member ?? body?.member ?? body?.data ?? body ?? {}
      selectedMember.value = {
        id: memberData.id,
        name: memberData.name,
        member_number: memberData.member_number,
        status: memberData.status,
        savings_accounts: memberData.savings_accounts ?? [],
      }
    } catch (err: any) {
      selectedMember.value = null
      toast.error(err?.response?.data?.message ?? 'Failed to load member details.')
    }
  }

  watch(memberSelectValue, async (val) => {
    const memberId = Number(val || 0)
    if (!memberId) {
      selectedMember.value = null
      form.value.member_id = 0
      return
    }
    form.value.member_id = memberId
    const opt = memberOptions.value.find(o => o.id === memberId)
    if (opt) await fetchMemberDetails(opt.id)
  })

  function reset() {
    memberSelectValue.value = ''
    selectedMember.value = null
    memberOptions.value = []
  }

  return {
    memberSelectValue,
    memberLoading,
    memberOptions,
    selectedMember,
    memberSelectOptions,
    searchMembers,
    fetchMemberDetails,
    reset,
  }
}
