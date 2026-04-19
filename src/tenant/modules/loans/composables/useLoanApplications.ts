import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  loanApplicationsApi,
  type LoanApplication,
  type LoanApplicationSummary,
} from '../../../apis/loans/loanApplicationsApi'
import { loanProductsApi, type LoanProduct } from '../../../apis/loanProducts/loanProductsApi'
import { tenantClient } from '../../../apis/tenantClient'
import { tryCatch } from '@/Global'
import { pomPinia } from 'septor-store'
const Store = pomPinia()
export function useLoanApplications() {
  const router = useRouter()

  // ─── List state ───────────────────────────────────────────────────────────
  const applications = ref<LoanApplication[]>([])
  const loading = ref(false)
  const perPage = ref(10)
  const meta = ref({ current_page: 1, last_page: 1, total: 0, from: 1, to: 0 })

  /** Windowed page list with null as ellipsis marker */
  const visiblePages = computed((): (number | null)[] => {
    const { current_page: cur, last_page: last } = meta.value
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)

    const pages: (number | null)[] = [1]
    if (cur > 3) pages.push(null)
    for (let p = Math.max(2, cur - 1); p <= Math.min(last - 1, cur + 1); p++) pages.push(p)
    if (cur < last - 2) pages.push(null)
    pages.push(last)
    return pages
  })
  // ─── Summary counts ───────────────────────────────────────────────────────
  const summary = ref<LoanApplicationSummary>({
    submitted: 0,
    under_review: 0,
    awaiting_documents: 0,
    recommended: 0,
    approved: 0,
    total_active: 0,
  })

  async function fetchSummary() {
    try {
      const res = await loanApplicationsApi.summary()
      summary.value = res.data?.data ?? summary.value
    } catch {
      // non-blocking
    }
  }

  const products = ref<LoanProduct[]>([])
  const branches = ref<{ id: number; name: string }[]>([])

  const filters = ref({
    status: '',
    member_search: '',
    loan_product_id: '' as string | number,
    branch_id: '' as string | number,
    date_from: '',
    date_to: '',
  })

  async function fetch(page = 1) {
    loading.value = true
    try {
      const params: Record<string, any> = { page, per_page: perPage.value }
      if (filters.value.status) params.status = filters.value.status
      if (filters.value.member_search) params.member_search = filters.value.member_search
      if (filters.value.loan_product_id) params.loan_product_id = filters.value.loan_product_id
      if (filters.value.branch_id) params.branch_id = filters.value.branch_id
      if (filters.value.date_from) params.date_from = filters.value.date_from
      if (filters.value.date_to) params.date_to = filters.value.date_to

      const res = await loanApplicationsApi.list(params)
      applications.value = res.data?.data ?? []
      if (res.data?.meta) meta.value = { ...meta.value, ...res.data.meta }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load loan applications.')
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    void fetch(1)
  }

  function handleFilter() {
    void fetch(1)
  }

  function handlePageChange(page: number) {
    void fetch(page)
  }

  function changePerPage(n: number) {
    perPage.value = n
    void fetch(1)
  }

  function clearFilters() {
    filters.value = {
      status: '',
      member_search: '',
      loan_product_id: '',
      branch_id: '',
      date_from: '',
      date_to: '',
    }
    void fetch(1)
  }

  async function fetchProducts() {
    try {
      const res = await loanProductsApi.list({ is_active: '1', per_page: 200 })
      products.value = res.data?.data ?? []
    } catch {
      // non-blocking
    }
  }

  async function fetchBranches() {
    try {
      // const res = await tenantClient.get('/branches')
      // branches.value = res.data?.data ?? []
      tryCatch(async () => {
        const collection:any = {
          reload: 0,
          StateStore: 'system-branches',
          time: 0,
          reqs: {
            url: 'settings/branches/branches-dropdown-list',
            method: 'post',
            data: {},
          },
          mStore: { mUse: true },
        }
        await Store.stateGenaratorApi(collection)
        branches.value = Store.state['system-branches']?.payload??[]
      })
    } catch {
      // non-blocking
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  function openCreate() {
    router.push({ name: 'tenant-loans-create' })
  }

  function openView(application: LoanApplication) {
    router.push({ name: 'tenant-loans-show', params: { id: application.id } })
  }

  function openEdit(application: LoanApplication) {
    router.push({ name: 'tenant-loans-edit', params: { id: application.id } })
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const showDeleteDialog = ref(false)
  const deleteTarget = ref<LoanApplication | null>(null)
  const deleting = ref(false)

  function openDeleteDialog(application: LoanApplication) {
    deleteTarget.value = application
    showDeleteDialog.value = true
  }

  async function confirmDelete() {
    if (!deleteTarget.value?.id) return
    deleting.value = true
    try {
      await loanApplicationsApi.cancel(deleteTarget.value.id)
      toast.success('Loan application cancelled.')
      await fetch(meta.value.current_page)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to cancel loan application.')
    } finally {
      deleting.value = false
      showDeleteDialog.value = false
      deleteTarget.value = null
    }
  }

  onMounted(() => {
    void fetch(1)
    void fetchProducts()
    void fetchBranches()
    void fetchSummary()
  })

  return {
    applications,
    loading,
    filters,
    meta,
    visiblePages,
    perPage,
    products,
    branches,
    summary,
    fetch,
    fetchSummary,
    handleSearch,
    handleFilter,
    handlePageChange,
    changePerPage,
    clearFilters,
    openCreate,
    openView,
    openEdit,
    showDeleteDialog,
    deleteTarget,
    deleting,
    openDeleteDialog,
    confirmDelete,
  }
}
