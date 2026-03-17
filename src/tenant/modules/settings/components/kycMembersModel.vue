<template>

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
            </div>
        </template>

        <template #body>


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
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from 'vue-sonner'
import { Drawer } from '@/Global'
import { memmberSettingApi } from '../../../apis/members'

const {settingsList}=memmberSettingApi()

const settingsStore = useSettingsStore()

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
onMounted(async () => {
   
})
</script>