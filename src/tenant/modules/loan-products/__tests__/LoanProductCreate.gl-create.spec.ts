/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// ─── Module-level mocks ────────────────────────────────────────────────────
// Pattern mirrors src/tenant/modules/members/__tests__/Create.charges.spec.ts

const fetchAccountsMock = vi.fn().mockResolvedValue(undefined)

vi.mock('septor-store', () => ({ getBearerToken: () => null, pomPinia: () => ({}) }))
vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: { interceptors: { request: { use: vi.fn() } } },
}))
vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} }),
  RouterLink: { template: '<a><slot /></a>' },
}))

// Stub all lucide-vue-next icons used in the page
vi.mock('lucide-vue-next', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
  }
})

vi.mock('@/Global/SearchableSelect.vue', () => ({
  default: {
    name: 'SearchableSelectStub',
    props: ['modelValue', 'options', 'placeholder', 'error', 'disabled'],
    emits: ['update:modelValue'],
    template: '<div data-test="searchable-select-stub" />',
  },
}))
vi.mock('@/Global/MultiSearchableSelect.vue', () => ({
  default: { template: '<div data-test="multi-select-stub" />' },
}))
vi.mock('@/tenant/modules/accounting/components/ChartOfAccountForm.vue', () => ({
  default: {
    name: 'ChartOfAccountFormStub',
    props: ['open', 'lockedAccountType', 'defaultParentGlCode', 'prefillName'],
    emits: ['update:open', 'saved'],
    template: '<div data-test="coa-form-stub" />',
  },
}))

// Stub @/Global barrel — only the named exports the page uses
vi.mock('@/Global', () => ({
  formatMoneyValue: (v: number) => String(v),
  previewMoney: () => '',
}))

// Stub the utils the page imports
vi.mock('../utils/loanProductHelpers', () => ({
  categoryLabel: (cat: string) => cat,
  categoryColor: () => '',
  previewMoney: () => '',
}))

// ─── Composable stub — controls the state the page consumes ──────────────
vi.mock('../composables/useLoanProductCreate', async () => {
  const actual = await vi.importActual<any>('../composables/useLoanProductCreate')
  return {
    ...actual,
    useLoanProductForm: () => {
      const form = ref<Record<string, any>>({
        loan_portfolio_account_id: null,
        interest_income_account_id: null,
        interest_receivable_account_id: null,
        disbursement_account_id: null,
        penalty_income_account_id: null,
        penalty_receivable_account_id: null,
        charges_income_account_id: null,
        charges_receivable_account_id: null,
        name: '',
        code: '',
        description: '',
        is_active: false,
        is_in_use: false,
        loan_count: 0,
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
        penalty_rules: [],
        charge_ids: [],
        committee_voting: { enabled: false, quorum_size: 3, approval_threshold: 2 },
      })
      return {
        isEditing: ref(false),
        loading: ref(false),
        saving: ref(false),
        errors: ref({}),
        form,
        accounts: ref([
          { id: 1, name: '11300 - Loans Receivable' },
          { id: 2, name: '41100 - Interest Income' },
        ]),
        fetchAccounts: fetchAccountsMock,
        documentTypes: ref([]),
        charges: ref([]),
        chargeOptions: ref([]),
        glAccountWarnings: ref({}),
        estimatedFees: ref({ processingFees: 0, estimatedPenalties: 0, totalFees: 0, breakdown: [] }),
        preview: ref(null),
        previewLoading: ref(false),
        previewAmount: ref(0),
        previewTerm: ref(0),
        refreshPreview: vi.fn(),
        addPenaltyRule: vi.fn(),
        removePenaltyRule: vi.fn(),
        addRequiredDocument: vi.fn(),
        removeRequiredDocument: vi.fn(),
        fieldError: () => null,
        save: vi.fn(),
      }
    },
  }
})

import LoanProductCreate from '../pages/LoanProductCreate.vue'

beforeEach(() => {
  fetchAccountsMock.mockClear()
  fetchAccountsMock.mockResolvedValue(undefined)
})

function mountPage() {
  return mount(LoanProductCreate, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

describe('LoanProductCreate — GL inline-create', () => {
  it('renders an AccountInlineCreate trigger for each of the 8 GL fields', () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })
    expect(triggers).toHaveLength(8)
  })

  it('clicking the trigger on loan_portfolio opens the modal with ASSET + 11300', async () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })
    await triggers[0].trigger('click')
    await flushPromises()
    const form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    expect(form.exists()).toBe(true)
    expect(form.props('lockedAccountType')).toBe('ASSET')
    expect(form.props('defaultParentGlCode')).toBe('11300')
  })

  it('clicking the trigger on interest_income opens the modal with INCOME + 41100', async () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })
    await triggers[1].trigger('click')
    await flushPromises()
    const form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    expect(form.props('lockedAccountType')).toBe('INCOME')
    expect(form.props('defaultParentGlCode')).toBe('41100')
  })

  it('emits saved → refetches accounts, sets form field, closes modal', async () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })
    await triggers[0].trigger('click')
    await flushPromises()

    const form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    await form.vm.$emit('saved', {
      id: 99,
      gl_code: '11310',
      name: 'Test Portfolio',
      account_type: 'ASSET',
      parent_id: null,
    })
    await flushPromises()

    expect(fetchAccountsMock).toHaveBeenCalledTimes(1)
    const vm: any = wrapper.vm
    expect(vm.form.loan_portfolio_account_id).toBe(99)
    expect(wrapper.findComponent({ name: 'ChartOfAccountFormStub' }).exists()).toBe(false)
  })

  it('clicking a different trigger after a save opens a fresh modal with new metadata', async () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })

    await triggers[0].trigger('click')
    await flushPromises()
    let form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    await form.vm.$emit('saved', {
      id: 1,
      gl_code: '11310',
      name: 'A',
      account_type: 'ASSET',
      parent_id: null,
    })
    await flushPromises()

    await triggers[1].trigger('click')
    await flushPromises()
    form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    expect(form.props('lockedAccountType')).toBe('INCOME')
    expect(form.props('defaultParentGlCode')).toBe('41100')
  })
})
