<script setup lang="ts">
import { X, RotateCcw, AlertTriangle, Clock } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import { formatMoneyValue } from '@/Global'

defineProps<{
  show: boolean
  transaction: any
  narration: string
  requesting: boolean
}>()

const emit = defineEmits<{
  'update:narration': [value: string]
  submit: []
  close: []
}>()

function formatAmount(amount: string | number) {
  return formatMoneyValue(amount ?? 0)
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="show" class="fixed inset-0 z-[70]">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')" />
      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900 flex flex-col"
          role="dialog"
          aria-label="Request Reversal"
        >
          <!-- Header -->
          <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                  <RotateCcw class="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 class="text-base font-bold text-neutral-900 dark:text-white">Request Reversal</h3>
                  <p class="text-xs text-neutral-500">Reverse a deposit or withdrawal</p>
                </div>
              </div>
              <button type="button" @click="emit('close')" class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800">
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <!-- Transaction summary (read-only) -->
            <div v-if="transaction" class="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3 dark:border-neutral-700 dark:bg-neutral-800/50">
              <p class="text-xs font-semibold uppercase tracking-wider text-neutral-500">Transaction Being Reversed</p>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="text-xs text-neutral-400">Type</p>
                  <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase mt-0.5"
                    :class="{
                      'bg-emerald-100 text-emerald-700': transaction.type === 'deposit',
                      'bg-red-100 text-red-700': transaction.type === 'withdrawal' || transaction.type === 'withdraw',
                      'bg-purple-100 text-purple-700': transaction.type === 'charge',
                    }">
                    {{ transaction.type }}
                  </span>
                </div>
                <div>
                  <p class="text-xs text-neutral-400">Amount</p>
                  <p class="font-mono font-bold text-neutral-900 dark:text-white mt-0.5">{{ formatAmount(transaction.amount) }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-400">Date</p>
                  <p class="text-neutral-700 dark:text-neutral-300 mt-0.5">{{ formatDate(transaction.transaction_date) }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-400">Reference</p>
                  <p class="font-mono text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">{{ transaction.receipt_number || transaction.reference || '—' }}</p>
                </div>
                <div v-if="transaction.narration" class="col-span-2">
                  <p class="text-xs text-neutral-400">Original Narration</p>
                  <p class="text-neutral-700 dark:text-neutral-300 mt-0.5 text-xs">{{ transaction.narration }}</p>
                </div>
              </div>
            </div>

            <!-- Warning -->
            <div class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
              <AlertTriangle class="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p class="text-xs text-amber-700 dark:text-amber-400">
                This will create an equal and opposite transaction and reverse the GL entries. If approval is required, the reversal will be queued until an authorised approver confirms it.
              </p>
            </div>

            <!-- Narration (reason) -->
            <div class="space-y-2">
              <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Reason for Reversal <span class="text-red-500">*</span>
              </label>
              <textarea
                :value="narration"
                @input="emit('update:narration', ($event.target as HTMLTextAreaElement).value)"
                rows="4"
                placeholder="Describe why this transaction is being reversed (e.g. incorrect amount, wrong account, duplicate entry)…"
                class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition resize-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
              <p class="text-xs text-neutral-400">Minimum 5 characters. This is recorded in the audit trail.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <button type="button" @click="emit('close')" class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors">
              Cancel
            </button>
            <button
              type="button"
              @click="emit('submit')"
              :disabled="requesting || !narration.trim() || narration.trim().length < 5"
              class="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#052659]/90 transition-colors disabled:opacity-60 shadow-sm"
            >
              <Spinner v-if="requesting" class="h-4 w-4" />
              <Clock v-else class="h-4 w-4" />
              {{ requesting ? 'Submitting…' : 'Submit Reversal Request' }}
            </button>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
