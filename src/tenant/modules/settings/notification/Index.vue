<template>
    <div class="  m-3">
        <div class=" items-center bg-white   rounded-md">
        <div class="w-1/3 flex items-center bg-white py-2 rounded-md">
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </div>
        </div>
        <div class="w-full">
            <component :is="activeComponent" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { notificationSetting, notificationList } from '.'
type FilterType = 'Charges' | 'Notification List'
const statusFilter = ref<FilterType>('Charges')
const filters: FilterType[] = ['Charges', 'Notification List']
const activeComponent = computed(() => {
    return statusFilter.value === 'Charges' ? notificationSetting : notificationList
})
</script>