<script setup lang="ts">
import { computed } from 'vue'
import type { SavingsProduct } from '@/tenant/apis/savingsProducts/api'

interface ChartAccount { id: number; name: string; code: string }

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

      <!-- GL: Interest Expense Account -->
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Interest Expense GL Account (DR)
        </label>
        <select v-model.number="form.interest_expense_account_id" :class="selectClass">
          <option :value="null">— select account —</option>
          <option v-for="a in chartAccounts" :key="a.id" :value="a.id">
            {{ a.code }} — {{ a.name }}
          </option>
        </select>
      </div>

      <!-- GL: Interest Payable Account -->
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Interest Payable GL Account (CR)
        </label>
        <select v-model.number="form.interest_payable_account_id" :class="selectClass">
          <option :value="null">— select account —</option>
          <option v-for="a in chartAccounts" :key="a.id" :value="a.id">
            {{ a.code }} — {{ a.name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
