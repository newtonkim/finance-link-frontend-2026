<script setup lang="ts">
import { ref } from 'vue'
import { Building2 } from 'lucide-vue-next'
import SaccoBrandingDrawer from '../components/SaccoBrandingDrawer.vue'
import CurrencySettingsDrawer from '../components/CurrencySettingsDrawer.vue'
import FiscalYearsCard from '../components/FiscalYearsCard.vue' 
import { SettingCard } from '@/tenant/components/globals' 
const fiscalYearsCard = ref<InstanceType<typeof FiscalYearsCard> | null>(null)
const brandingDrawer = ref<InstanceType<typeof SaccoBrandingDrawer> | null>(null)
const currencyDrawer = ref<InstanceType<typeof CurrencySettingsDrawer> | null>(null)
const settingsCards = [
    {
        title: "General Charges",
        description: "Charges applied on registration, shares, loan applications and more.",
        type: "link",
        route: { name: "tenant-settings-general-charges-list" },
        action: "Manage charges →"
    },
    {
        title: "Branch Management",
        description: "Manage branches and physical locations.",
        type: "link",
        route: { name: "tenant-settings-branch-list" },
        action: "Manage Branches →"
    },
    {
        title: "General Settings",
        description: "Configure basic organisation information and settings.",

    },
]
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">

        <!-- ─── Page Header ──────────────────────────────────────────────────── -->
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Building2 class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Organisation Settings
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage your organisation's identity and
                    structure</p>
            </div>
        </div>
        <!-- ─── Quick-action cards grid ─────────────────────────────────────── -->
        <SettingCard :settingsCards="settingsCards">
            <template #general-settings>
                <div class="mt-2 flex flex-wrap gap-3">
                    <button @click="brandingDrawer?.openDrawer()"
                        class="inline-flex items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white">
                        Sacco Branding Config →
                    </button>
                    <button @click="currencyDrawer?.openDrawer()"
                        class="inline-flex items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white">
                        Currency configuration →
                    </button>
                </div>
            </template>
        </SettingCard>

        <!-- ─── General Charges ──────────────────────────────────────────────── -->
        <!-- <GeneralChargesCard /> -->

        <!-- ─── Fiscal Years (drawer, self-contained) ────────────────────────── -->
        <FiscalYearsCard ref="fiscalYearsCard" />

        <!-- ─── Sacco Branding Drawer (self-contained) ───────────────────────── -->
        <SaccoBrandingDrawer ref="brandingDrawer" />

        <!-- ─── Currency Settings Drawer (self-contained) ───────────────────── -->
        <CurrencySettingsDrawer ref="currencyDrawer" />

    </div>
</template>
