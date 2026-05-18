<template>
  <div
    class="flex min-w-[200px] py-1 mx-1 px-1 rounded-lg border border-neutral-200 bg-neutral-50 p-[1px] dark:border-neutral-700 dark:bg-neutral-800 dark:ring-1 dark:ring-inset dark:ring-white/5">
    <div class="w-full md:hidden" v-if="isMobile">
      <SearchableSelect v-model="selectedFilter" :options="filters.map(f => ({ id: f.id ?? f, name: f.name ?? f }))"
        placeholder="Filters" />
    </div>

    <template v-if="!isMobile">
      <template v-if="filters?.length > maxLength">
        <div class="w-full">
          <SearchableSelect v-model="selectedFilter" :options="filters.map(f => ({ id: f.id ?? f, name: f.name ?? f }))"
            placeholder="Filters" />
        </div>
      </template>

      <div v-else class='overflow-auto'>
        <button v-for="filter in filters" :key="filter.id ?? filter"
          class="rounded-md px-3.5 py-1 text-xs font-medium capitalize transition-all px-6 text-sm duration-200 rounded-lg"
          :class="filter === modelValue ? activeFilterClass : inactiveFilterClass"
          @click="() => updateStatusFilter(filter?.id ?? filter)">
          {{ filter.name ?? filter }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import SearchableSelect from '../SearchableSelect.vue'

const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  maxLength: { type: Number, required: false, default: 5 },
  filters: { type: Array, required: true },
  modelValue: { type: String, default: '' },
})

const activeFilterClass =
  'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'

const inactiveFilterClass =
  'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'

function updateStatusFilter(filter) {
  emit('update:modelValue', filter)
}

const selectedFilter = computed({
  get: () => props.modelValue,
  set: (val) => updateStatusFilter(val),
})

/* Detect screen size */
const isMobile = ref(true)

function checkScreen() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkScreen()
  window.addEventListener('resize', checkScreen)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreen)
})
</script>