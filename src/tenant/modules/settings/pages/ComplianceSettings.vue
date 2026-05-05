<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import  { ShieldCheck } from 'lucide-vue-next'
import { SettingCard } from '@/tenant/components/globals'
const settingsCards = [
    {
        title: "AML / CTF Rules",
        description: "Define anti-money laundering and terrorism financing rules.",
        type: "button",
        action: "Manage Rules →",
        route: { name: "tenant-compliance-aml" }
    },
    {
        title: "Audit Logs",
        description: "Review system activity and administrative changes.",
        type: "link",
        action: "View Logs →",
        route: { name: "tenant-compliance-audit-logs" }
    },
    {
        title: "Regulatory Reports",
        description: "Setup and generate mandatory regulatory reports.",
        type: "link",
        action: "Manage Reports →",
        route: { name: "tenant-compliance-reports" }
    }
]
</script>
<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <ShieldCheck class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Compliance & Audit</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure AML rules, audit logs, and regulatory reports</p>
            </div>
        </div>
        <SettingCard :settingsCards="settingsCards">
            
        </SettingCard>

    </div>
</template>
