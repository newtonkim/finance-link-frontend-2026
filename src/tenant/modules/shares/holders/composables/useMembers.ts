import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { membersApi } from '@/tenant/apis/members/membersApi'
import { useTenantContextStore } from '@/stores/tenantContext'
import { useSettingsStore } from '@/stores/settingsStore'
import * as XLSX from 'xlsx'

export interface Member {
  id: number
  member_number: string
  name: string
  phone: string
  phone_country: string | null
  email: string | null
  gender: string
  status: string
  joined_at: string | null
  member_type: string
  marital_status: string
  nationality: string
  address: string
  id_number: string | null
  dob: string | null
  avatar_url: string | null
}

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export function useMembers() {
  const router = useRouter()
  const tenantStore = useTenantContextStore()
  const settingsStore = useSettingsStore()

  const members = ref<Member[]>([])
  const meta = ref<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const loading = ref(false)
  const exporting = ref(false)
  const searchQuery = ref('')
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  const showDeleteDialog = ref(false)
  const deleteTarget = ref<Member | null>(null)
  const deleteLoading = ref(false)

  const pages = computed(() => Array.from({ length: meta.value.last_page }, (_, i) => i + 1))

  function isLoyal(member: Member): boolean {
    if (!member.joined_at) return false
    const months =
      (new Date().getFullYear() - new Date(member.joined_at).getFullYear()) * 12 +
      (new Date().getMonth() - new Date(member.joined_at).getMonth())
    return months >= settingsStore.loyalMemberMinTenureMonths
  }

  async function fetchMembers(page = 1) {
    loading.value = true
    try {
      const res = await membersApi.list({ search: searchQuery.value || undefined, page })
      members.value = res.data.data ?? []
      if (res.data.meta) {
        meta.value = res.data.meta
        tenantStore.setMemberCount(res.data.meta.total)
      }
    } finally {
      loading.value = false
    }
  }

  watch(searchQuery, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => fetchMembers(1), 400)
  })

  onMounted(() => fetchMembers(1))

  function openCreate() { router.push('/tenant/members/create') }
  function openEdit(member: Member) { router.push(`/tenant/members/${member.id}/edit`) }
  function viewMember(member: Member) { router.push(`/tenant/members/${member.id}`) }

  function confirmDelete(member: Member) {
    deleteTarget.value = member
    showDeleteDialog.value = true
  }

  async function deleteMember() {
    if (!deleteTarget.value) return
    deleteLoading.value = true
    try {
      await membersApi.destroy(deleteTarget.value.id)
      showDeleteDialog.value = false
      await fetchMembers(meta.value.current_page)
    } finally {
      deleteLoading.value = false
    }
  }

  async function exportMembersExcel(scope: 'page' | 'all') {
    if (exporting.value) return
    exporting.value = true
    try {
      const rows = scope === 'page' ? members.value : await fetchAllMembers()
      const data = rows.map(m => ({
        'Member Number': m.member_number,
        'Full Name': m.name,
        'Phone': m.phone,
        'Email': m.email ?? '',
        'Gender': m.gender,
        'Status': m.status,
        'Joined': m.joined_at ?? '',
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Members')
      XLSX.writeFile(wb, scope === 'page' ? 'members-page.xlsx' : 'members-all.xlsx')
    } finally {
      exporting.value = false
    }
  }

  async function fetchAllMembers(): Promise<Member[]> {
    const all: Member[] = []
    for (let p = 1; p <= Math.max(1, meta.value.last_page); p++) {
      const res = await membersApi.list({ search: searchQuery.value || undefined, page: p })
      all.push(...(res.data.data ?? []))
    }
    return all
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function statusClass(status: string) {
    if (status === 'active')   return 'bg-green-100 text-green-700'
    if (status === 'pending')  return 'bg-amber-100 text-amber-700'
    if (status === 'rejected') return 'bg-red-100 text-red-600'
    return 'bg-neutral-100 text-neutral-500'
  }

  return {
    members, meta, pages, loading, exporting, searchQuery,
    showDeleteDialog, deleteTarget, deleteLoading,
    isLoyal, fetchMembers, openCreate, openEdit, viewMember,
    confirmDelete, deleteMember, exportMembersExcel,
    formatDate, statusClass,
  }
}
