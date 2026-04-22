<template>
  <div class="py-3 px-1 space-y-6 bg-nfuko-danger/10 dark:bg-neutral-800 rounded-md shadow">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Upload Errors</h1>
      <div class="text-sm text-gray-500">
        Failed: {{ tableData.length }} | Passed: {{ passedCount }}
      </div>
    </div>

    <div v-if="!tableData.length" class="text-center py-10 text-gray-400">
      No failed records
    </div>

    <!-- Table -->
    <Table
      v-else
      :key="tableColumns.length"
      :dataFilter="tableData"
      :columns="tableColumns"
      :handleAction="handleAction"
      :action_config="ACTION_CONFIG"
    >
      <template #reason="{ item }">
        <span class="text-red-600 font-medium">
          {{ formatReason(item?.reason) }}
        </span>
      </template>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Table from '../landingLayout/Components/Table.vue'

const props = defineProps({
  data: { type: Object, required: true }
})

const ACTION_CONFIG = {} // define your actions if needed

// --- organize table data ---
const tableData:any = computed(() => {
  const data = props.data?.payload?.failed ||props.data|| []

  return data.map((row:any) => {
    const newRow: Record<string, any> = {}
    const storage=[]

    console.log(row);
    Object.entries(row).forEach(([key, value]) => {
        
      if (value === null) {
        newRow[key] = null
        newRow['key'] = key
        newRow['label'] = value
      } else if (typeof value === 'object') {
        newRow[key] = JSON.stringify(value)
      } else {
        newRow[key] = value
      }
    })

    return newRow
  })
})

// --- passed count ---
const passedCount = computed(() => props.data?.payload?.['passed-count'] || 0)

// --- table columns ---
const tableColumns = computed(() => {
  const data = tableData.value
  if (!data.length) return []

  const hiddenFields = ['password', 'remember_token']
  const keysSet = new Set<string>()

  data.forEach((row:any) => {
    Object.keys(row).forEach((key) => {
      if (!hiddenFields.includes(key)) keysSet.add(key)
    })
  })

  let keys = Array.from(keysSet)
  // move reason last
  keys = keys.filter((k) => k !== 'reason')
  keys.push('reason')

  return keys.map((key) => ({
    label: formatKey(key),
    key,
  }))
})

// --- helpers ---
function formatKey(key: string) {
  return key.replace(/_/g, ' ').toUpperCase()
}

function formatReason(reason: any) {
  if (!reason) return 'Unknown error'
  if (typeof reason === 'string') return reason
  if (reason?.errorInfo) return reason.errorInfo[2]
  return JSON.stringify(reason)
}

// --- action handler ---
function handleAction(item: any, action: string) {
  console.log('Action:', action, item)
}
</script>