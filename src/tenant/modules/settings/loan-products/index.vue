<script setup lang="ts">
import { ref } from 'vue'
import { CreditCard, Settings2 } from 'lucide-vue-next'
import { SettingCard } from '@/tenant/components/globals'
import {
  ApprovalWorkflowDrawer,
  DisbursementRepaymentOrderDrawer,
  ArrearsSettingsDrawer,
  loanSettings,
} from '.'
const loanProductCards = [
  {
    title: 'Loan Types',
    description: 'Define different categories of loan products.',
    type: 'link',
    route: { name: 'tenant-settings-loan-products' },
    action: 'Manage Types →',
  },
  {
    title: 'Charges & Penalties',
    description: 'Create and manage fees and penalties.',
    type: 'link',
    route: { name: 'tenant-settings-loan-charges' },
    action: 'Manage Charges →',
  },
]
const loanSettingsCards = [
  {
    title: 'Loan Reschedule & Topup Settings',
    description: 'Configure approval stages and authorization rules.',
    slot: 'approval-settings',
  },
  {
    title: 'Disbursement & Repayment Order',
    description: 'Define disbursement channels and payment priority.',
    slot: 'disbursement-settings',
  },
  {
    title: 'Arrears Penalty Settings',
    description: 'Configure arrears and penalty rules.',
    slot: 'arrears-settings',
  },
  {
    title: 'Loans Settings',
    description: 'Configure arrears and penalty rules.',
    slot: 'Loans-settings',
  },
]
const drawerOpen = ref(false),
  currentPage = ref<string | null>(null),
  drawerTitle = ref(''),
  pages: Record<string, any> = {
    approval: {
      title: 'Loan TopUp Settings',
      page: ApprovalWorkflowDrawer,
    },
    disbursement: {
      title: 'Disbursement Settings',
      page: DisbursementRepaymentOrderDrawer,
    },
    arrears: {
      title: 'Arrears Settings',
      page: ArrearsSettingsDrawer,
    },
    'loans-settings': {
      title: 'Loans Settings',
      page: loanSettings,
    },
  }
function openDrawer(page: string) {
  currentPage.value = page
  drawerTitle.value = pages[page]?.title || ''
  drawerOpen.value = true
}

function saveDrawerData(data: any) {
  drawerOpen.value = false
}
</script>
<template>
  <div class="flex flex-col gap-8 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
    <div>
      <div class="flex items-center gap-3 mb-5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
        >
          <CreditCard class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Loan Products</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Configure loan types and charges
          </p>
        </div>
      </div>
      <SettingCard :settingsCards="loanProductCards" />
    </div>
    <hr class="border-neutral-100 dark:border-neutral-800" />
    <div>
      <div class="flex items-center gap-3 mb-5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
        >
          <Settings2 class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Loan Settings</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Manage workflows and behaviors
          </p>
        </div>
      </div>
      <SettingCard :settingsCards="loanSettingsCards">
        <template #approval-settings>
          <button
            @click="openDrawer('approval')"
            class="inline-flex items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
          >
            Setup →
          </button>
        </template>
        <template #disbursement-settings>
          <button
            @click="openDrawer('disbursement')"
            class="inline-flex items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
          >
            Manage →
          </button>
        </template>
        <template #arrears-settings>
          <button
            @click="openDrawer('arrears')"
            class="inline-flex items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
          >
            Configure →
          </button>
        </template>
        <template #loans-settings>
          <button
            @click="openDrawer('loans-settings')"
            class="inline-flex items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
          >
            Configure →
          </button>
        </template>
      </SettingCard>
    </div>
  </div>
  <Drawer
    v-if="drawerOpen"
    v-model:open="drawerOpen"
    width="w-1/2"
    :title="drawerTitle"
    @save="saveDrawerData"
  >
    <template #body>
      <component v-if="currentPage" :is="pages[currentPage]?.page" @close="drawerOpen = false" />
    </template>
  </Drawer>
</template>
