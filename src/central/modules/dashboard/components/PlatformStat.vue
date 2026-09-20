<script setup lang="ts">
import type { Component } from 'vue'

/**
 * One headline figure. Deliberately not a card: the dashboard already nests enough
 * containers, and a rule between figures reads as a set without boxing each one.
 */
defineProps<{
  label: string
  value: string
  /** Secondary line. Kept factual — a count or a state, not a fabricated trend. */
  note?: string
  /** Draws the note in the warning tone. Paired with text, never colour alone. */
  alert?: boolean
  icon?: Component
  loading?: boolean
}>()
</script>

<template>
  <div class="flex flex-col gap-2 px-5 py-5 sm:px-6">
    <div class="flex items-center gap-2">
      <component
        :is="icon"
        v-if="icon"
        class="size-4 text-neutral-400 dark:text-neutral-500"
        aria-hidden="true"
      />
      <span class="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{{ label }}</span>
    </div>

    <div v-if="loading" class="h-8 w-24 animate-pulse rounded-md bg-neutral-200/70 dark:bg-white/10"></div>
    <p
      v-else
      class="text-[28px] font-semibold leading-none tracking-tight text-neutral-900 tabular-nums dark:text-white"
    >
      {{ value }}
    </p>

    <div v-if="loading" class="h-3 w-16 animate-pulse rounded bg-neutral-100 dark:bg-white/5"></div>
    <p
      v-else-if="note"
      class="text-[12px] font-medium"
      :class="alert ? 'text-nfuko-danger' : 'text-neutral-500 dark:text-neutral-400'"
    >
      {{ note }}
    </p>
  </div>
</template>
