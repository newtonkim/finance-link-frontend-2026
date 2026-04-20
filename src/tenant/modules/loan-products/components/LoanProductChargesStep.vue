<script setup lang="ts">
import { ref } from 'vue'
import { ChevronUp, ChevronDown } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import MultiSearchableSelect from '@/Global/MultiSearchableSelect.vue'
import type { LoanProduct } from '@/tenant/apis/loanProducts/loanProductsApi'
import type { LoanCharge } from '@/tenant/apis/loanCharges/api'
import { categoryLabel, categoryColor } from '../utils/loanProductHelpers'

defineProps<{
  form: LoanProduct
  charges: LoanCharge[]
  chargeOptions: { id: number; name: string }[]
  fieldError: (field: string) => string | null
}>()

const showFeesAndPenalties = ref(true)
</script>

<template>
  <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div class="mb-5 flex items-center justify-between">
      <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Fees and Penalties</h2>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        @click="showFeesAndPenalties = !showFeesAndPenalties"
      >
        <component :is="showFeesAndPenalties ? ChevronUp : ChevronDown" class="h-3.5 w-3.5" />
        {{ showFeesAndPenalties ? 'Hide' : 'Show' }}
      </button>
    </div>
    <template v-if="showFeesAndPenalties">
      <div class="mb-5 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300">
        <p class="font-medium text-neutral-700 dark:text-neutral-200">Select the charges and penalties that apply to this loan product.</p>
        <ul class="mt-2 space-y-1.5 list-disc pl-4">
          <li><strong class="font-semibold">Processing fees:</strong> deducted at disbursement.</li>
          <li><strong class="font-semibold">Penalties:</strong> applied when members miss repayment deadlines.</li>
        </ul>
        <div class="mt-2">
          Manage charge definitions under
          <router-link
            :to="{ name: 'tenant-settings-loan-charges' }"
            class="ml-1 inline-flex items-center gap-1 rounded-md border border-nfuko-primary/30 bg-white px-2.5 py-1 font-semibold text-nfuko-primary transition-all hover:border-nfuko-primary hover:bg-nfuko-primary hover:text-white dark:border-bg-nfuko-yellow/50 dark:bg-neutral-900 dark:text-bg-nfuko-yellow dark:hover:border-bg-nfuko-yellow dark:hover:bg-bg-nfuko-yellow dark:hover:text-nfuko-primary"
            >Settings → Charges & Penalties</router-link
          >.
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Assign Charges</label>
        <MultiSearchableSelect
          v-model="form.charge_ids"
          :options="chargeOptions"
          placeholder="Select charges and penalties to apply..."
          state="loan-product-charges"
        />
        <p class="text-xs text-neutral-400">
          Choose one or more predefined charges. Each selected charge will be applied to every loan created under this product. Ensure the corresponding GL accounts are mapped below.
        </p>
        <p v-if="fieldError('charge_ids')" class="text-xs text-red-500">{{ fieldError('charge_ids') }}</p>
      </div>

      <div v-if="form.charge_ids?.length" class="mt-5">
        <h3 class="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Selected Charges ({{ form.charge_ids.length }})</h3>
        <div class="flex flex-col gap-2">
          <div
            v-for="chargeId in form.charge_ids"
            :key="chargeId"
            class="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 dark:border-neutral-800"
          >
            <div class="flex items-center gap-3">
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="categoryColor(charges.find((c) => c.id === chargeId)?.category ?? 'other')"
              >
                {{ categoryLabel(charges.find((c) => c.id === chargeId)?.category ?? 'other') }}
              </span>
              <div>
                <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ charges.find((c) => c.id === chargeId)?.name ?? 'Unknown' }}</p>
                <p class="text-xs text-neutral-400">
                  {{
                    charges.find((c) => c.id === chargeId)?.charge_type === 'percentage'
                      ? charges.find((c) => c.id === chargeId)?.value + '%'
                      : formatMoneyValue(Number(charges.find((c) => c.id === chargeId)?.value ?? 0))
                  }}
                  ·
                  {{ charges.find((c) => c.id === chargeId)?.frequency?.replace('_', ' ') ?? 'one-time' }}
                  <span v-if="charges.find((c) => c.id === chargeId)?.grace_days"> · {{ charges.find((c) => c.id === chargeId)?.grace_days }} day grace </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors dark:hover:bg-red-900/20"
              @click="form.charge_ids = form.charge_ids?.filter((id) => id !== chargeId)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="!charges.length" class="mt-5 rounded-xl border border-dashed border-neutral-200 py-6 text-center dark:border-neutral-700">
        <p class="text-sm text-neutral-400 dark:text-neutral-500">No charges configured yet.</p>
        <router-link :to="{ name: 'tenant-settings-loan-charges' }" class="mt-1 inline-block text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
          Create charges →
        </router-link>
      </div>

      <div
        v-if="form.charge_ids?.some((id) => ['penalty', 'late_fee'].includes(charges.find((c) => c.id === id)?.category ?? ''))"
        class="mt-5 rounded-xl border border-neutral-100 p-4 dark:border-neutral-800"
      >
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Penalty Grace Period (days)</label>
        <input
          v-model="form.penalty_grace_days"
          type="number"
          min="0"
          placeholder="0"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
        <p class="mt-1 text-xs text-neutral-400">
          Number of days after a repayment due date before penalties begin. Set to 0 for immediate application. This applies to all penalty charges on this product.
        </p>
      </div>
    </template>
  </div>
</template>
