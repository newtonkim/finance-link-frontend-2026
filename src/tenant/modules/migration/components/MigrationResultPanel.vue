<script setup lang="ts">
import { AlertCircle, CheckCircle2 } from 'lucide-vue-next'

defineProps<{
  imported: number
  errors: string[]
}>()
</script>

<template>
  <div class="space-y-2">
    <div
      v-if="imported > 0"
      class="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400"
    >
      <CheckCircle2 class="h-4 w-4 shrink-0" />
      {{ imported }} record(s) imported successfully.
    </div>
    <div
      v-if="errors.length"
      class="rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 dark:border-red-900/30 dark:bg-red-900/10"
    >
      <div class="mb-1 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
        <AlertCircle class="h-4 w-4 shrink-0" />{{ errors.length }} row(s) had errors:
      </div>
      <ul class="ml-6 max-h-36 list-disc overflow-y-auto space-y-0.5 text-xs text-red-600 dark:text-red-400">
        <li v-for="err in errors" :key="err">{{ err }}</li>
      </ul>
    </div>
    <div
      v-if="imported === 0 && errors.length === 0"
      class="flex items-center gap-2 rounded-lg bg-neutral-50 px-4 py-2.5 text-sm text-neutral-500 dark:bg-neutral-800"
    >
      No records were imported.
    </div>
  </div>
</template>
