<script setup lang="ts">
import { Undo2, AlertTriangle, XCircle as XCircleIcon } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

defineProps<{ application: LoanApplication }>()

const { formatDate } = useLoanApplicationHelpers()
</script>

<template>
  <!-- Returned for correction notice -->
  <div
    v-if="application.status === 'draft' && application.return_reason"
    class="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-900/20"
  >
    <Undo2 class="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
    <div>
      <p class="text-sm font-semibold text-orange-900 dark:text-orange-200">
        Returned for Correction
      </p>
      <p class="mt-1 text-sm text-orange-700 dark:text-orange-300">
        {{ application.return_reason }}
      </p>
      <p v-if="application.returned_at" class="mt-1 text-xs text-orange-500 dark:text-orange-400">
        Returned on {{ formatDate(application.returned_at) }}
      </p>
      <p class="mt-2 text-xs text-orange-600 dark:text-orange-400">
        Please address the issues above, then edit and resubmit the application.
      </p>
    </div>
  </div>

  <!-- Cancellation notice -->
  <div
    v-if="application.status === 'cancelled' && application.cancellation_reason"
    class="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-700 dark:bg-neutral-800/60"
  >
    <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400" />
    <div>
      <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        Application Cancelled
      </p>
      <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {{ application.cancellation_reason }}
      </p>
      <p
        v-if="application.cancelled_at"
        class="mt-1 text-xs text-neutral-400 dark:text-neutral-500"
      >
        Cancelled on {{ formatDate(application.cancelled_at) }}
      </p>
      <p class="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        You can reopen this application as a draft to make corrections and resubmit.
      </p>
    </div>
  </div>

  <!-- BM return for correction notice -->
  <div
    v-if="application.status === 'returned_for_correction' && application.correction_reason"
    class="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-900/20"
  >
    <Undo2 class="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
    <div>
      <p class="text-sm font-semibold text-orange-900 dark:text-orange-200">BM Correction Reason</p>
      <p class="mt-1 text-sm text-orange-700 dark:text-orange-300">
        {{ application.correction_reason }}
      </p>
    </div>
  </div>

  <!-- Declined notice -->
  <div
    v-if="application.status === 'declined'"
    class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/40 dark:bg-red-900/10"
  >
    <XCircleIcon class="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
    <div>
      <p class="text-sm font-semibold text-red-800 dark:text-red-300">Declined by Committee</p>
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">
        This application was declined by the credit committee.
      </p>
    </div>
  </div>
</template>
