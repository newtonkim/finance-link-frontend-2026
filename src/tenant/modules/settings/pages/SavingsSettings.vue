<script setup lang="ts">
import { Landmark } from 'lucide-vue-next'
import { SettingCard } from '@/tenant/components/globals'

const settingsCards = [
  {
    title: "Savings Accounts",
    description: "Configure standard savings account types.",
    type: "button",
    // route: { name: "tenant-settings-savings-accounts" },
    action: "Manage Accounts →"
  },
  {
    title: "Group Savings (Chamas)",
    description: "Setup rules for group/chama savings products.",
    type: "button",
    // route: { name: "tenant-settings-savings-groups" },
    action: "Configure Groups →"
  },
  {
    title: "Fixed Deposits",
    description: "Manage fixed-term deposit products and rates.",
    type: "button",
    // route: { name: "tenant-settings-savings-fixed-deposits" },
    action: "Manage Fixed →"
  },
  {
    title: "Transfer Rules",
    description: "Define rules for internal and external transfers.",
    type: "button",
    // route: { name: "tenant-settings-savings-transfer-rules" },
    action: "Setup Transfers →"
  },
  {
    title: "Savings Product Variants",
    description: "Define savings products and attach charges.",
    type: "link",
    route: { to: "/tenant/settings/savings-products" },
    action: "Manage Products →"
  }
]
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Landmark class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Savings Products</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage savings accounts, fixed deposits, and
                    rules</p>
            </div>
        </div>
        <SettingCard :settingsCards="settingsCards"/>

    </div>
</template>
