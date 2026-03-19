<script setup lang="ts">
import { AlertCircle, Upload } from 'lucide-vue-next'

defineProps<{
  file: File | null
  parseError: string | null
}>()

const emit = defineEmits<{
  (e: 'change', file: File): void
}>()

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('change', file)
}
</script>

<template>
  <div class="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
    <p class="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
      Select your completed file to preview &amp; verify
    </p>
    <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-600 hover:border-nfuko-primary/60 hover:text-nfuko-primary transition-colors dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
      <Upload class="h-5 w-5 shrink-0" />
      <span class="truncate">{{ file ? file.name : 'Choose .xlsx, .xls or .csv file…' }}</span>
      <input type="file" accept=".xlsx,.xls,.csv" class="sr-only" @change="onInput" />
    </label>
    <p v-if="parseError" class="mt-2 flex items-center gap-1.5 text-xs text-red-500">
      <AlertCircle class="h-3.5 w-3.5 shrink-0" />{{ parseError }}
    </p>
    <p v-else class="mt-2 text-xs text-neutral-400">
      The file opens in a preview table where you can edit or delete rows before importing.
    </p>
  </div>
</template>
