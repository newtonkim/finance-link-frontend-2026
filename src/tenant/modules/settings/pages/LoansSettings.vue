<script setup lang="ts">
import { SettingCard } from '@/tenant/components/globals'
import { CreditCard } from 'lucide-vue-next'
const settingsCards = [
    {
        title: "Loan Types",
        description: "Define different categories of loan products.",
        type: "link",
        route: { name: "tenant-settings-members-roles-permission" },
        action: "Manage Types →"
    },
    {
        title: "Interest Settings",
        description: "Setup interest rates and calculation methods.",
        type: "link",
        route: { name: "tenant-settings-members-roles-permission" },
        action: "Configure Interest →"
    },
    {
        title: "Repayment Rules",
        description: "Define schedules and rules for loan repayments.",
        type: "button",
        route: { name: "tenant-settings-members-roles-permission" },
        action: "Setup Rules →"
    },
    {
        title: "Penalties",
        description: "Configure late payment fees and penalties.",
        type: "button",
        route: { name: "tenant-settings-members-roles-permission" },
        action: "Manage Penalties →"
    }
]
 
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <CreditCard class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Loan Products</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure loan types, interest, and repayment
                    rules</p>
            </div>
        </div>

        <SettingCard :settingsCards="settingsCards"/>
        <div class="grid gap-5 lg:grid-cols-2">
           
             
        </div>
    </div>
</template>
