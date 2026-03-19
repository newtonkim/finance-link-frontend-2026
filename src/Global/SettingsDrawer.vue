<script setup lang="ts">
defineProps<{ open: boolean; maxWidth?: string; ariaLabel?: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          :style="maxWidth ? `max-width: ${maxWidth}` : 'max-width: 560px'"
          role="dialog"
          :aria-label="ariaLabel"
        >
          <div class="flex h-full flex-col">
            <!-- Header slot -->
            <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
              <slot name="header" />
            </div>

            <!-- Body slot -->
            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <slot />
            </div>

            <!-- Footer slot -->
            <div class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <slot name="footer" />
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>
