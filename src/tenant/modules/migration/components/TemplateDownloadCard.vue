<script setup lang="ts">
import { ref } from 'vue'
import { Download } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  description: string
  filename: string
  downloadFn: () => Promise<{ data: Blob }>
}>()

const loading = ref(false)

async function download() {
  if (loading.value) return
  loading.value = true
  try {
    const res = await props.downloadFn()
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = props.filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
    <p class="mb-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200">{{ title }}</p>
    <p class="mb-3 text-xs text-neutral-500 dark:text-neutral-400">{{ description }}</p>
    <button
      :disabled="loading"
      @click="download"
      class="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
    >
      <Download class="h-4 w-4" />
      {{ loading ? 'Downloading…' : 'Download Template' }}
    </button>
  </div>
</template>
