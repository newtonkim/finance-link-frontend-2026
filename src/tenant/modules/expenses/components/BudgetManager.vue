<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useExpenseApi } from '@/tenant/apis/expenses/expenseApi'
import { RefreshCw, Save, Calculator } from 'lucide-vue-next'
import { notify } from '@/Global/Toasters'

const expenseApi = useExpenseApi() as ReturnType<typeof useExpenseApi>

interface Category {
  id: number
  name: string
}

interface Budget {
  expense_category_id: number
  allocated_amount: number
  spent_amount: number
  fiscal_year: string
  period_code: string | null
  branch_id: number | null
}

defineProps<{
  mode: 'Expenses' | 'Categories' | 'Budgets'
}>()

const fiscalYear = ref(new Date().getFullYear().toString())
const period = ref<string | null>(null) // null means full year
const loading = ref(false)
const saving = ref(false)
const budgets = ref<Budget[]>([])
const categories = ref<Category[]>([])

const periods = [
  { label: 'Full Year', value: null },
  { label: 'January', value: '-01' },
  { label: 'February', value: '-02' },
  { label: 'March', value: '-03' },
  { label: 'April', value: '-04' },
  { label: 'May', value: '-05' },
  { label: 'June', value: '-06' },
  { label: 'July', value: '-07' },
  { label: 'August', value: '-08' },
  { label: 'September', value: '-09' },
  { label: 'October', value: '-10' },
  { label: 'November', value: '-11' },
  { label: 'December', value: '-12' },
]



const currentPeriodCode = computed(() => {
  return period.value ? `${fiscalYear.value}${period.value}` : null
})

const fetchBudgets = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const res = await expenseApi.getExpenseBudgets(fiscalYear.value) as Record<string, unknown>
    let allBudgets: Budget[] = []

    if (res?.data && Array.isArray(res.data)) {
      allBudgets = res.data as Budget[]
    } else if (res?.payload && typeof res.payload === 'object' && 'data' in (res.payload as object)) {
      const payload = res.payload as Record<string, unknown>
      if (Array.isArray(payload.data)) {
        allBudgets = payload.data as Budget[]
      }
    } else if (Array.isArray(res)) {
      allBudgets = res as Budget[]
    }

    interface RawBudget {
      allocated_amount?: string | number
      spent_amount?: string | number
      period_code?: string | null
    }

    allBudgets = (allBudgets as RawBudget[]).map((b: RawBudget) => ({
      ...b,
      allocated_amount: Number(b.allocated_amount || 0),
      spent_amount: Number(b.spent_amount || 0)
    })) as unknown as Budget[]

    budgets.value = allBudgets.filter((b: Budget) => b.period_code === currentPeriodCode.value)
  } catch (error) {
    console.error('Failed to fetch budgets', error)
  } finally {
    if (!silent) loading.value = false
  }
}

const getBudget = (categoryId: number) => {
  return budgets.value.find(b => b.expense_category_id === categoryId)
}

const getBudgetValue = (categoryId: number) => {
  const budget = getBudget(categoryId)
  return budget ? budget.allocated_amount : 0
}

const getBudgetUtilization = (categoryId: number) => {
  const budget = getBudget(categoryId)
  if (!budget || !budget.allocated_amount || parseFloat(String(budget.allocated_amount)) <= 0) return 0
  const spent = parseFloat(String(budget.spent_amount || 0))
  const allocated = parseFloat(String(budget.allocated_amount))
  return Math.round((spent / allocated) * 100)
}

const getUtilizationColor = (percent: number) => {
  if (percent >= 100) return 'bg-rose-600'
  if (percent >= 90) return 'bg-rose-500'
  if (percent >= 75) return 'bg-amber-500'
  return 'bg-emerald-500'
}

const updateBudgetValue = (categoryId: number, amount: number) => {
  const index = budgets.value.findIndex(b => b.expense_category_id === categoryId)
  if (index !== -1) {
    budgets.value[index].allocated_amount = amount
  } else {
    budgets.value.push({
      expense_category_id: categoryId,
      allocated_amount: amount,
      spent_amount: 0,
      fiscal_year: fiscalYear.value,
      period_code: currentPeriodCode.value,
      branch_id: null
    })
  }
}

const saveAllBudgets = async () => {
  saving.value = true
  try {
    const allocations = budgets.value
      .filter(b => b.allocated_amount > 0)
      .map(b => ({
        expense_category_id: b.expense_category_id,
        allocated_amount: b.allocated_amount,
        fiscal_year: fiscalYear.value,
        period_code: currentPeriodCode.value,
        branch_id: b.branch_id
      }))

    if (allocations.length === 0) {
      notify({ msg: 'No budget amounts to save.', type: 'error' })
      return
    }

    const response = await expenseApi.allocateExpenseBudgets(allocations)
    const isSuccess = !response?.error && (response?.code === undefined || (Number(response?.code) >= 200 && Number(response?.code) < 300))

    if (isSuccess) {
      notify({ msg: 'Budgets saved successfully', type: 'success' })
      await fetchBudgets(true)
    } else {
      const errorData = (response?.error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const msg = errorData?.message || (errorData?.errors ? Object.values(errorData.errors).flat()[0] : null) || 'Failed to save budgets'
      notify({ msg, type: 'error' })
    }
  } catch (error) {
    console.error('Failed to save budgets', error)
    notify({ msg: 'Failed to save budgets', type: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  const res = await expenseApi.getExpenseCategories() as Record<string, unknown>

  if (res?.payload && typeof res.payload === 'object' && 'data' in (res.payload as object)) {
    const payload = res.payload as Record<string, unknown>
    if (Array.isArray(payload.data)) {
      categories.value = payload.data as Category[]
    }
  } else if (res?.data && Array.isArray(res.data)) {
    categories.value = res.data as Category[]
  }

  await fetchBudgets()
  loading.value = false
})
</script>

<template>
  <div class="space-y-6 p-4 md:p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
          <Calculator class="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">Budget Planning</h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Allocate spending limits for each category</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Mode Switcher -->
        <div class="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg gap-1 border border-neutral-200 dark:border-neutral-700">
          <button @click="$emit('update:mode', 'Expenses')" class="px-4 py-1 text-xs font-bold rounded-md text-neutral-400 hover:text-neutral-600">Expenses</button>
          <button @click="$emit('update:mode', 'Categories')" class="px-4 py-1 text-xs font-bold rounded-md text-neutral-400 hover:text-neutral-600">Categories</button>
          <button class="px-4 py-1 text-xs font-bold rounded-md bg-amber-500 text-white shadow-sm">Budgets</button>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-bold text-neutral-400 uppercase ml-1">Fiscal Year</label>
          <select v-model="fiscalYear" @change="() => fetchBudgets()" class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-bold text-neutral-400 uppercase ml-1">Budget Period</label>
          <select v-model="period" @change="() => fetchBudgets()" class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
            <option v-for="p in periods" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-3 self-end">
        <button @click="saveAllBudgets" :disabled="saving" class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#002e35] disabled:opacity-50 dark:bg-nfuko-yellow dark:text-[#1d4780]">
          <RefreshCw v-if="saving" class="h-4 w-4 animate-spin" />
          <Save v-else class="h-4 w-4" />
          Save All Budgets
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
        <p class="text-[10px] font-bold text-neutral-400 uppercase mb-1">Total Allocated</p>
        <p class="text-xl font-black text-neutral-900 dark:text-white">UGX {{ budgets.reduce((acc, b) => acc + b.allocated_amount, 0).toLocaleString() }}</p>
      </div>
      <div class="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
        <p class="text-[10px] font-bold text-neutral-400 uppercase mb-1">Total Spent</p>
        <p class="text-xl font-black text-neutral-900 dark:text-white">UGX {{ budgets.reduce((acc, b) => acc + b.spent_amount, 0).toLocaleString() }}</p>
      </div>
      <div :class="['p-5 rounded-2xl border shadow-sm',
        (budgets.reduce((acc, b) => acc + b.allocated_amount, 0) - budgets.reduce((acc, b) => acc + b.spent_amount, 0)) < 0
        ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30'
        : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30']">
        <p class="text-[10px] font-bold text-neutral-400 uppercase mb-1">Overall Remaining</p>
        <p :class="['text-xl font-black',
          (budgets.reduce((acc, b) => acc + b.allocated_amount, 0) - budgets.reduce((acc, b) => acc + b.spent_amount, 0)) < 0
          ? 'text-rose-600' : 'text-emerald-600']">
          UGX {{ (budgets.reduce((acc, b) => acc + b.allocated_amount, 0) - budgets.reduce((acc, b) => acc + b.spent_amount, 0)).toLocaleString() }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <RefreshCw class="h-10 w-10 text-nfuko-primary animate-spin mb-4" />
      <p class="text-sm text-neutral-500 font-bold uppercase tracking-widest">Loading Budget Data...</p>
    </div>

    <div v-else-if="categories.length === 0" class="flex flex-col items-center justify-center py-20 text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
      <Calculator class="h-12 w-12 mb-3 opacity-20" />
      <p class="text-sm">No expense categories found. Create categories first.</p>
    </div>

    <div v-else class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
      <!-- Table header -->
      <div class="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_2fr] gap-0 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
        <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Category</span>
        <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Allocate (UGX)</span>
        <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Spent</span>
        <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Remaining</span>
        <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-4">Utilization</span>
      </div>

      <!-- Table rows -->
      <div class="divide-y divide-neutral-50 dark:divide-neutral-800">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_2fr] gap-0 items-center px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
        >
          <!-- Category name -->
          <div class="flex items-center gap-2 min-w-0 pr-4">
            <div class="h-2 w-2 rounded-full flex-shrink-0" :class="getBudgetValue(cat.id) > 0 ? getUtilizationColor(getBudgetUtilization(cat.id)) : 'bg-neutral-200 dark:bg-neutral-700'"></div>
            <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">{{ cat.name }}</span>
          </div>

          <!-- Allocated input -->
          <div class="pr-4">
            <input
              type="number"
              :value="getBudgetValue(cat.id) || ''"
              @input="e => updateBudgetValue(cat.id, Number((e.target as HTMLInputElement).value))"
              class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-semibold text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-nfuko-yellow"
              placeholder="0"
              min="0"
            />
          </div>

          <!-- Spent -->
          <div class="text-right pr-4">
            <span class="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
              {{ (getBudget(cat.id)?.spent_amount || 0).toLocaleString() }}
            </span>
          </div>

          <!-- Remaining -->
          <div class="text-right pr-4">
            <span
              :class="[
                'text-sm font-bold',
                getBudgetValue(cat.id) <= 0
                  ? 'text-neutral-400'
                  : (Number(getBudgetValue(cat.id)) - (getBudget(cat.id)?.spent_amount || 0)) < 0
                    ? 'text-rose-600'
                    : 'text-emerald-600'
              ]"
            >
              {{ getBudgetValue(cat.id) > 0 ? Math.max(0, Number(getBudgetValue(cat.id)) - (getBudget(cat.id)?.spent_amount || 0)).toLocaleString() : '—' }}
            </span>
          </div>

          <!-- Utilization bar -->
          <div class="pl-4">
            <template v-if="getBudgetValue(cat.id) > 0">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    :class="['h-full rounded-full transition-all duration-500', getUtilizationColor(getBudgetUtilization(cat.id))]"
                    :style="{ width: `${Math.min(getBudgetUtilization(cat.id), 100)}%` }"
                  ></div>
                </div>
                <span
                  :class="[
                    'text-[10px] font-bold w-8 text-right',
                    getBudgetUtilization(cat.id) >= 90 ? 'text-rose-600' :
                    getBudgetUtilization(cat.id) >= 75 ? 'text-amber-600' : 'text-emerald-600'
                  ]"
                >{{ getBudgetUtilization(cat.id) }}%</span>
              </div>
            </template>
            <span v-else class="text-[10px] font-bold text-neutral-300 dark:text-neutral-600 uppercase">Not set</span>
          </div>
        </div>
      </div>

      <!-- Footer summary -->
      <div class="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_2fr] gap-0 items-center px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
        <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{{ categories.length }} Categories</span>
        <span class="text-xs font-black text-neutral-700 dark:text-neutral-200">
          {{ budgets.reduce((acc, b) => acc + b.allocated_amount, 0).toLocaleString() }}
        </span>
        <span class="text-xs font-black text-neutral-700 dark:text-neutral-200 text-right pr-4">
          {{ budgets.reduce((acc, b) => acc + b.spent_amount, 0).toLocaleString() }}
        </span>
        <span :class="[
          'text-xs font-black text-right pr-4',
          (budgets.reduce((acc, b) => acc + b.allocated_amount, 0) - budgets.reduce((acc, b) => acc + b.spent_amount, 0)) < 0
            ? 'text-rose-600' : 'text-emerald-600'
        ]">
          {{ (budgets.reduce((acc, b) => acc + b.allocated_amount, 0) - budgets.reduce((acc, b) => acc + b.spent_amount, 0)).toLocaleString() }}
        </span>
        <span></span>
      </div>
    </div>
  </div>
</template>
