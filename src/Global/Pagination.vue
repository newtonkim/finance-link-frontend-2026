<script setup lang="ts">
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  links?: {
    url: string | null
    label: string
    active: boolean
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  page?: number
  perPage?: number
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:perPage', value: number): void
  (e: 'change', value: number): void
}>()

const perPageFrequency = [10, 25, 50, 100, 200]

const currentPage = computed({
  get: () => props.page ?? props.links?.current_page ?? 1,
  set: (val: number) => emit('update:page', val),
})

const currentPerPage = computed({
  get: () => props.perPage ?? props.links?.per_page ?? 50,
  set: (val: number) => emit('update:perPage', val),
})

function goToPage(page: number) {
  if (!props.links) return
  if (page < 1 || page > props.links.last_page) return
  emit('change', page)
  currentPage.value = page
}

function nextPage() {
  goToPage(currentPage.value + 1)
}

function prevPage() {
  goToPage(currentPage.value - 1)
}

const formatLabel = (label: string) => {
  if (label.includes('Previous')) return 'Previous'
  if (label.includes('Next')) return 'Next'
  return label
}
</script>

<template>
  <!-- {{ links }} -->
  <div
    v-if="links?.length > 1"
    class="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-0 px-4"
  >
    <!-- Results Summary -->
    <div v-if="links" class="text-sm text-neutral-500 dark:text-neutral-400">
      Showing
      <span class="font-medium text-neutral-900 dark:text-white">
        {{ links.from || 0 }}
      </span>
      to
      <span class="font-medium text-neutral-900 dark:text-white">
        {{ links.to || 0 }}
      </span>
      of
      <span class="font-medium text-neutral-900 dark:text-white">
        {{ links.total }}
      </span>
      results
    </div>

    <!-- links Controls -->
    <nav class="flex items-center gap-1.5">
      <!-- Previous -->
      <button
        @click="prevPage"
        :disabled="currentPage <= 1"
        class="flex items-center gap-1 p x-3 p -1.5 p-2 border-1 text-sm round ed-lg rounded-full transition"
        :class="
          currentPage <= 1
            ? 'text-neutral-300 cursor-not-allowed'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
        "
      >
        <ChevronLeft :size="16" />
        <!-- <span class="hidden sm:inline">Prev</span> -->
      </button>

      <!-- Page Numbers -->
      <template v-for="(link, key) in links" :key="key">
        <span
          v-if="link.label === '...'"
          class="flex items-center justify-center w-8 h-8 text-neutral-400"
        >
          <MoreHorizontal :size="16" />
        </span>

        <button
          v-else-if="!link.label.includes('Previous') && !link.label.includes('Next')"
          @click="goToPage(Number(link.label))"
          class="min-w-[32px] h-8 px-2 text-sm font-medium rounde d-lg transition rounded-full"
          :class="
            link.active
              ? ' bg-nfuko-primary/80 text-white'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          "
        >
          {{ formatLabel(link.label) }}
        </button>
      </template>

      <!-- Next -->
      <button
        @click="nextPage"
        :disabled="links && currentPage >= links.last_page"
        class="flex items-center gap-1 px -3 p y-1.5 p-2 text-sm rounded-full border-1 transition"
        :class="
          links && currentPage >= links.last_page
            ? 'text-neutral-300 cursor-not-allowed'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
        "
      >
        <!-- <span class="hidden sm:inline">Next</span> -->
        <ChevronRight :size="16" />
      </button>

      <!-- Per Page -->
      <select
        v-model="currentPerPage"
        class="ml-3 border border-neutral-100 rounded-md text-sm px-2 py-1 focus:outline-none text-neutral-500"
      >
        <option v-for="value in perPageFrequency" :key="value" :value="value">
          {{ value }}
        </option>
      </select>
    </nav>
  </div>
</template>
