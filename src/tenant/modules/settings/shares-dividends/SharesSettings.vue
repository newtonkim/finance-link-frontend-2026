<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { PieChart, Users, Calendar, Percent } from 'lucide-vue-next'
import { useCurrencyStore } from '@/stores/currency'
import { SettingCard } from '@/tenant/components/globals'
import { useSharesSettings } from '../composables/useSharesSettings'
import ManageSharesDrawer from '../components/shares-dividends/ManageSharesDrawer.vue'
import DividendDrawer from '../components/shares-dividends/DividendDrawer.vue'
import { sharemanagment } from '.'

const { currencyCode } = storeToRefs(useCurrencyStore())
const drawerOpen = ref(false)
const currentPage = ref<string | null>(null)
const drawerTitle = ref("")
const {
    // Shares
    sharesDrawerOpen,
    sharesDrawerSaving,
    sharesDrawerLoading,
    tempHideIsShareholderField,
    tempSharesCompulsory,
    tempMinShares,
    tempSharePrice,
    tempAppliesToExisting,
    minInvestment,
    openSharesDrawer,
    saveSharesSettings,

    // Dividend
    dividendDrawerOpen,
    dividendDrawerSaving,
    dividendForm,
    saveDividendSettings,

    // Options
    accountTypeOptions,
    frequencyOptions,
    basisOptions,
    roundingOptions,
    months,
} = useSharesSettings()

const settingsCards = [
    {
        id: "share-management",
        title: "Share Management",
        description: "Manage share products and related account settings.",
        // type: "link",
        slot: "share-management",
        // action: "Manage Shares →"


        // action: openSharesDrawer
    },
    {
        id: "share-capital",
        title: "Share Capital",
        description: "Manage share capital structure and limits.",
        type: "link",
        action: "Manage Capital →",
        slot: "share-capital",
        route: { name: "tenant-settings-Capitalize-list" },


    },
    {
        id: "share-pricing",
        title: "Share Pricing",
        description: "Set and update share prices over time.",
        action: "Configure Pricing →"
    },
    {
        id: "dividends",
        title: "Dividend Distribution",
        description: "Setup rules and schedules for dividend payouts.",
        type: "button",
        action: () => { dividendDrawerOpen.value = true }
    }
]
const pages: Record<string, any> = {
    "share-management": {
        title: "share management",
        page: sharemanagment
    },
    "savings-group-savings-setting": {
        title: "Savings Accounts",
        // page: GroupSavingSettingsList
    }
}
function toggleDrawer(page: string) {
    console.log(page);
    
  currentPage.value = page
  drawerTitle.value = pages[page]?.title || ""
  drawerOpen.value = true
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 dark:bg-[#0a0a0a] md:p-6">

        <!-- Page Header -->
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <PieChart class="text-nfuko-primary dark:text-bg-nfuko-yellow h-5 w-5" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Shares & Dividends</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure share capital, pricing, and
                    distributions</p>
            </div>
        </div>

        <SettingCard :settingsCards="settingsCards">
            <template #share-management>
                <button @click="toggleDrawer('share-management')"
                    class="text-nfuko-primary dark:text-bg-nfuko-yellow text-sm font-medium hover:underline">
                    Manage Shares →
                </button>
            </template>
            <!-- <template #share-capital>
                <Link  to="/tenant/settings/shares-dividends/capital"
                    class="text-nfuko-primary dark:text-bg-nfuko-yellow text-sm font-medium hover:underline">
                    Manage capital →
                </Link>
            </template> -->

            <template #dividend-distribution>
                <div class="mb-4 flex flex-wrap gap-3">
                    <div
                        class="flex items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[12px] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800">
                        <Users class="h-3 w-3" />
                        <span>{{ dividendForm.distribution_account_type === 'shareholders_only' ? 'Share holders only' :
                            'All accounts' }}</span>
                    </div>
                    <div
                        class="flex items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[12px] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800">
                        <Calendar class="h-3 w-3" />
                        <span class="capitalize">{{ dividendForm.frequency.replace('_', ' ') }}</span>
                    </div>
                    <div v-if="dividendForm.dividend_rate"
                        class="flex items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[12px] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800">
                        <Percent class="h-3 w-3" />
                        <span>{{ dividendForm.dividend_rate }}% rate</span>
                    </div>
                </div>

                <button @click="dividendDrawerOpen = true"
                    class="text-nfuko-primary dark:text-bg-nfuko-yellow text-sm font-medium hover:underline">
                    Configure Dividends →
                </button>
            </template>
        </SettingCard>
    </div>

    <!-- Modals / Drawers -->
    <ManageSharesDrawer v-model:show="sharesDrawerOpen" v-model:shares-compulsory="tempSharesCompulsory"
        v-model:min-shares="tempMinShares" v-model:share-price="tempSharePrice"
        v-model:applies-to-existing="tempAppliesToExisting"
        v-model:hide-is-shareholder-field="tempHideIsShareholderField" :loading="sharesDrawerLoading"
        :saving="sharesDrawerSaving" :currency-code="currencyCode" :min-investment="minInvestment"
        :save-settings="saveSharesSettings" />

    <DividendDrawer v-model:show="dividendDrawerOpen" :form="dividendForm" :saving="dividendDrawerSaving"
        :currency-code="currencyCode" :account-type-options="accountTypeOptions" :frequency-options="frequencyOptions"
        :basis-options="basisOptions" :rounding-options="roundingOptions" :months="months"
        :save-settings="saveDividendSettings" />



          <Drawer  v-if="drawerOpen"  width="w-1/2"  v-model:open="drawerOpen"  :title="drawerTitle"  >
        <template #body>
          <component v-if="currentPage" :drawerOpen="drawerOpen" :is="pages[currentPage]?.page"
          />
        </template>
  </Drawer>
</template>
