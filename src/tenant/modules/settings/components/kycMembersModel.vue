<template>
    <button @click="isDrawerOpen = !isDrawerOpen"
        class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline cursor-point">
        Member Onboarding →
    </button>
    <Drawer v-if="isDrawerOpen" width=" w-1/2" :showFooter="false" v-model:open="isDrawerOpen">
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