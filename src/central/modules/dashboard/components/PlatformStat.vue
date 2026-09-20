<script setup lang="ts">
import type { Component } from 'vue'

/**
 * Headline figure, built to the same spec as the stat cards on Tenants, Licenses
 * and Platform Users: accent rail, tinted icon tile, uppercase label, heavy value.
 */
defineProps<{
  label: string
  value: string
  /** Secondary line. Factual — a count or a state, never a fabricated trend. */
  sub?: string
  /** Renders the sub line in the danger tone. Always paired with wording. */
  alert?: boolean
  icon?: Component
  /** Accent rail colour, e.g. 'bg-green-500'. */
  accent?: string
  iconBg?: string
  iconColor?: string
  loading?: boolean
}>()
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm"
  >
    <div :class="['absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl', accent ?? 'bg-neutral-300']" />

    <div class="pl-1">
      <div :class="['flex size-9 items-center justify-center rounded-xl mb-3', iconBg ?? 'bg-neutral-100']">
        <component :is="icon" v-if="icon" :class="['size-4', iconColor ?? 'text-neutral-500']" aria-hidden="true" />
      </div>

      <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">{{ label }}</p>

      <div v-if="loading" class="h-8 w-24 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800"></div>
      <p v-else class="text-2xl font-black tabular-nums">{{ value }}</p>

      <div v-if="loading" class="mt-1 h-3 w-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
      <p
        v-else-if="sub"
        class="text-xs mt-1"
        :class="alert ? 'font-semibold text-red-600 dark:text-red-400' : 'text-neutral-400'"
      >
        {{ sub }}
      </p>
    </div>
  </div>
</template>
