<script setup lang="ts">
import { Lock } from 'lucide-vue-next'
import { licenseState } from '@/tenant/apis/licenseState'
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="-translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
  >
    <div v-if="licenseState.readOnly"
      class="mx-2 mt-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/25 dark:bg-amber-500/10">
      <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20">
        <Lock class="size-4" />
      </div>
      <div class="min-w-0">
        <p class="text-sm font-bold text-amber-800 dark:text-amber-300">Read-only mode — license expired</p>
        <p class="mt-0.5 text-[13px] font-medium text-amber-700/90 dark:text-amber-200/80">
          {{ licenseState.message }}
        </p>
      </div>
    </div>
  </Transition>
</template>
