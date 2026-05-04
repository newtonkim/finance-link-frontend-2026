<template>
  <TableDrawer :automaticCreate="false" ref="drawer" drawerWidth="w-1/2" :show-add-button="false" :url="tableUrl"
    method="get" state="expenseList" :drawerTitle="automaticCreate?.[activeAction]?.['title'] ?? 'Expense Management'"
    :columns="columns" @save="saveExpense" :showTableAction="true">
    <template #add-action="">
      <Button v-if="mode === 'Categories'" @click="OpenThedrawer('create category')"
        class="bg-nfuko-action text-white shadow-md">
        <Plus class="w-4 h-4 mr-2" />
        New Category
      </Button>
      <Button v-else @click="OpenThedrawer('record expense')" class="bg-nfuko-primary text-white shadow-md">
        <Plus class="w-4 h-4 mr-2" />
        Record Expense
      </Button>
    </template>
    <template #sub-header>
      <AnalysisTile v-if="mode !== 'Categories'" :data="stats" grid-class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3" />
    </template>
    <template #header-action>
      <PainPageHeader title="Expense Management" dec="Record and track all institutional expenses." />
    </template>
    <template #searchSideAction>
      <div class="flex items-center gap-3">
        <!-- Mode Switcher (Expenses vs Categories) -->
        <div
          class="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg gap-1 border border-neutral-200 dark:border-neutral-700">
          <button @click="mode = 'Expenses'" :class="[
            'px-4 py-1 text-xs font-bold rounded-md transition-all duration-200',
            mode !== 'Categories'
              ? 'bg-nfuko-primary text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-600'
          ]">
            Expenses
          </button>
          <button @click="mode = 'Categories'" :class="[
            'px-4 py-1 text-xs font-bold rounded-md transition-all duration-200',
            mode === 'Categories'
              ? 'bg-nfuko-action text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-600'
          ]">
            Categories
          </button>
        </div>

        <!-- Status Filters (Only for Expenses) -->
        <StatusButtonsHorizontal v-if="mode !== 'Categories'" v-memo="[mode, expenseStatus]" :maxLength="10"
          :filters="['All', 'Pending', 'Approved', 'Paid', 'Rejected']" v-model="expenseStatus"
          @update:modelValue="(e) => { expenseStatus = e }" />

      </div>

    </template>
    <template #status="{ item }">
      <Badge :variant="getStatusVariant(item.status) as any" :class="getStatusClass(item.status)">
        {{ item.status }}
      </Badge>
    </template>

    <template #actions="{ item }">
      <div class="flex justify-center gap-2">
        <button v-if="item.status === 'Pending'" @click="handleApprove(item)" title="Approve"
          class="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100">
          <CheckCircle class="w-4 h-4" /> Approve
        </button>
        <button v-if="item.status === 'Approved'" @click="OpenThedrawer('pay', item)" title="Pay"
          class="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100">
          <Wallet class="w-4 h-4" /> Pay
        </button>
        <button v-if="item.status === 'Pending'" @click="OpenThedrawer('record expense', item)" title="Edit"
          class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100">
          <Edit class="w-4 h-4" />
        </button>
      </div>
    </template>

    <template #drawer="{ action, data }">
      <component :is="drawerComponent" :data="{ ...data, action }" v-model:form="formData" />
    </template>
  </TableDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, CheckCircle, Wallet, Edit } from 'lucide-vue-next'
import { AnalysisTile, Badge, scopeValues } from '@/Global'
import ExpenseForm from './components/ExpenseForm.vue'
import CategoryForm from './components/CategoryForm.vue'
import PayExpenseForm from './components/PayExpenseForm.vue'
import { useExpenseApi } from '@/tenant/apis/expenses/expenseApi'
import { formawtacher } from '@/Global/Forminputs/formWatcher'

const { createExpense, createExpenseCategory, getExpenseStats, approveExpense, payExpense, updateExpense } = useExpenseApi()
const formStore = formawtacher()
const drawer = ref<any>(null)
const formData = ref<any>({})
const mode = ref<'Expenses' | 'Categories'>('Expenses')
const expenseStatus = ref<'All' | 'Pending' | 'Approved' | 'Paid' | 'Rejected'>('All')
const activeAction = ref<string>('record expense')
const expenseStats = ref<any>({ total_spent: 0, budget_remaining: 0, pending_approvals: 0 })

const tableUrl = computed(() => {
  if (mode.value === 'Categories') return '/expenses/categories'
  return `/expenses?status=${expenseStatus.value}`
})

const automaticCreate = ref<any>({
  'record expense': {
    title: 'Record New Expense',
    component: ExpenseForm,
    action: (data: any) => submitExpense(data)
  },
  'create category': {
    title: 'Create Expense Category',
    component: CategoryForm,
    action: (data: any) => submitCategory(data)
  },
  'approve': {
    title: 'Approve Expense',
    component: null, // No form needed for simple approval
    action: (data: any) => handleApprove(data)
  },
  'pay': {
    title: 'Record Payment',
    component: PayExpenseForm,
    action: (data: any, submissionData: any) => handlePay(data, submissionData)
  }
})

const columns = computed(() => {
  if (mode.value === 'Categories') {
    return [
      { key: 'name', label: 'Category Name', sticky: 'left' },
      { key: 'parent_account_name', label: 'Parent Account' },
      { key: 'description', label: 'Description' },
      { key: 'created_at', label: 'Created At', type: 'date' },
    ]
  }
  return [
    { key: 'title', label: 'Expense Title', sticky: 'left', copy: true },
    { key: 'reference_no', label: 'Ref #', copy: true },
    { key: 'category_name', label: 'Category' },
    { key: 'vendor_name', label: 'Vendor/Recipient' },
    { key: 'amount', label: 'Amount', type: 'money' },
    { key: 'status', label: 'Status' },
    { key: 'transaction_date', label: 'Date', type: 'date' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ]
})

const drawerComponent = computed(() => automaticCreate.value[activeAction.value]?.component)

function OpenThedrawer(item: string, data: any = null) {
  activeAction.value = item
  formData.value = data ? { ...data } : {}
  setTimeout(() => {
    drawer.value.toggleDrawer()
  }, 100)
}

function isSuccessful(result: any) {
  if (!result) return false
  if (result?.error) return false
  const code = Number(result?.code)
  if (!Number.isNaN(code) && code > 0) return code >= 200 && code < 300
  return true
}

async function fetchStats() {
  const res = await getExpenseStats()
  if (res) expenseStats.value = res
}

async function submitExpense(data: any) {
  formStore.loading = true
  const editingId = formData.value?.id
  const result = editingId ? await updateExpense(editingId, data) : await createExpense(data)
  formStore.loading = false
  if (isSuccessful(result)) {
    drawer.value?.toggleDrawer()
    drawer.value?.refresh()
    fetchStats()
  }
}

async function submitCategory(data: any) {
  formStore.loading = true
  const result = await createExpenseCategory(data)
  formStore.loading = false
  if (isSuccessful(result)) {
    drawer.value?.toggleDrawer()
    drawer.value?.refresh()
  }
}

async function handleApprove(data: any) {
  formStore.loading = true
  const result = await approveExpense(data.id)
  formStore.loading = false
  if (isSuccessful(result)) {
    drawer.value?.refresh()
    fetchStats()
  }
}

async function handlePay(data: any, submissionData: any) {
  // submissionData comes from the form in the drawer (e.g. payment details)
  // data is the original expense record
  formStore.loading = true
  const result = await payExpense(data.id, submissionData)
  formStore.loading = false
  if (isSuccessful(result)) {
    drawer.value?.toggleDrawer()
    drawer.value?.refresh()
    fetchStats()
  }
}

function saveExpense(type: string, data: any) {
  const action = automaticCreate.value[activeAction.value]?.action
  if (action) {
    // data is the array of fields from DynamicForm via tableHelpers
    // We need to convert it to a clean object using scopeValues
    const cleanData = Array.isArray(data) ? scopeValues(data) : data

    if (activeAction.value === 'pay') {
      // For 'pay', formData holds the original record, and 'cleanData' holds the new form values
      action(formData.value, cleanData)
    } else if (['record expense', 'create category'].includes(activeAction.value)) {
      // For these, 'cleanData' is the new form values
      action(cleanData)
    } else {
      // For other actions (like approve), 'data' is the record itself
      action(data)
    }
  }
}

function getStatusVariant(status: string) {
  const variants: Record<string, string> = {
    'Pending': 'outline',
    'Approved': 'secondary',
    'Paid': 'default',
    'Rejected': 'destructive',
    'Draft': 'secondary'
  }
  return variants[status] || 'secondary'
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Approved': 'bg-blue-50 text-blue-700 border-blue-200',
    'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
  }
  return classes[status] || ''
}

const stats = computed(() => [
  {
    title: 'Total Spent (Month)',
    value: expenseStats.value.total_spent,
    trendColor: 'text-rose-500',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
    type: 'money'
  },
  {
    title: 'Budget Remaining',
    value: expenseStats.value.budget_remaining,
    trendColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    type: 'money'
  },
  {
    title: 'Pending Approvals',
    value: expenseStats.value.pending_approvals,
    trendColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    type: 'number'
  }
])

onMounted(fetchStats)

watch(mode, (value) => {
  if (value === 'Expenses') {
    expenseStatus.value = 'All'
  }
})

watch(() => drawer.value?.drawerOpen, (v) => {
  if (!v) {
    formData.value = {}
  }
})
</script>
