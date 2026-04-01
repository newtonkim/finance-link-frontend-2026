<script setup lang="ts">
import { computed } from 'vue'
import { Calculator } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'

const props = defineProps<{
  preview: any
  previewLoading: boolean
  previewAmount: string | number
  previewTerm: string | number
  interestMethod: string
  repaymentStructure: string
}>()

const emit = defineEmits<{
  'update:previewAmount': [value: string | number]
  'update:previewTerm': [value: string | number]
}>()

function previewMoney(
  formatted: string | null | undefined,
  raw: number | string | null | undefined,
) {
  if (formatted) return formatted
  if (raw == null || raw === '') return '—'
  return formatMoneyValue(raw)
}

const methodSummary = computed(() => {
  if (props.interestMethod === 'reducing_balance') return 'Reducing balance'
  if (props.interestMethod === 'flat') return 'Flat rate'
  return 'Select an interest method'
})

const methodDescription = computed(() => {
  if (
    props.interestMethod === 'reducing_balance' &&
    props.repaymentStructure === 'equal_installment'
  )
    return 'Installments stay level while principal share rises over time.'
  if (props.interestMethod === 'reducing_balance' && props.repaymentStructure === 'equal_principal')
    return 'Principal stays fixed and total installments decline over time.'
  if (props.interestMethod === 'flat')
    return 'Interest is spread on original principal for the full term.'
  return 'Preview will update once the core pricing fields are filled in.'
})
</script>

<template>
  <div
    class="sticky top-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
  >
    <div class="mb-4 flex items-center gap-2">
      <Calculator class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
      <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Live Preview</h2>
    </div>

    <div class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            class="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
            >Preview Amount</label
          >
          <input
            :value="previewAmount"
            @input="emit('update:previewAmount', ($event.target as HTMLInputElement).value)"
            type="number"
            min="0"
            step="0.01"
            placeholder="500000"
            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
        <div>
          <label
            class="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
            >Preview Term</label
          >
          <input
            :value="previewTerm"
            @input="emit('update:previewTerm', ($event.target as HTMLInputElement).value)"
            type="number"
            min="1"
            placeholder="12"
            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      </div>

      <div class="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/60">
        <p
          class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
        >
          Method Summary
        </p>
        <p class="mt-2 text-sm text-neutral-900 dark:text-white">{{ methodSummary }}</p>
        <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{{ methodDescription }}</p>
      </div>

      <div v-if="previewLoading" class="py-10 text-center text-sm text-neutral-400">
        Calculating preview…
      </div>

      <template v-else-if="preview">
        <div class="grid gap-3">
          <div class="rounded-2xl border border-neutral-100 p-4 dark:border-neutral-800">
            <p
              class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
            >
              Estimated Installment
            </p>
            <p class="mt-1 text-xl font-semibold text-neutral-900 dark:text-white">
              {{ previewMoney(preview.installment_amount_formatted, preview.installment_amount) }}
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border border-neutral-100 p-4 dark:border-neutral-800">
              <p
                class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
              >
                Total Interest
              </p>
              <p class="mt-1 text-base font-semibold text-neutral-900 dark:text-white">
                {{ previewMoney(preview.total_interest_formatted, preview.total_interest) }}
              </p>
            </div>
            <div class="rounded-2xl border border-neutral-100 p-4 dark:border-neutral-800">
              <p
                class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
              >
                Total Repayment
              </p>
              <p class="mt-1 text-base font-semibold text-neutral-900 dark:text-white">
                {{ previewMoney(preview.total_repayment_formatted, preview.total_repayment) }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p
            class="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
          >
            Schedule Snapshot
          </p>
          <div
            class="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800"
          >
            <table class="w-full text-xs">
              <thead
                class="bg-neutral-50 text-neutral-500 dark:bg-neutral-800/70 dark:text-neutral-400"
              >
                <tr>
                  <th class="px-3 py-2 text-left">#</th>
                  <th class="px-3 py-2 text-right">Principal</th>
                  <th class="px-3 py-2 text-right">Interest</th>
                  <th class="px-3 py-2 text-right">Installment</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr v-for="row in preview.schedule_preview" :key="row.period">
                  <td class="px-3 py-2 text-neutral-700 dark:text-neutral-200">{{ row.period }}</td>
                  <td class="px-3 py-2 text-right text-neutral-600 dark:text-neutral-300">
                    {{ previewMoney(row.principal_formatted, row.principal) }}
                  </td>
                  <td class="px-3 py-2 text-right text-neutral-600 dark:text-neutral-300">
                    {{ previewMoney(row.interest_formatted, row.interest) }}
                  </td>
                  <td class="px-3 py-2 text-right font-medium text-neutral-900 dark:text-white">
                    {{ previewMoney(row.installment_formatted, row.installment) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="preview.messages?.length" class="space-y-2">
          <p
            v-for="message in preview.messages"
            :key="message"
            class="text-xs text-neutral-500 dark:text-neutral-400"
          >
            {{ message }}
          </p>
        </div>
      </template>

      <div
        v-else
        class="rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
      >
        Fill in interest method, rate, term, and preview amount to generate a repayment sample.
      </div>
    </div>
  </div>
</template>
