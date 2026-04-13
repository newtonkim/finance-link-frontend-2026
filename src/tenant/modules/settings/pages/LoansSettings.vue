<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle, CreditCard, GitPullRequestArrow, HandCoins, Settings2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import ApprovalWorkflowDrawer from '../components/ApprovalWorkflowDrawer.vue'
import DisbursementRepaymentOrderDrawer from '../components/DisbursementRepaymentOrderDrawer.vue'
import ArrearsSettingsDrawer from '../components/ArrearsSettingsDrawer.vue'

const router = useRouter()
const approvalDrawerRef = ref<InstanceType<typeof ApprovalWorkflowDrawer> | null>(null)
const disbursementDrawerRef = ref<InstanceType<typeof DisbursementRepaymentOrderDrawer> | null>(null)
const arrearsDrawerRef = ref<InstanceType<typeof ArrearsSettingsDrawer> | null>(null)

function openApprovalSettings() {
  if (approvalDrawerRef.value) {
    approvalDrawerRef.value.openDrawer()
  }
}

function openDisbursementSettings() {
  if (disbursementDrawerRef.value) {
    disbursementDrawerRef.value.openDrawer()
  }
}

function openArrearsSettings() {
  if (arrearsDrawerRef.value) {
    arrearsDrawerRef.value.openDrawer()
  }
}
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-8 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
    <!-- Loan Products Section -->
    <div>
      <div class="flex items-center gap-3 mb-5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
        >
          <CreditCard class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Loan Products
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Configure loan types, interest, and repayment rules
          </p>
        </div>
      </div>
      <div class="grid gap-5 lg:grid-cols-2">
        <div
          class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Loan Types</h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Define different categories of loan products.
          </p>
          <button
            class="inline-flex w-fit items-center justify-center gap-1.5 rounded-xl bg-nfuko-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
            @click="router.push({ name: 'tenant-settings-loan-products' })"
          >
            <span>Manage Types</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div
          class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">
            Charges & Penalties
          </h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Create and manage fees and penalties that can be assigned to loan products.
          </p>
          <button
            class="inline-flex w-fit items-center justify-center gap-1.5 rounded-xl bg-nfuko-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
            @click="router.push({ name: 'tenant-settings-loan-charges' })"
          >
            <span>Manage Charges</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-neutral-100 dark:border-neutral-800" />

    <!-- Loan Settings Section -->
    <div>
      <div class="flex items-center gap-3 mb-5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
        >
          <Settings2 class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Loan Settings
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Manage loan operational behavior and workflows
          </p>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-2">
        <div
          class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
            <span
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
            >
              <GitPullRequestArrow class="h-4 w-4" />
            </span>
            Approval Workflow & Limits
          </h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Configure approval stages, default deduction modes, and who can authorize loans.
          </p>
          <button
            @click="openApprovalSettings"
            class="inline-flex w-fit items-center justify-center gap-1.5 rounded-xl bg-nfuko-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
          >
            <span>Setup Settings</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <!-- Other settings... -->
        <div
          class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
            <span
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              <HandCoins class="h-4 w-4" />
            </span>
            Disbursement & Loan Repayment Order Settings
          </h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Define payment methods and disbursement default channels.
          </p>
          <button
            @click="openDisbursementSettings"
            class="inline-flex w-fit items-center justify-center gap-1.5 rounded-xl bg-nfuko-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
          >
            <span>Manage Disbursement</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div
          class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
            <span
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            >
              <AlertTriangle class="h-4 w-4" />
            </span>
            Arrears Penalty settings
          </h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Configure global arrears categorization and automated penalty rules.
          </p>
          <button
            class="inline-flex w-fit items-center justify-center gap-1.5 rounded-xl bg-nfuko-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
            @click="openArrearsSettings"
          >
            <span>Manage Arrears</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>

    <ApprovalWorkflowDrawer ref="approvalDrawerRef" />
    <DisbursementRepaymentOrderDrawer ref="disbursementDrawerRef" />
    <ArrearsSettingsDrawer ref="arrearsDrawerRef" />
  </div>
</template>
