<template>
    <div class="  m-3">
        <div class=" items-center bg-white   rounded-md">
        <div class="w-1/2 flex items-center bg-white py-2 rounded-md">
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
import { CapitalLogs, Capital } from '.'
type FilterType = 'Capitalize' | 'Capital logs'
const statusFilter = ref<FilterType>('Capitalize')
const filters: FilterType[] = ['Capitalize', 'Capital logs']
// const activeComponent = computed(() => {
//     return statusFilter.value === 'Capitalize' ? Capital : CapitalLogs
// })

const activeComponent = computed(() => {
  switch (statusFilter.value) {
    case 'Capitalize':
      return Capital
    case 'Capital logs':
      return CapitalLogs
 
    default:
      return Capital
  }
})
</script> 