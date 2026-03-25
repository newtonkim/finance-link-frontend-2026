<script setup lang="ts">
import { ref } from 'vue'
import { Building2 } from 'lucide-vue-next'
import SaccoBrandingDrawer from '../components/SaccoBrandingDrawer.vue'
import CurrencySettingsDrawer from '../components/CurrencySettingsDrawer.vue'
import FiscalYearsCard from '../components/FiscalYearsCard.vue'
import GeneralChargesCard from '../components/GeneralChargesCard.vue'
import ManageBranchesCard from '../components/ManageBranchesCard.vue'

const brandingDrawer   = ref<InstanceType<typeof SaccoBrandingDrawer> | null>(null)
const currencyDrawer   = ref<InstanceType<typeof CurrencySettingsDrawer> | null>(null)
const fiscalYearsCard  = ref<InstanceType<typeof FiscalYearsCard> | null>(null)
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">

    <!-- ─── Page Header ──────────────────────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
        <Building2 class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
      </div>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Organisation Settings</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage your organisation's identity and structure</p>
      </div>
    </div>

    <!-- ─── Quick-action cards grid ─────────────────────────────────────── -->
    <div class="grid gap-5 lg:grid-cols-2">

      <!-- General Settings card -->
      <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-1">General Settings</h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure basic organisation information and branding.</p>
        <div class="flex flex-col gap-2">
          <button
            @click="brandingDrawer?.openDrawer()"
            class="w-fit text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
          >
            Sacco Branding Config →
          </button>
          <button
            @click="currencyDrawer?.openDrawer()"
            class="w-fit text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
          >
            Currency configuration →
          </button>
        </div>
      </div>

      <!-- Fiscal Year card -->
      <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-1">Fiscal Year</h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define and manage your organisation's financial periods.</p>
        <button
          @click="fiscalYearsCard?.openListDrawer()"
          class="w-fit text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
        >
          Set Fiscal Year →
        </button>
      </div>

      <!-- Workflow & Approvals card -->
      <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-1">Workflow & Approvals</h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup approval workflows for various processes.</p>
        <button class="w-fit text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
          Configure Workflows →
        </button>
      </div>

    </div>

    <!-- ─── Branch Management ────────────────────────────────────────────── -->
    <ManageBranchesCard />

    <!-- ─── General Charges ──────────────────────────────────────────────── -->
    <GeneralChargesCard />

    <!-- ─── Fiscal Years (drawer, self-contained) ────────────────────────── -->
    <FiscalYearsCard ref="fiscalYearsCard" />

    <!-- ─── Sacco Branding Drawer (self-contained) ───────────────────────── -->
    <SaccoBrandingDrawer ref="brandingDrawer" />

    <!-- ─── Currency Settings Drawer (self-contained) ───────────────────── -->
    <CurrencySettingsDrawer ref="currencyDrawer" />

  </div>
</template>
