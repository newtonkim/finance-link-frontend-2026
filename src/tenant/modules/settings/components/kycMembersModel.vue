<template>
    <button @click="isDrawerOpen = !isDrawerOpen"
        class="inline-flex items-center justify-center rounded-full bg-[#06265a] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:hover:bg-[#06265a]/90">
        Member Onboarding →
    </button>
    <Drawer v-if="isDrawerOpen" title="Member Onboarding Settings" width=" w-1/2" :showFooter="false" v-model:open="isDrawerOpen">
        <template #drawer-title>
            <div class=" text-sm   border-neutral-100  ">
                <div>
                    <h2 class="text-lg text-neutral-800 dark:text-neutral-400">Member Onboarding Settings</h2>
                    <div class="text-md text-neutral-800 dark:text-neutral-400">
                        Configure how new members are onboarded and what information is required.
                    </div>
                </div>
                <div>
                </div>
            </div>
        </template>
        <template #body>
            <div v-if='isDrawerOpen'>
                <settingsForm url="settings/member/onboarding/settings-list" />
            </div>
        </template>
    </Drawer>
</template>
<script setup lang="ts">
import { ref, watch, nextTick, } from 'vue'
import { Drawer, settingsForm } from '@/Global'

const isDrawerOpen = ref(false)
defineProps({
    isDrawerOpen: {
        type: Boolean,
        default: false
    }
})




</script>
