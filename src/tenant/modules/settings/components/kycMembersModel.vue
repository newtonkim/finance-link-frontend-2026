<template>
member-onboarding-settings-list

    <button @click="isDrawerOpen = !isDrawerOpen"
        class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
        Member Onboarding →
    </button>

    <Drawer v-if="isDrawerOpen" width=" w-1/2" :showFooter="false" v-model:open="isDrawerOpen"
        >
        <template #drawer-title>
            <div class=" text-sm  border-b border-neutral-100 dark:border-neutral-800">
                <SheetHeader>
                    <SheetTitle>Member Onboarding Settings</SheetTitle>
                    <SheetDescription>
                        Configure how new members are onboarded and what information is required.
                    </SheetDescription>
                </SheetHeader>

                <div> 
                </div>
            </div>
        </template>

        <template #body> 
<settingsForm  
 :fields="fields"
 />

        </template>
    </Drawer>

</template>

<script setup lang="ts">

import { ref, watch, nextTick, onMounted } from 'vue'
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
import { pomPinia } from 'septor-store';


import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from 'vue-sonner'
import { Drawer,settingsForm } from '@/Global'
import { memmberSettingApi } from '../../../apis/members'
const inputClass = 'w-full rounded-lg border focus:border-nfuko-primary/50 focus:ring-1    bg-white px-3 py-2.5 text-sm outline-none transition  border-nfuko-primary/10 focus:ring-1 focus:ring-bg-nfuko-primary/90 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]/90 dark:focus:ring-[#8ba8a2]/90';

    const Store = pomPinia();
const {settingsList}=memmberSettingApi()

const settingsStore = useSettingsStore()
const fields = ref([])

const isDrawerOpen = ref(false)

defineProps({
    isDrawerOpen: {
        type: Boolean,
        default: false
    }
})
watch(() => isDrawerOpen.value, (val) => {
    /// let call appon request not 
    if (val) {
        nextTick(() => {
            settingsList()
        })
    }
})
function identifyTheFields(settings) {
    settings.settings_action[attr]

}


onMounted(async () => {
   fields.value=Object.values(Store['member-onboarding-settings-list']?.payload??{})
})
</script>