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
<div v-for="field in list" :key="field.name" class="mb-4">
  <label :for="field.name" class="block font-medium">{{ field.label }}</label>
  <input 
    v-if="field.type === 'text' || field.type === 'number'" 
    :type="field.type" 
    v-model="field.value" 
    :id="field.name"
    :placeholder="field.description"
    class="border rounded p-2 w-full"
  />
  <input 
    v-else-if="field.type === 'switch'" 
    type="checkbox" 
    v-model="field.value" 
    :id="field.name"
  />
  <p class="text-sm text-gray-500">{{ field.description }}</p>
</div>

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
import { Drawer } from '@/Global'
import { memmberSettingApi } from '../../../apis/members'

    const Store = pomPinia();
const {settingsList}=memmberSettingApi()

const settingsStore = useSettingsStore()
const list = ref([])

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
const $field={
 
}

onMounted(async () => {
   list.value=Object.values(Store['member-onboarding-settings-list']?.payload??{})
})
</script>