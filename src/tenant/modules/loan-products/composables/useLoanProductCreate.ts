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
import { loanChargesApi, type LoanCharge } from '../../../apis/loanCharges/api'

export type LoanProductGlField =
  | 'loan_portfolio_account_id'
  | 'interest_income_account_id'
  | 'interest_receivable_account_id'
  | 'disbursement_account_id'
  | 'penalty_income_account_id'
  | 'penalty_receivable_account_id'
  | 'charges_income_account_id'
  | 'charges_receivable_account_id'

// Single source of truth for the Accounting Mapping section's GL fields.
// Consumed by autoFillAccounts (replacing the previous inline `slots` array)
// AND by the page template (v-for) so the field list stays DRY.
export interface GlFieldMeta {
  field: LoanProductGlField
  type: 'ASSET' | 'INCOME'
  parent_gl_code: string
  label: string
  placeholder: string
}

export const GL_FIELD_META: readonly GlFieldMeta[] = [
  { field: 'loan_portfolio_account_id', type: 'ASSET', parent_gl_code: '11300', label: 'Loan Portfolio Account', placeholder: 'Select loan portfolio account' },
  { field: 'interest_income_account_id', type: 'INCOME', parent_gl_code: '41100', label: 'Interest Income Account', placeholder: 'Select interest income account' },
  { field: 'interest_receivable_account_id', type: 'ASSET', parent_gl_code: '11500', label: 'Interest Receivable Account', placeholder: 'Select interest receivable account' },
  { field: 'disbursement_account_id', type: 'ASSET', parent_gl_code: '11100', label: 'Disbursement Account', placeholder: 'Select disbursement account' },
  { field: 'penalty_income_account_id', type: 'INCOME', parent_gl_code: '41400', label: 'Penalty Income Account', placeholder: 'Select penalty income account' },
  { field: 'penalty_receivable_account_id', type: 'ASSET', parent_gl_code: '11600', label: 'Penalty Receivable Account', placeholder: 'Select penalty receivable account' },
  { field: 'charges_income_account_id', type: 'INCOME', parent_gl_code: '42000', label: 'Charges Income Account', placeholder: 'Select charges income account' },
  { field: 'charges_receivable_account_id', type: 'ASSET', parent_gl_code: '11700', label: 'Charges Receivable Account', placeholder: 'Select charges receivable account' },
]

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
    penalty_rate: 0,
    penalty_type: 'none',
    penalty_grace_days: 0,
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
    charge_ids: [],
    committee_voting: {
      enabled: false,
      quorum_size: 3 as number | null,
      approval_threshold: 2 as number | null,
    },
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

  function normalizePenaltyRules(rules: any[] | null | undefined) {
    if (!Array.isArray(rules)) return []

    return rules.map((rule) => ({
      ...rule,
      grace_days: Math.max(0, Number(rule?.grace_days ?? 0)),
    }))
  }

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

  // ─── Charges (for fee/penalty selector) ─────────────────────────────────────
  const charges = ref<LoanCharge[]>([])
  const normalizedCharges = computed<LoanCharge[]>(() => {
    if (Array.isArray(charges.value)) return charges.value

    const fallback = charges.value as any
    if (Array.isArray(fallback?.data)) return fallback.data
    if (Array.isArray(fallback?.items)) return fallback.items
    if (Array.isArray(fallback?.results)) return fallback.results

    return []
  })

  const chargeOptions = computed(() =>
    normalizedCharges.value
      .filter((c) => c.is_active)
      .map((c) => ({
        id: c.id,
        name: `${c.name} (${c.charge_type === 'percentage' ? c.value + '%' : c.value})`,
      })),
  )

  const glAccountWarnings = computed(() => {
    const selectedCharges = normalizedCharges.value.filter((c) =>
      form.value.charge_ids?.includes(c.id),
    )
    const warnings: Record<string, string> = {}

    const hasPenalty = selectedCharges.some(
      (c) => c.category === 'penalty' || c.category === 'late_fee',
    )
    const hasProcessingFee = selectedCharges.some((c) => c.category === 'processing_fee')

    if (hasPenalty) {
      if (!form.value.penalty_income_account_id) {
        warnings.penalty_income_account_id =
          'Required — penalty charges are assigned. Select a Penalty Income Account below.'
      }
      if (!form.value.penalty_receivable_account_id) {
        warnings.penalty_receivable_account_id =
          'Required — penalty charges are assigned. Select a Penalty Receivable Account below.'
      }
    }

    if (hasProcessingFee) {
      if (!form.value.charges_income_account_id) {
        warnings.charges_income_account_id =
          'Required — processing fee is assigned. Select a Charges Income Account below.'
      }
      if (!form.value.charges_receivable_account_id) {
        warnings.charges_receivable_account_id =
          'Required — processing fee is assigned. Select a Charges Receivable Account below.'
      }
    }

    return warnings
  })

  const estimatedFees = computed(() => {
    const selectedCharges = normalizedCharges.value.filter((c) =>
      form.value.charge_ids?.includes(c.id),
    )
    const loanAmount = Number(previewAmount.value || form.value.min_amount || 0)

    let processingFees = 0
    let estimatedPenalties = 0
    const breakdown: { name: string; category: string; amount: number; type: string }[] = []

    for (const charge of selectedCharges) {
      const val = Number(charge.value)
      let amount = 0
      if (charge.charge_type === 'percentage') {
        amount = (val / 100) * loanAmount
      } else {
        amount = val
      }

      if (
        charge.category === 'processing_fee' ||
        charge.category === 'appraisal_fee' ||
        charge.category === 'disbursement_fee'
      ) {
        processingFees += amount
      } else if (charge.category === 'penalty' || charge.category === 'late_fee') {
        estimatedPenalties += amount
      } else {
        processingFees += amount
      }

      breakdown.push({
        name: charge.name,
        category: charge.category,
        amount,
        type: charge.charge_type,
      })
    }

    return {
      processingFees,
      estimatedPenalties,
      totalFees: processingFees,
      breakdown,
    }
  })

  async function fetchCharges() {
    try {
      const res = await loanChargesApi.list({ is_active: '1' })
      const payload = res.data?.data ?? res.data ?? []
      charges.value = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.results)
              ? payload.results
              : []
    } catch {
      // Silently fail — charges module may not be deployed yet
      charges.value = []
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

    // Keywords stay local — auto-fill heuristics, not part of the canonical
    // GL_FIELD_META contract that the page template reads from.
    const keywordsByField: Record<string, string[][]> = {
      loan_portfolio_account_id: [['loan', 'portfolio']],
      interest_income_account_id: [['interest']],
      interest_receivable_account_id: [['interest'], ['receivable']],
      disbursement_account_id: [['bank', 'cash']],
      penalty_income_account_id: [['penalty', 'fine']],
      penalty_receivable_account_id: [['penalty'], ['receivable']],
      charges_income_account_id: [['charge', 'fee']],
      charges_receivable_account_id: [['charge'], ['receivable']],
    }

    for (const meta of GL_FIELD_META) {
      if (form.value[meta.field] != null) continue // already set — never overwrite
      const id = match(meta.type, ...(keywordsByField[meta.field] ?? []))
      if (id !== null) (form.value as any)[meta.field] = id
    }
  }

  // ─── Load (edit mode) ─────────────────────────────────────────────────────
  async function loadProduct() {
    if (!isEditing.value) return
    loading.value = true
    try {
      const res = await loanProductsApi.get(Number(route.params.id))
      const p = res.data?.data ?? res.data
      const existingRules = normalizePenaltyRules(p.penalty_rules ?? [])

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
          grace_days: 0,
          amount: null,
        })
      }

      const setting = p.approval_setting ?? null
      form.value = {
        ...createDefaultForm(),
        ...p,
        penalty_rules: normalizePenaltyRules(existingRules),
        required_documents: p.required_documents ?? [],
        charge_ids: p.charge_ids ?? p.charges?.map((c: any) => c.id) ?? [],
        // Always reset legacy global penalty fields to safe defaults
        penalty_type: 'none',
        penalty_rate: 0,
        committee_voting: {
          enabled: !!setting,
          quorum_size: setting?.quorum_size ?? 3,
          approval_threshold: setting?.approval_threshold ?? 2,
        },
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
    await Promise.all([loadProduct(), fetchAccounts(), fetchDocumentTypes(), fetchCharges()])
    autoFillAccounts()
  })

  // ─── Penalty rules ────────────────────────────────────────────────────────
  function addPenaltyRule() {
    form.value.penalty_rules!.push({
      penalty_type: '',
      penalty_rate: null,
      grace_days: 0,
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

  // ─── GL Account Validation ───────────────────────────────────────────────
  function validateGlAccounts(): boolean {
    const selectedCharges = normalizedCharges.value.filter((c) =>
      form.value.charge_ids?.includes(c.id),
    )
    const validationErrors: Record<string, string> = {}

    const hasPenalty = selectedCharges.some(
      (c) => c.category === 'penalty' || c.category === 'late_fee',
    )
    const hasProcessingFee = selectedCharges.some((c) => c.category === 'processing_fee')
    const hasDisbursementFee = selectedCharges.some((c) => c.category === 'disbursement_fee')

    if (hasPenalty) {
      if (!form.value.penalty_income_account_id) {
        validationErrors.penalty_income_account_id =
          'Required: A penalty charge is assigned. Map the Penalty Income Account in Accounting Mapping.'
      }
      if (!form.value.penalty_receivable_account_id) {
        validationErrors.penalty_receivable_account_id =
          'Required: A penalty charge is assigned. Map the Penalty Receivable Account in Accounting Mapping.'
      }
    }

    if (hasProcessingFee) {
      if (!form.value.charges_income_account_id) {
        validationErrors.charges_income_account_id =
          'Required: A processing fee is assigned. Map the Charges Income Account in Accounting Mapping.'
      }
      if (!form.value.charges_receivable_account_id) {
        validationErrors.charges_receivable_account_id =
          'Required: A processing fee is assigned. Map the Charges Receivable Account in Accounting Mapping.'
      }
    }

    if (hasDisbursementFee) {
      if (!form.value.charges_income_account_id) {
        validationErrors.charges_income_account_id =
          'Required: A disbursement fee charge is assigned. Map the Charges Income Account in Accounting Mapping.'
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      errors.value = { ...errors.value, ...validationErrors }
      toast.error('Please map the required GL accounts in Accounting Mapping.')
      return false
    }

    return true
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  async function save() {
    saving.value = true
    errors.value = {}

    // Validate GL accounts before saving
    if (!validateGlAccounts()) {
      saving.value = false
      return
    }

    try {
      // Ensure legacy global penalty fields are always reset.
      // Penalty configuration is now managed entirely through penalty_rules.
      const cv = form.value.committee_voting
      const payload = {
        ...form.value,
        penalty_type: 'none',
        penalty_rate: 0,
        penalty_rules: normalizePenaltyRules(form.value.penalty_rules),
        approval_setting: cv?.enabled
          ? { enabled: true, quorum_size: cv.quorum_size, approval_threshold: cv.approval_threshold }
          : { enabled: false, quorum_size: null, approval_threshold: null },
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
    charges,
    chargeOptions,
    glAccountWarnings,
    estimatedFees,
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
    fetchAccounts,
  }
}
