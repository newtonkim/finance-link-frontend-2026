<template>

    <button @click="isDrawerOpen = !isDrawerOpen"
        class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
        Member Onboarding →
    </button>

    <Drawer v-if="isDrawerOpen" width=" w-1/2" :showFooter="drawerShooter2" v-model:open="isDrawerOpen"
        @save="saveDrawerData">
        <template #drawer-title>
            <div class=" text-sm  border-b border-neutral-100 dark:border-neutral-800">
                <SheetHeader>
                    <SheetTitle>Member Onboarding Settings</SheetTitle>
                    <SheetDescription>
                        Configure how new members are onboarded and what information is required.
                    </SheetDescription>
                </SheetHeader>
            </div>
        </template>

        <template #body>


        </template>
    </Drawer>

</template>

<script setup lang="ts">

import { ref, watch, nextTick } from 'vue'
import { Users, Save, Wallet, AlertCircle, Loader2, ShieldCheck } from 'lucide-vue-next'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
    Label,
    Button
} from '@/Global'
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from 'vue-sonner'
import { Drawer } from '@/Global'

const settingsStore = useSettingsStore()

const isDrawerOpen = ref(false)
const savingOnboarding = ref(false)

const tempHideInitialDeposit = ref<boolean>(Boolean(settingsStore.hideInitialDeposit))
const tempHideOpeningBalance = ref<boolean>(Boolean(settingsStore.hideOpeningBalance))
const tempAutoCreateSavingsAccount = ref<boolean>(true)
const tempRequireMemberApproval = ref<boolean>(false)

// Sync local state when drawer opens — also fetch backend settings
watch(isDrawerOpen, async (isOpen) => {
    if (isOpen) {
        tempHideInitialDeposit.value = Boolean(settingsStore.hideInitialDeposit)
        tempHideOpeningBalance.value = Boolean(settingsStore.hideOpeningBalance)
        await settingsStore.fetchOnboardingSettings()
        tempAutoCreateSavingsAccount.value = settingsStore.autoCreateSavingsAccount
        tempRequireMemberApproval.value = settingsStore.requireMemberApproval
    }
})





async function handleSave() {
    savingOnboarding.value = true
    try {
        settingsStore.setHideInitialDeposit(Boolean(tempHideInitialDeposit.value))
        settingsStore.setHideOpeningBalance(Boolean(tempHideOpeningBalance.value))
        await settingsStore.saveOnboardingSettings({
            shares_compulsory: settingsStore.sharesCompulsory,
            min_shares_on_onboarding: settingsStore.minSharesOnOnboarding,
            share_price: settingsStore.sharePrice,
            shares_compulsory_applies_to_existing: settingsStore.sharesCompulsoryAppliesToExisting,
            auto_create_savings_account: tempAutoCreateSavingsAccount.value,
            require_member_approval: tempRequireMemberApproval.value,
        })
        isDrawerOpen.value = false
        nextTick(() => toast.success('Member onboarding settings saved.'))
    } catch {
        toast.error('Failed to save settings.')
    } finally {
        savingOnboarding.value = false
    }
}
defineProps({
    isDrawerOpen: {
        type: Boolean,
        default: false
    }
})
</script>