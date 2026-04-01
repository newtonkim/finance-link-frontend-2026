<script setup lang="ts">
import { ref } from 'vue'
import { PieChart } from 'lucide-vue-next'

const sharesDrawerOpen = ref(false)
const drawerOpen = ref(false)

function openSharesDrawer() {
  sharesDrawerOpen.value = true
}

function openDrawer() {
  drawerOpen.value = true
}

const settingsCards = [
  {
    id: 'share-management',
    title: 'Share Management',
    description: 'Manage share products and related account settings.',
    type: 'button',
    action: openSharesDrawer,
  },
  {
    id: 'share-capital',
    title: 'Share Capital',
    description: 'Manage share capital structure and limits.',
    type: 'link',
    action: 'Manage Capital →',
  },
  {
    id: 'share-pricing',
    title: 'Share Pricing',
    description: 'Set and update share prices over time.',
    action: 'Configure Pricing →',
  },
  {
    id: 'dividends',
    title: 'Dividend Distribution',
    description: 'Setup rules and schedules for dividend payouts.',
    type: 'button',
    action: openDrawer,
  },
]
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
      >
        <PieChart class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
      </div>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Shares & Dividends
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Configure share capital, pricing, and distributions
        </p>
      </div>
    </div>

    <SettingCard :settingsCards="settingsCards">
      <template #share-management="{ card }">
        <button
          @click="openSharesDrawer"
          class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
        >
          Manage Shares →
        </button>
        <ManageShareDrive v-model:show="sharesDrawerOpen" />
      </template>
      <template #kyc-member-onboarding="{ card }"> </template>
      <template #dividend-distribution="{ card }">
        <button
          @click="openDrawer"
          class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
        >
          Configure Dividends →
        </button>
        <DividedDrawer v-model:show="drawerOpen" />
      </template>
    </SettingCard>
  </div>
</template>
