<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    items: any[]
    emptyText?: string
    labelKey?: string
    typeKey?: string
  }>(),
  {
    emptyText: 'No items available',
    labelKey: 'name',
    typeKey: 'type',
  }
)


function getValue(item: any, key: string) {
  return item?.[key] ?? ''
}
</script>

<template>
  <div class="">
    <!-- Title -->
 
       <h4 class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
       {{ title }}
        </h4>

    <!-- List -->
    <div v-if="items?.length"  class="">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center justify-between px-3 py-2 my-1 rounded-lg bg-neutral-50 dark:bg-neutral-800"
      >
        <span class="text-[14px] text-neutral-800 dark:text-neutral-200 truncate">
          {{ getValue(item, labelKey) }}
        </span>

        <span class="text-xs text-neutral-400">
          {{ getValue(item, typeKey) }}
        </span>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="text-xs text-neutral-400 italic">
      {{ emptyText }}
    </div>
  </div>
</template>