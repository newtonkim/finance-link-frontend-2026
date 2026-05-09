<template>
  <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
    
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
        <Landmark class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
      </div>

      <div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Savings Products
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Manage savings accounts, fixed deposits, and rules
        </p>
      </div>
    </div>

    <SettingCard :settingsCards="settingsCards">
      
      <template #savings-accounts>
        <button
          @click="toggleDrawer('savings-accounts-setting')"
          class="inline-flex items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
        >
          Setup →
        </button>
      </template>
      <template #group-savings>
        <button
          @click="toggleDrawer('savings-group-savings-setting')"
          class="inline-flex items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
        >
          Setup →
        </button>
      </template>

      <template #savings-product-creation>
        <RouterLink
          to="/tenant/settings/savings-products"
          class="inline-flex items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white"
        >
          Manage Products →
        </RouterLink>
      </template>

    </SettingCard>
  </div>

  <Drawer
    v-if="drawerOpen"
    width="w-1/2"
    v-model:open="drawerOpen"
    :title="drawerTitle"
    @save="saveDrawerData"
  >
        <template #body>
          <component
          v-if="currentPage"
          :drawerOpen="drawerOpen"
          :is="pages[currentPage]?.page"
          />
        </template>
  </Drawer>
</template>

<script setup lang="ts">
import { Landmark } from 'lucide-vue-next'
import { SettingCard } from '@/tenant/components/globals'
import { Drawer } from '@/Global'
import { ref } from 'vue'
import { SavingsSettingsList } from '../saving-account'
import { GroupSavingSettingsList } from '../group-saving-account'
const settingsCards = [
  {
    title: "Savings Accounts",
    description: "Configure standard savings account types.",
    type: "button",
    action: "Manage Accounts →",
    slot: "savings-accounts"
  },
  {
    title: "Group Savings",
    description: "Setup rules for group/chama savings products.",
    type: "button",
    action: "Configure Groups →"
  },
  {
    title: "Fixed Deposits",
    description: "Manage fixed-term deposit products and rates.",
    type: "button",
    action: "Manage Fixed →"
  },
  {
    title: "Transfer Rules",
    description: "Define rules for internal and external transfers.",
    type: "button",
    action: "Setup Transfers →"
  },
  {
    title: "Savings Product Creation",
    description: "Define savings products and attach charges.",
    type: "button",
    slot: "savings-product-creation",
    action: "Manage Products →"
  }
]

// Drawer state
const drawerOpen = ref(false)
const currentPage = ref<string | null>(null)
const drawerTitle = ref("")

// Pages mapping
const pages: Record<string, any> = {
  "savings-accounts-setting": {
    title: "Savings Accounts",
    page: SavingsSettingsList
  },
  "savings-group-savings-setting": {
    title: "Savings Accounts",
    page: GroupSavingSettingsList
  }
}

// Open drawer
function toggleDrawer(page: string) {
  currentPage.value = page
  drawerTitle.value = pages[page]?.title || ""
  drawerOpen.value = true
}

// Save action
function saveDrawerData(data: any) {
  // console.log("Saved:", data)
  drawerOpen.value = false
}
</script>