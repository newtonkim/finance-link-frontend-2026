<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { SavingsProduct } from '@/tenant/apis/savingsProducts/api'

interface ChartAccount { id: number; name: string; gl_code: string; account_type: string }

const props = defineProps<{
  form: SavingsProduct
  products: SavingsProduct[]
  chartAccounts: ChartAccount[]
}>()

// Display rate as percentage; backend stores as decimal (0.12 = 12%)
const interestRateDisplay = computed({
  get: () => props.form.interest_rate != null ? Number((props.form.interest_rate * 100).toFixed(4)) : '',
  set: (val: string | number) => {
    const n = parseFloat(String(val))
    props.form.interest_rate = isNaN(n) ? null : parseFloat((n / 100).toFixed(6))
  },
})

const showFrequency = computed(() =>
  props.form.interest_payout_type === 'periodic_payout' ||
  props.form.interest_payout_type === 'compound'
)

const showConvertProduct = computed(() =>
  props.form.maturity_action === 'convert_to_savings'
)

const productOptions = computed(() =>
  props.products.filter(p => p.type === 'standard' && p.id !== props.form.id)
)

// --- GL Account searchable comboboxes ---
const expenseQuery = ref('')
const expenseOpen = ref(false)
const payableQuery = ref('')
const payableOpen = ref(false)
const expenseInputRef = ref<HTMLInputElement | null>(null)
const payableInputRef = ref<HTMLInputElement | null>(null)

function accountLabel(a: ChartAccount) {
  return a.gl_code ? `${a.gl_code} — ${a.name}` : a.name
}

function findAccount(id: number | null | undefined): ChartAccount | null {
  return id != null ? (props.chartAccounts.find(a => a.id === id) ?? null) : null
}

// Pre-filter by account type before applying search
const expenseAccounts = computed(() =>
  props.chartAccounts.filter(a => a.account_type === 'EXPENSE')
)

const incomeAccounts = computed(() =>
  props.chartAccounts.filter(a => a.account_type === 'INCOME')
)

const filteredExpense = computed(() => {
  const q = expenseQuery.value.toLowerCase()
  return q
    ? expenseAccounts.value.filter(a => accountLabel(a).toLowerCase().includes(q))
    : expenseAccounts.value
})

const filteredPayable = computed(() => {
  const q = payableQuery.value.toLowerCase()
  return q
    ? incomeAccounts.value.filter(a => accountLabel(a).toLowerCase().includes(q))
    : incomeAccounts.value
})

function openExpense() {
  expenseQuery.value = ''
  expenseOpen.value = true
  nextTick(() => expenseInputRef.value?.focus())
}

function closeExpense() {
  expenseOpen.value = false
  expenseQuery.value = ''
}

function selectExpense(a: ChartAccount) {
  props.form.interest_expense_account_id = a.id
  closeExpense()
}

function onExpenseBlur() {
  window.setTimeout(() => closeExpense(), 150)
}

function openPayable() {
  payableQuery.value = ''
  payableOpen.value = true
  nextTick(() => payableInputRef.value?.focus())
}

function closePayable() {
  payableOpen.value = false
  payableQuery.value = ''
}

function selectPayable(a: ChartAccount) {
  props.form.interest_payable_account_id = a.id
  closePayable()
}

function onPayableBlur() {
  window.setTimeout(() => closePayable(), 150)
}

// Auto-select sensible defaults when chart of accounts loads.
// Only applies when creating a new product (form fields are null).
watch(() => props.chartAccounts, (accounts) => {
  if (!accounts.length) return
  if (!props.form.interest_expense_account_id) {
    const match = accounts.find(a =>
      a.account_type === 'EXPENSE' && a.name.toLowerCase().includes('interest expense')
    )
    if (match) props.form.interest_expense_account_id = match.id
  }
  if (!props.form.interest_payable_account_id) {
    const match = accounts.find(a =>
      a.account_type === 'INCOME' && a.name.toLowerCase().includes('interest payable')
    )
    if (match) props.form.interest_payable_account_id = match.id
  }
}, { immediate: true })

const selectClass = 'w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow'
const inputClass = 'w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow'
</script>

<template>
  <div class="rounded-xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
    <h2 class="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Fixed Deposit Settings</h2>

    <div class="grid gap-4 sm:grid-cols-2">
      <!-- Interest Rate -->
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Annual Interest Rate (%)
        </label>
        <input
          v-model="interestRateDisplay"
          type="number" step="0.01" min="0" max="100"
          :class="inputClass"
          placeholder="e.g. 12.00"
        />
        <p class="mt-1 text-xs text-neutral-500">Enter as percentage, e.g. 12 for 12% p.a.</p>
      </div>

      <!-- Default Tenor -->
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Default Tenor (Months)
        </label>
        <input
          v-model.number="form.default_tenor_months"
          type="number" min="1"
          :class="inputClass"
          placeholder="e.g. 6"
        />
      </div>

      <!-- Interest Payout Type -->
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Interest Payout Type
        </label>
        <select v-model="form.interest_payout_type" :class="selectClass">
          <option value="at_maturity">At Maturity (lump sum)</option>
          <option value="periodic_payout">Periodic Payout (to savings)</option>
          <option value="compound">Compound (add to principal)</option>
        </select>
      </div>

      <!-- Posting Frequency (only for periodic_payout / compound) -->
      <div v-if="showFrequency">
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Posting Frequency
        </label>
        <select v-model="form.interest_posting_frequency" :class="selectClass">
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="semi_annually">Semi-Annually</option>
          <option value="annually">Annually</option>
        </select>
      </div>

      <!-- Maturity Action -->
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Default Maturity Action
        </label>
        <select v-model="form.maturity_action" :class="selectClass">
          <option value="manual">Manual (officer action required)</option>
          <option value="auto_rollover">Auto Rollover (same product)</option>
          <option value="convert_to_savings">Convert to Savings</option>
        </select>
      </div>

      <!-- Convert To Product -->
      <div v-if="showConvertProduct">
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Target Savings Product
        </label>
        <select v-model.number="form.convert_to_product_id" :class="selectClass">
          <option :value="null">— select product —</option>
          <option v-for="p in productOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <!-- GL: Interest Expense Account (DR) — searchable, EXPENSE accounts only -->
      <div class="relative">
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Interest Expense GL Account (DR)
        </label>
        <div class="relative">
          <!-- Closed: show selected account name as a button -->
          <button
            v-if="!expenseOpen"
            type="button"
            :class="[inputClass, 'text-left truncate', !findAccount(form.interest_expense_account_id) ? 'text-neutral-400 dark:text-neutral-500' : '']"
            @click="openExpense"
          >
            {{ findAccount(form.interest_expense_account_id) ? accountLabel(findAccount(form.interest_expense_account_id)!) : '— select account —' }}
          </button>

          <!-- Open: search input + scrollable dropdown -->
          <template v-else>
            <input
              ref="expenseInputRef"
              v-model="expenseQuery"
              type="text"
              :class="inputClass"
              placeholder="Type to search accounts..."
              @blur="onExpenseBlur"
            />
            <div class="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800 max-h-52 overflow-y-auto">
              <button
                v-for="a in filteredExpense" :key="a.id"
                type="button"
                class="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                :class="form.interest_expense_account_id === a.id
                  ? 'bg-green-50 font-semibold text-nfuko-primary dark:bg-green-950/20 dark:text-nfuko-yellow'
                  : 'text-neutral-700 dark:text-neutral-300'"
                @mousedown.prevent="selectExpense(a)"
              >
                {{ accountLabel(a) }}
              </button>
              <div v-if="filteredExpense.length === 0" class="px-3 py-4 text-center text-sm text-neutral-400">
                No accounts found.
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- GL: Interest Payable Account (CR) — searchable, INCOME accounts only -->
      <div class="relative">
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Interest Payable GL Account (CR)
        </label>
        <div class="relative">
          <!-- Closed: show selected account name as a button -->
          <button
            v-if="!payableOpen"
            type="button"
            :class="[inputClass, 'text-left truncate', !findAccount(form.interest_payable_account_id) ? 'text-neutral-400 dark:text-neutral-500' : '']"
            @click="openPayable"
          >
            {{ findAccount(form.interest_payable_account_id) ? accountLabel(findAccount(form.interest_payable_account_id)!) : '— select account —' }}
          </button>

          <!-- Open: search input + scrollable dropdown -->
          <template v-else>
            <input
              ref="payableInputRef"
              v-model="payableQuery"
              type="text"
              :class="inputClass"
              placeholder="Type to search accounts..."
              @blur="onPayableBlur"
            />
            <div class="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800 max-h-52 overflow-y-auto">
              <button
                v-for="a in filteredPayable" :key="a.id"
                type="button"
                class="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                :class="form.interest_payable_account_id === a.id
                  ? 'bg-green-50 font-semibold text-nfuko-primary dark:bg-green-950/20 dark:text-nfuko-yellow'
                  : 'text-neutral-700 dark:text-neutral-300'"
                @mousedown.prevent="selectPayable(a)"
              >
                {{ accountLabel(a) }}
              </button>
              <div v-if="filteredPayable.length === 0" class="px-3 py-4 text-center text-sm text-neutral-400">
                No accounts found.
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
