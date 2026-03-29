<template>

  <div
    class="flex min-w-[200px] py-1 mx-1 px-1 rounded-lg border border-neutral-200 bg-neutral-50 p-[1px] dark:border-neutral-700 dark:bg-neutral-800"
  >
  <template v-if="filters?.length>maxLength">
    <div class="w-full">
        <SearchableSelect class="p-0"    v-model="selectedFilter" :options="defineFiltersPertten()" placeholder="filters"/>
    </div>
  </template>

  <template v-else>
    <button
      v-for="filter in filters"
      :key="filter"
      class="rounded-md px-3.5 py-1 text-xs font-medium capitalize transition-all px-6  text-sm font-medium transition-all duration-200 rounded-lg"
      :class="filter === modelValue ? activeFilterClass : inactiveFilterClass"
      @click="() => updateStatusFilter(filter?.id??filter)"
    >
      {{ filter.name??filter }}
    </button>
</template>
  
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SearchableSelect from '../SearchableSelect.vue'
const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  maxLength: { type: Number, required: false, default: 5 },
  filters: { type: Array, required: true },
  modelValue: { type: String, default: '' },
})
const activeFilterClass = 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5 e'
const inactiveFilterClass = 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
function updateStatusFilter(filter) {
  emit('update:modelValue', filter)
}
function defineFiltersPertten(){
    return     props.filters.map(f => ({ id: f.id??f, name: f.name??f }))
}
const selectedFilter = computed({
  get: () => props.modelValue,
  set: (val) => updateStatusFilter(val),
})
</script>
