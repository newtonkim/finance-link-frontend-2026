<template>
  <div class="card shadow-md px-4 py-3 bg-white dark:bg-neutral-800 rounded-md" style="overflow: auto;height: 88%;">
    <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-3" v-model:form="fields" />
    <ChartOfAccountForm
      v-model:open="creatingAccount.open"
      locked-account-type="INCOME"
      default-parent-gl-code="42000"
      :prefill-name="creatingAccount.prefillName"
      require-parent
      @saved="onAccountSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, reactive, ref } from 'vue'
import { Form } from '@/Global'
import { savingsProductsApi } from '@/tenant/apis/savingsProducts/api'
import {
  APPLICATION_OPTIONS,
  CHARGE_TYPE_OPTIONS,
  INTERVAL_TYPE_OPTIONS,
  IS_FINE_OPTIONS,
  IS_REVENUE_OPTIONS,
} from '../constants'
import IncomeAccountSelect from './components/IncomeAccountSelect.vue'
import ChartOfAccountForm from '@/tenant/modules/accounting/components/ChartOfAccountForm.vue'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'vue-sonner'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})

const profileStore = useProfileStore()

const refreshIncomeAccounts = ref(0)
const autoSelectId = ref<number | null>(null)
const creatingAccount = ref<{ open: boolean; prefillName: string }>({
  open: false,
  prefillName: '',
})

// Permission gating is temporarily off so the inline-create footer shows for
// every authenticated user. Re-enable by switching back to a profileStore
// hasPermission(...) check once the chart-of-accounts permission set is seeded.
const canCreateCoa = computed(() => true)

// IMPORTANT: DynamicForm renders `<component v-bind="field.componentProps ?? {}" />`,
// which spreads the object as props. If we use `computed(() => ({...}))` here the
// nested IncomeAccountSelect ends up receiving the ref object itself (no auto-unwrap
// because it's an array-item field, not a top-level template binding), so canCreate
// stays false and the inline-create footer never renders. Use a reactive object with
// getters so every property read is reactive AND already unwrapped.
const incomeAccountComponentProps = reactive({
  get canCreate() {
    return canCreateCoa.value
  },
  get refreshTrigger() {
    return refreshIncomeAccounts.value
  },
  get autoSelectId() {
    return autoSelectId.value
  },
  onRequestCreate(payload: { prefillName: string }) {
    creatingAccount.value = { open: true, prefillName: payload.prefillName }
  },
})

const fields = ref<any[]>([
  {
    label: 'Is it a revenue',
    name: 'is_revenue',
    type: 'select',
    required: true,
    options: IS_REVENUE_OPTIONS,
    placeholder: 'Select option',
  },
  {
    label: 'Charge Name',
    name: 'name',
    type: 'text',
    required: true,
    placeholder: 'Enter charge name',
  },
  {
    label: 'Application',
    name: 'application',
    type: 'select',
    required: true,
    options: APPLICATION_OPTIONS,
    placeholder: 'Select application',
  },
  {
    label: 'Saving Products',
    name: 'saving_product_ids',
    type: 'multi-select',
    dependsOn: {
      field: 'application',
      value: 'on_registration',
    },
    options: [],
    placeholder: 'Choose saving products',
  },
  {
    label: 'Loan Products',
    name: 'loan_product_ids',
    type: 'multi-select',
    dependsOn: {
      conditions: [
        { field: 'application', value: 'on_loan_application' },
        { field: 'where_to_apply', value: 'loans' },
      ],
      operator: 'or',
    },
    url: 'global/loan-products',
    dataOnMount: true,
    placeholder: 'Choose loan products',
  },
  {
    label: 'Charge Type',
    name: 'charge_type',
    type: 'select',
    options: CHARGE_TYPE_OPTIONS,
    placeholder: 'Select type',
    change: (val: string) => {
      const amountField = fields.value.find((f: any) => f.name === 'amount')
      if (!amountField) return
      if (val === 'percentage') {
        amountField.label = 'Percentage (%)'
        amountField.placeholder = 'Enter percentage (0 - 100)'
      } else {
        amountField.label = 'Amount'
        amountField.placeholder = 'Enter amount'
      }
    },
  },
  {
    label: 'Amount',
    name: 'amount',
    type: 'number',
    required: true,
    placeholder: 'Enter amount',
  },
  {
    label: 'Interval Type',
    name: 'interval_type',
    type: 'select',
    options: INTERVAL_TYPE_OPTIONS,
    dependsOn: {
      field: 'application',
      value: 'other',
    },
  },
  {
    label: 'Interval',
    name: 'interval',
    type: 'number',
    dependsOn: {
      field: 'application',
      value: 'other',
    },
    placeholder: 'Enter interval',
  },
  {
    label: 'Is Fine?',
    name: 'is_fine',
    type: 'select',
    options: IS_FINE_OPTIONS,
    dependsOn: {
      field: 'where_to_apply',
      value: 'loans',
    },
  },
  {
    label: 'Credit Account',
    name: 'credit_account_id',
    type: 'component',
    component: markRaw(IncomeAccountSelect),
    componentProps: incomeAccountComponentProps,
    condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val),
  },
])

function promtValueOnUpdate() {
  if (!props.data) return
  Object.entries(props.data).forEach(([key, value]) => {
    const field = fields.value.find((f: any) => f.name === key)
    if (field) (field as any).value = value
  })
}

async function fetchSavingProducts() {
  try {
    const res = await savingsProductsApi.list()
    const data = res.data?.data ?? res.data ?? []
    const field = fields.value.find((f: any) => f.name === 'saving_product_ids')
    if (field)
      field.options = Array.isArray(data)
        ? data.map((p: any) => ({ id: p.id, name: p.name ?? `Product ${p.id}` }))
        : []
  } catch {
    // surface left empty intentionally
  }
}

function onAccountSaved(account: {
  id: number
  gl_code: string
  name: string
  account_type: string
  parent_id: number | null
}) {
  creatingAccount.value.open = false
  refreshIncomeAccounts.value += 1
  autoSelectId.value = account.id
  toast.success(`Created income account ${account.gl_code} - ${account.name}`)
}

onMounted(() => {
  promtValueOnUpdate()
  fetchSavingProducts()
})
</script>