import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'
import {
  loanChargesApi,
  type LoanChargeCategory,
  type LoanCharge,
  type LoanChargePayload,
} from '@/tenant/apis/loanCharges/api'

type ChargeCategoryOption = {
  id: LoanChargeCategory
  name: string
}

const DEFAULT_CATEGORY_OPTIONS: ChargeCategoryOption[] = [
  { id: 'processing_fee', name: 'Processing Fee' },
  { id: 'penalty', name: 'Penalty' },
  { id: 'late_fee', name: 'Late Fee' },
  { id: 'appraisal_fee', name: 'Appraisal Fee' },
  { id: 'insurance', name: 'Insurance' },
  { id: 'other', name: 'Other' },
]

const emptyForm = (defaultCategory: LoanChargeCategory = 'penalty'): LoanChargePayload => ({
  name: '',
  category: defaultCategory,
  charge_type: 'flat',
  value: 0,
  frequency: 'one_time',
  grace_days: 0,
  max_value: null,
  max_value_type: 'none',
  is_active: true,
  income_account_id: null,
  receivable_account_id: null,
  description: '',
})

export function useLoanCharges() {
  // ─── List ─────────────────────────────────────────────────────────────────
  const charges = ref<LoanCharge[]>([])
  const loading = ref(false)
  const toggling = ref<number | null>(null)
  const deleting = ref<number | null>(null)
  const search = ref('')
  const filterCategory = ref('')

  const categoryOptions = computed<ChargeCategoryOption[]>(() => DEFAULT_CATEGORY_OPTIONS)

  const filteredCharges = computed(() => {
    let result = charges.value
    if (filterCategory.value) {
      result = result.filter((c) => c.category === filterCategory.value)
    }
    if (search.value) {
      const q = search.value.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      )
    }
    return result
  })

  async function fetch() {
    loading.value = true
    try {
      const res = await loanChargesApi.list()
      const payload = res.data?.data ?? res.data ?? []
      charges.value = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : []
    } catch {
      toast.error('Failed to load loan charges.')
    } finally {
      loading.value = false
    }
  }

  async function toggleActive(charge: LoanCharge) {
    toggling.value = charge.id
    try {
      const res = await loanChargesApi.toggle(charge.id)
      const updated = res.data?.data ?? res.data
      const idx = charges.value.findIndex((c) => c.id === charge.id)
      if (idx !== -1) charges.value[idx] = { ...charges.value[idx], ...updated }
      toast.success(updated.is_active ? 'Charge activated.' : 'Charge deactivated.')
    } catch {
      toast.error('Failed to toggle charge.')
    } finally {
      toggling.value = null
    }
  }

  async function remove(charge: LoanCharge) {
    if (!confirm(`Delete "${charge.name}"? This cannot be undone.`)) return
    deleting.value = charge.id
    try {
      await loanChargesApi.destroy(charge.id)
      charges.value = charges.value.filter((c) => c.id !== charge.id)
      toast.success('Charge deleted.')
    } catch {
      toast.error('Failed to delete charge.')
    } finally {
      deleting.value = null
    }
  }

  // ─── Accounts (for GL mapping) ───────────────────────────────────────────
  const accounts = ref<{ id: number; name: string }[]>([])
  const rawAccounts = ref<any[]>([])
  const incomeAccounts = computed<{ id: number; name: string }[]>(() =>
    rawAccounts.value
      .filter((a: any) => String(a.account_type ?? '').toUpperCase() === 'INCOME')
      .map((a: any) => ({
        id: a.id,
        name: `${a.gl_code} - ${a.name}`,
      })),
  )

  function matchAccountId(type: string, ...keywords: string[][]): number | null {
    const found = rawAccounts.value.find((a: any) => {
      if (String(a.account_type ?? '').toUpperCase() !== type.toUpperCase()) return false
      const hay = `${a.gl_code ?? ''} ${a.name ?? ''} ${a.account_subtype ?? ''}`.toLowerCase()
      return keywords.every((group) => group.some((kw) => hay.includes(kw)))
    })
    return found ? found.id : null
  }

  function suggestedGlAccountsForCategory(category: string): {
    incomeAccountId: number | null
    receivableAccountId: number | null
  } {
    if (category === 'processing_fee') {
      return {
        incomeAccountId: matchAccountId('INCOME', ['processing', 'charge', 'fee']),
        receivableAccountId: matchAccountId('ASSET', ['charge', 'processing'], ['receivable']),
      }
    }

    if (category === 'penalty' || category === 'late_fee') {
      return {
        incomeAccountId: matchAccountId('INCOME', ['penalty', 'fine']),
        receivableAccountId: matchAccountId('ASSET', ['penalty', 'fine'], ['receivable']),
      }
    }

    if (category === 'insurance') {
      return {
        incomeAccountId: matchAccountId('INCOME', ['insurance']),
        receivableAccountId: matchAccountId('ASSET', ['insurance'], ['receivable']),
      }
    }

    if (category === 'appraisal_fee') {
      return {
        incomeAccountId: matchAccountId('INCOME', ['appraisal']),
        receivableAccountId: matchAccountId('ASSET', ['appraisal'], ['receivable']),
      }
    }

    return {
      incomeAccountId: matchAccountId('INCOME', ['charge', 'fee']),
      receivableAccountId: matchAccountId('ASSET', ['charge'], ['receivable']),
    }
  }

  function applySuggestedGlAccounts(force = false) {
    if (editingCharge.value) return
    if (!rawAccounts.value.length) return

    const suggested = suggestedGlAccountsForCategory(form.value.category ?? '')

    if (force || !form.value.income_account_id) {
      form.value.income_account_id = suggested.incomeAccountId
    }
    if (force || !form.value.receivable_account_id) {
      form.value.receivable_account_id = suggested.receivableAccountId
    }
  }

  async function fetchAccounts() {
    try {
      const res = await chartOfAccountsApi.list({ list: 1 })
      const all: any[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []
      rawAccounts.value = all.filter((a: any) => a.is_postable)
      accounts.value = rawAccounts.value.map((a: any) => ({
        id: a.id,
        name: `${a.gl_code} - ${a.name}`,
      }))
      applySuggestedGlAccounts(false)
    } catch {
      toast.error('Failed to load chart of accounts.')
    }
  }

  // ─── Drawer / Form ────────────────────────────────────────────────────────
  const showDrawer = ref(false)
  const editingCharge = ref<LoanCharge | null>(null)
  const form = ref<LoanChargePayload>(emptyForm('penalty'))
  const processing = ref(false)
  const errors = ref<Record<string, string>>({})

  function openAddDrawer() {
    editingCharge.value = null
    const preferredCategory = categoryOptions.value.find((c) => c.id === 'penalty')?.id
    form.value = emptyForm(preferredCategory ?? categoryOptions.value[0]?.id ?? 'penalty')
    applySuggestedGlAccounts(true)
    errors.value = {}
    showDrawer.value = true
  }

  function openEditDrawer(charge: LoanCharge) {
    editingCharge.value = charge
    form.value = {
      name: charge.name,
      category: charge.category,
      charge_type: charge.charge_type,
      value: Number(charge.value),
      frequency: charge.frequency,
      grace_days: charge.grace_days ?? 0,
      max_value: charge.max_value != null ? Number(charge.max_value) : null,
      max_value_type: charge.max_value_type ?? 'none',
      is_active: charge.is_active,
      income_account_id: charge.income_account_id ?? null,
      receivable_account_id: charge.receivable_account_id ?? null,
      description: charge.description ?? '',
    }
    errors.value = {}
    showDrawer.value = true
  }

  function closeDrawer() {
    editingCharge.value = null
    showDrawer.value = false
    errors.value = {}
  }

  watch(
    () => form.value.category,
    () => {
      if (!showDrawer.value || editingCharge.value) return
      applySuggestedGlAccounts(true)
    },
  )

  async function submit() {
    errors.value = {}

    // Client-side validation
    if (!form.value.name.trim()) {
      errors.value.name = 'Charge name is required.'
    }
    if (!form.value.category) {
      errors.value.category = 'Category is required.'
    }
    if (!form.value.charge_type) {
      errors.value.charge_type = 'Charge type is required.'
    }
    if (Number(form.value.value) <= 0) {
      errors.value.value = 'Value must be greater than 0.'
    }
    if (form.value.charge_type === 'percentage' && Number(form.value.value) > 100) {
      errors.value.value = 'Percentage cannot exceed 100%.'
    }

    // GL accounts required when category is not "other"
    if (form.value.category && form.value.category !== 'other') {
      if (!form.value.income_account_id) {
        errors.value.income_account_id = 'Income account is required for this charge category.'
      }
      if (!form.value.receivable_account_id) {
        errors.value.receivable_account_id =
          'Receivable account is required for this charge category.'
      }
    }

    // Frequency required
    if (!form.value.frequency) {
      errors.value.frequency = 'Frequency is required.'
    }

    // Grace days must be non-negative
    if (form.value.grace_days < 0) {
      errors.value.grace_days = 'Grace days cannot be negative.'
    }

    // Max value required when cap type is set
    if (form.value.max_value_type && form.value.max_value_type !== 'none') {
      if (form.value.max_value == null || Number(form.value.max_value) <= 0) {
        errors.value.max_value = 'Maximum value is required when a cap type is selected.'
      }
      if (
        form.value.max_value_type === 'percentage_of_outstanding' &&
        Number(form.value.max_value) > 100
      ) {
        errors.value.max_value = 'Cap percentage cannot exceed 100%.'
      }
    }

    if (Object.keys(errors.value).length > 0) {
      toast.error('Please fix the errors below.')
      return
    }

    processing.value = true
    try {
      if (editingCharge.value) {
        const res = await loanChargesApi.update(editingCharge.value.id, form.value)
        const updated = res.data?.data ?? res.data
        const idx = charges.value.findIndex((c) => c.id === editingCharge.value!.id)
        if (idx !== -1) charges.value[idx] = { ...charges.value[idx], ...updated }
        toast.success('Charge updated successfully.')
      } else {
        const res = await loanChargesApi.create(form.value)
        const created = res.data?.data ?? res.data
        charges.value.unshift(created)
        toast.success('Charge created successfully.')
      }
      closeDrawer()
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.errors) {
        errors.value = Object.fromEntries(
          Object.entries(data.errors as Record<string, string[]>).map(([k, v]) => [k, v[0] ?? '']),
        )
        toast.error('Please fix the errors below.')
      } else {
        toast.error(data?.message ?? 'Failed to save charge.')
      }
    } finally {
      processing.value = false
    }
  }

  // ─── Labels ───────────────────────────────────────────────────────────────
  function categoryLabel(cat: string): string {
    return categoryOptions.value.find((row) => row.id === cat)?.name ?? cat
  }

  function frequencyLabel(freq: string): string {
    const map: Record<string, string> = {
      one_time: 'One-Time',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    }
    return map[freq] ?? freq
  }

  return {
    charges,
    categoryOptions,
    loading,
    toggling,
    deleting,
    search,
    filterCategory,
    filteredCharges,
    fetch,
    toggleActive,
    remove,
    accounts,
    incomeAccounts,
    fetchAccounts,
    showDrawer,
    editingCharge,
    form,
    processing,
    errors,
    openAddDrawer,
    openEditDrawer,
    closeDrawer,
    submit,
    categoryLabel,
    frequencyLabel,
  }
}
