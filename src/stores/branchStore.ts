import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface Branch {
  id: number
  name: string
  code: string | null
  is_active: boolean
  system_type?: string | null
}

export interface BranchContext {
  assigned_branch: Branch | null
  active_branch_id: number | null
  can_access_multiple_branches: boolean
  show_branch_filter: boolean
  scope: 'all' | 'branch' | 'self'
  available_branches: Branch[]
}

const STORAGE_KEY = 'tenant_branch_context'

export const useBranchStore = defineStore('branch', () => {
  const context = ref<BranchContext | null>(
    (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as BranchContext) : null
      } catch {
        return null
      }
    })(),
  )

  /** The branch currently used for filtering lists / stamping new records. */
  const activeBranchId = computed(() => context.value?.active_branch_id ?? null)

  /** Whether the logged-in staff can switch between branches. */
  const canAccessMultipleBranches = computed(
    () => context.value?.can_access_multiple_branches ?? false,
  )

  /** Whether to show a branch filter UI on list pages. */
  const showBranchFilter = computed(() => context.value?.show_branch_filter ?? false)

  /** Branches the staff is allowed to see/filter by. */
  const availableBranches = computed(() => context.value?.available_branches ?? [])

  /** The staff member's primary assigned branch. */
  const assignedBranch = computed(() => context.value?.assigned_branch ?? null)

  function setBranchContext(data: BranchContext) {
    context.value = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  /** Override the active branch (admin switching context). */
  function setActiveBranchId(branchId: number | null) {
    if (!context.value) return
    context.value = { ...context.value, active_branch_id: branchId }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context.value))
  }

  function clear() {
    context.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    context,
    activeBranchId,
    canAccessMultipleBranches,
    showBranchFilter,
    availableBranches,
    assignedBranch,
    setBranchContext,
    setActiveBranchId,
    clear,
  }
})
