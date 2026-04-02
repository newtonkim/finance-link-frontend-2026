import { ref, computed, onMounted, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  loanProductsApi,
  type DocumentTypeOption,
  type LoanProduct,
  type LoanProductPreview,
} from '../../../apis/loanProducts/loanProductsApi'
import { chartOfAccountsApi } from '../../../apis/chartOfAccounts/chartOfAccountsApi'

function createDefaultForm(): LoanProduct {
  return {
    code: '',
    name: '',
    description: '',
    min_amount: null,
    max_amount: null,
    interest_rate: null,
    interest_method: null,
    repayment_structure: null,
    interest_period: 'per_month',
    loan_duration: null,
    duration_type: 'months',
    repayment_cycle: 'monthly',
    required_documents: [],
    grace_period: 0,
    savings_appraisal_threshold: 0,
    warning_days: null,
    max_securities: 3,
    security_value_percentage: 150,
    allow_sub_schedule: false,
    penalty_rate: 0,
    penalty_type: 'none',
    requires_approval: false,
    allow_top_up: true,
    allow_reschedule: true,
    processing_fee_type: 'none',
    processing_fee_value: 0,
    loan_portfolio_account_id: null,
    interest_income_account_id: null,
    interest_receivable_account_id: null,
    penalty_income_account_id: null,
    penalty_receivable_account_id: null,
    disbursement_account_id: null,
    charges_income_account_id: null,
    charges_receivable_account_id: null,
    is_active: false,
    penalty_rules: [],
  }
}

export function useLoanProductForm() {
  const route = useRoute()
  const router = useRouter()

  // ─── Mode & state ─────────────────────────────────────────────────────────
  const isEditing = computed(() => !!route.params.id)
  const loading = ref(false)
  const saving = ref(false)
  const previewLoading = ref(false)
  const errors = ref<Record<string, any>>({})
  const preview = ref<LoanProductPreview | null>(null)
  const previewAmount = ref<number | null>(null)
  const previewTerm = ref<number | null>(null)

  const form = ref<LoanProduct>(createDefaultForm())
  const documentTypes = ref<DocumentTypeOption[]>([])
  let previewTimer: ReturnType<typeof setTimeout> | null = null

  // ─── Accounts (for accounting mapping selectors) ───────────────────────────
  const accounts = ref<{ id: number; name: string }[]>([])
  const rawAccounts = ref<any[]>([])

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
    } catch {
      toast.error('Failed to load chart of accounts.')
    }
  }

  async function fetchDocumentTypes() {
    try {
      const res = await loanProductsApi.documentTypes({ active_only: true })
      documentTypes.value = res.data?.data ?? []
    } catch {
      toast.error('Failed to load document types.')
    }
  }

  function autoFillAccounts() {
    if (!rawAccounts.value.length) return

    function match(type: string, ...keywords: string[][]): number | null {
      const found = rawAccounts.value.find((a: any) => {
        if (a.account_type !== type) return false
        const hay = `${a.name} ${a.account_subtype ?? ''}`.toLowerCase()
        return keywords.every((group) => group.some((kw) => hay.includes(kw)))
      })
      return found ? found.id : null
    }

    const slots: Array<{ field: keyof LoanProduct; type: string; keywords: string[][] }> = [
      { field: 'loan_portfolio_account_id', type: 'ASSET', keywords: [['loan', 'portfolio']] },
      { field: 'interest_income_account_id', type: 'INCOME', keywords: [['interest']] },
      {
        field: 'interest_receivable_account_id',
        type: 'ASSET',
        keywords: [['interest'], ['receivable']],
      },
      { field: 'disbursement_account_id', type: 'ASSET', keywords: [['bank', 'cash']] },
      { field: 'penalty_income_account_id', type: 'INCOME', keywords: [['penalty', 'fine']] },
      {
        field: 'penalty_receivable_account_id',
        type: 'ASSET',
        keywords: [['penalty'], ['receivable']],
      },
      { field: 'charges_income_account_id', type: 'INCOME', keywords: [['charge', 'fee']] },
      {
        field: 'charges_receivable_account_id',
        type: 'ASSET',
        keywords: [['charge'], ['receivable']],
      },
    ]

    for (const slot of slots) {
      if (form.value[slot.field] != null) continue // already set — never overwrite
      const id = match(slot.type, ...slot.keywords)
      if (id !== null) (form.value as any)[slot.field] = id
    }
  }

  // ─── Load (edit mode) ─────────────────────────────────────────────────────
  async function loadProduct() {
    if (!isEditing.value) return
    loading.value = true
    try {
      const res = await loanProductsApi.get(Number(route.params.id))
      const p = res.data?.data ?? res.data
      const existingRules = p.penalty_rules ?? []

      // Migrate global penalty to a penalty rule if the product had one
      // but no rules exist yet (backward compatibility with old system)
      if (
        existingRules.length === 0 &&
        p.penalty_type &&
        p.penalty_type !== 'none' &&
        Number(p.penalty_rate) > 0
      ) {
        existingRules.push({
          penalty_type: p.penalty_type,
          penalty_rate: p.penalty_rate,
          grace_days: null,
          amount: null,
        })
      }

      form.value = {
        ...createDefaultForm(),
        ...p,
        penalty_rules: existingRules,
        required_documents: p.required_documents ?? [],
        // Always reset legacy global penalty fields to safe defaults
        penalty_type: 'none',
        penalty_rate: 0,
      }
      previewAmount.value = Number(p.min_amount ?? 0) || null
      previewTerm.value = p.loan_duration ?? null
    } catch (err: any) {
      toast.error('Failed to load loan product.')
      router.push({ name: 'tenant-settings-loan-products' })
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await Promise.all([loadProduct(), fetchAccounts(), fetchDocumentTypes()])
    autoFillAccounts()
  })

  // ─── Penalty rules ────────────────────────────────────────────────────────
  function addPenaltyRule() {
    form.value.penalty_rules!.push({
      penalty_type: '',
      penalty_rate: null,
      grace_days: null,
      amount: null,
    })
  }

  function removePenaltyRule(index: number) {
    form.value.penalty_rules!.splice(index, 1)
  }

  function addRequiredDocument() {
    form.value.required_documents ??= []
    form.value.required_documents.push({
      document_type_id: null,
      required_stage: 'submission',
      sort_order: form.value.required_documents.length,
      is_required: true,
      is_active: true,
      notes: '',
    })
  }

  function removeRequiredDocument(index: number) {
    form.value.required_documents?.splice(index, 1)
    form.value.required_documents?.forEach((row, idx) => {
      row.sort_order = idx
    })
  }

  // ─── Validation helpers ───────────────────────────────────────────────────
  function fieldError(field: string): string | null {
    const val = errors.value[field]
    return Array.isArray(val) ? val[0] : (val ?? null)
  }

  function shouldPreview() {
    return !!form.value.interest_method && !!form.value.loan_duration && !!previewAmount.value
  }

  async function refreshPreview() {
    if (!shouldPreview()) {
      preview.value = null
      return
    }

    previewLoading.value = true
    try {
      const res = await loanProductsApi.preview({
        ...form.value,
        preview_amount: previewAmount.value,
        preview_term: previewTerm.value ?? form.value.loan_duration,
      })
      preview.value = res.data?.data ?? null
    } catch (err: any) {
      preview.value = null
    } finally {
      previewLoading.value = false
    }
  }

  // ─── Auto-generate code from name (create mode only) ─────────────────────
  watch(
    () => form.value.name,
    (name) => {
      if (isEditing.value) return
      form.value.code = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24)
    },
  )

  // ─── Sync previewTerm with loan_duration automatically ────────────────────
  watchEffect(() => {
    if (form.value.loan_duration && !previewTerm.value) {
      previewTerm.value = form.value.loan_duration
    }
  })

  watch(
    () => form.value.loan_duration,
    (val) => {
      previewTerm.value = val ?? null
    },
  )

  watch(
    [
      () => form.value.min_amount,
      () => form.value.interest_rate,
      () => form.value.interest_method,
      () => form.value.repayment_structure,
      () => form.value.interest_period,
      () => form.value.loan_duration,
      () => form.value.repayment_cycle,
      previewAmount,
      previewTerm,
    ],
    () => {
      if (previewTimer) clearTimeout(previewTimer)
      previewTimer = setTimeout(() => {
        void refreshPreview()
      }, 250)
    },
  )

  // ─── Save ─────────────────────────────────────────────────────────────────
  async function save() {
    saving.value = true
    errors.value = {}
    try {
      // Ensure legacy global penalty fields are always reset.
      // Penalty configuration is now managed entirely through penalty_rules.
      const payload = {
        ...form.value,
        penalty_type: 'none',
        penalty_rate: 0,
      }

      if (isEditing.value) {
        await loanProductsApi.update(Number(route.params.id), payload)
        toast.success('Loan product updated successfully.')
      } else {
        await loanProductsApi.create(payload)
        toast.success('Loan product created successfully.')
      }
      router.push({ name: 'tenant-settings-loan-products' })
    } catch (err: any) {
      if (err?.response?.status === 422) {
        errors.value = err.response.data.errors ?? {}
      } else {
        toast.error(err?.response?.data?.message ?? 'Failed to save loan product.')
      }
    } finally {
      saving.value = false
    }
  }

  return {
    isEditing,
    loading,
    saving,
    errors,
    form,
    accounts,
    documentTypes,
    preview,
    previewLoading,
    previewAmount,
    previewTerm,
    refreshPreview,
    addPenaltyRule,
    removePenaltyRule,
    addRequiredDocument,
    removeRequiredDocument,
    fieldError,
    save,
  }
}
