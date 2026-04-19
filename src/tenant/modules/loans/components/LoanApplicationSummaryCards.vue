<script setup lang="ts">
import { statusMap } from '@/Global';
import { ClipboardList, Clock, FileSearch, FileWarning, ThumbsUp, HandCoins } from 'lucide-vue-next'

const props = defineProps<{
  list: any[]
  activeStatus: string
}>()

const emit = defineEmits<{ filter: [status: string] }>()
const statusConfig: Record<string, any> = {
  active: {
    label: 'Active',
    icon: ClipboardList,
    classes: 'border-neutral-100 bg-white text-neutral-900',
    ring: 'ring-nfuko-primary'
  },
  submitted: {
    label: 'Submitted',
    icon: Clock,
    classes: 'border-blue-100 bg-blue-50 text-blue-700',
    ring: 'ring-blue-500'
  },
  approved: {
    label: 'Approved',
    icon: HandCoins,
    classes: 'border-green-100 bg-green-50 text-green-700',
    ring: 'ring-green-500'
  },
  draft: {
    label: 'Draft',
    icon: FileWarning,
    classes: 'border-gray-100 bg-gray-50 text-gray-700',
    ring: 'ring-gray-500'
  },
  committee_voting: {
    label: 'Committee Voting',
    icon: ThumbsUp,
    classes: 'border-purple-100 bg-purple-50 text-purple-700',
    ring: 'ring-purple-500'
  },
  disbursed: {
    label: 'Disbursed',
    icon: FileSearch,
    classes: 'border-amber-100 bg-amber-50 text-amber-700',
    ring: 'ring-amber-500'
  }
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
    <button
      v-for="summary in list"
      :key="summary.status"
      class="group flex flex-col gap-1.5 rounded-2xl border p-4 shadow-sm transition-colors hover:border-neutral-300"
      :class="[
        statusConfig[summary.status]?.classes,
        activeStatus === summary.status ? `ring-2 ${statusConfig[summary.status]?.ring}` : ''
      ]"
      @click="emit('filter', summary.status)"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium">
          {{ statusMap[summary.status].label }}
        </span>

        <component
          :is="statusConfig[summary.status]?.icon"
          class="h-4 w-4 opacity-70"
        />
      </div>

      <span class="text-2xl font-bold">
        {{ summary.total }}
      </span>
    </button>

  </div>
</template>