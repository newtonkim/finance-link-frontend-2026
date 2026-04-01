<script setup lang="ts">
import { onMounted } from 'vue'
import { Check, X, RotateCcw, Loader2, ChevronDown, AlertTriangle } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import type { TransactionReversal } from '@/tenant/apis/reversals/reversalsApi'

const props = defineProps<{
  reversals: TransactionReversal[]
  loading: boolean
  processingId: number | null
  rejectingId: number | null
  rejectReason: string
}>()

const emit = defineEmits<{
  approve: [reversal: TransactionReversal]
  startReject: [reversal: TransactionReversal]
  cancelReject: []
  confirmReject: [reversal: TransactionReversal]
  'update:rejectReason': [value: string]
  refresh: []
}>()

onMounted(() => emit('refresh'))

function formatAmount(amount: string | number) {
  return formatMoneyValue(amount ?? 0)
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
          <RotateCcw class="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Pending Reversals</h3>
          <p class="text-xs text-neutral-500 mt-0.5">Reversal requests awaiting approval</p>
        </div>
        <span v-if="reversals.length > 0" class="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 min-w-[20px]">
          {{ reversals.length }}
        </span>
      </div>
      <button @click="emit('refresh')" :disabled="loading" class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800" title="Refresh">
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
        <RotateCcw v-else class="h-4 w-4" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="divide-y divide-neutral-100 dark:divide-neutral-800">
      <div v-for="i in 3" :key="i" class="px-6 py-4 animate-pulse">
        <div class="flex items-center gap-4">
          <div class="h-4 w-32 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div class="h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div class="ml-auto flex gap-2">
            <div class="h-8 w-20 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            <div class="h-8 w-20 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="reversals.length === 0" class="flex flex-col items-center gap-2 py-12 text-center">
      <Check class="h-8 w-8 text-emerald-300" />
      <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No pending reversals</p>
      <p class="text-xs text-neutral-400">All reversal requests have been processed.</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-neutral-50/60 dark:bg-neutral-800/40">
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Member</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Transaction</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Amount</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Reason</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Requested By</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Requested At</th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-500">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
          <template v-for="reversal in reversals" :key="reversal.id">
            <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
              <!-- Member -->
              <td class="px-6 py-4">
                <div class="font-semibold text-neutral-900 dark:text-white text-sm">{{ reversal.transaction?.member?.name || '—' }}</div>
                <div class="text-xs text-neutral-400 font-mono">{{ reversal.transaction?.member?.member_number || '' }}</div>
              </td>

              <!-- Transaction info -->
              <td class="px-6 py-4">
                <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  :class="{
                    'bg-emerald-100 text-emerald-700': reversal.transaction?.type === 'deposit',
                    'bg-red-100 text-red-700': reversal.transaction?.type === 'withdrawal',
                    'bg-purple-100 text-purple-700': reversal.transaction?.type === 'charge',
                  }">
                  {{ reversal.transaction?.type }}
                </span>
                <div class="text-xs text-neutral-400 font-mono mt-1">{{ reversal.transaction?.receipt_number || reversal.transaction?.reference || '—' }}</div>
                <div class="text-xs text-neutral-400">{{ formatDate(reversal.transaction?.transaction_date) }}</div>
              </td>

              <!-- Amount -->
              <td class="px-6 py-4">
                <span class="font-mono font-bold text-neutral-900 dark:text-white">
                  {{ formatAmount(reversal.transaction?.amount ?? 0) }}
                </span>
              </td>

              <!-- Reason -->
              <td class="px-6 py-4 max-w-[200px]">
                <p class="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{{ reversal.narration }}</p>
              </td>

              <!-- Requested by -->
              <td class="px-6 py-4">
                <div class="text-sm text-neutral-700 dark:text-neutral-300">{{ reversal.requested_by?.name || '—' }}</div>
                <div class="text-xs text-neutral-400">{{ reversal.requested_by?.email || '' }}</div>
              </td>

              <!-- Requested at -->
              <td class="px-6 py-4 text-sm text-neutral-500">
                {{ formatDateTime(reversal.created_at) }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-right">
                <div class="inline-flex items-center gap-2">
                  <button
                    @click="emit('approve', reversal)"
                    :disabled="processingId === reversal.id"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
                    title="Approve reversal"
                  >
                    <Loader2 v-if="processingId === reversal.id" class="h-3 w-3 animate-spin" />
                    <Check v-else class="h-3 w-3" />
                    Approve
                  </button>
                  <button
                    @click="emit('startReject', reversal)"
                    :disabled="processingId === reversal.id"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm"
                    title="Reject reversal"
                  >
                    <X class="h-3 w-3" />
                    Reject
                  </button>
                </div>
              </td>
            </tr>

            <!-- Inline reject form -->
            <tr v-if="rejectingId === reversal.id" class="bg-red-50/50 dark:bg-red-900/10">
              <td colspan="7" class="px-6 py-4">
                <div class="flex items-start gap-3">
                  <AlertTriangle class="h-4 w-4 text-red-500 shrink-0 mt-2" />
                  <div class="flex-1 space-y-3">
                    <p class="text-sm font-semibold text-red-700 dark:text-red-400">Provide a reason for rejecting this reversal request:</p>
                    <textarea
                      :value="rejectReason"
                      @input="emit('update:rejectReason', ($event.target as HTMLTextAreaElement).value)"
                      rows="2"
                      placeholder="e.g. Transaction verified as correct, reversal not warranted…"
                      class="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/30 dark:border-red-800/40 dark:bg-neutral-800 dark:text-white resize-none"
                    />
                    <div class="flex items-center gap-2">
                      <button
                        @click="emit('confirmReject', reversal)"
                        :disabled="!rejectReason.trim() || rejectReason.trim().length < 5 || processingId === reversal.id"
                        class="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        <Loader2 v-if="processingId === reversal.id" class="h-3 w-3 animate-spin" />
                        Confirm Rejection
                      </button>
                      <button @click="emit('cancelReject')" class="rounded-lg bg-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-300 transition-colors dark:bg-neutral-700 dark:text-white">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
