<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Monitor } from 'lucide-vue-next'
import {  tenantSettings } from '../navigations'
const routes = Object.values(tenantSettings)
const developmentSettings: any = ref({})

onMounted(() => {
  if (routes.length) {
    developmentSettings.value = routes[0]
  }
})
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
    <!-- Header -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <Monitor class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Tenants  Settings
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Configure Tenants level preferences and defaults
          </p>
        </div>
      </div>
    </div>

    <div class="grid gap-3 grid-cols-6">
      <!-- Sidebar -->
      <div
        class="rounded-2xl col-span-2 border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">Settings</h3>
        <div class="space-y-4">
          <div
            v-for="value in routes"
            :key="value.path"
            @click="developmentSettings = value"
            class="capitalize cursor-pointer p-2 rounded-lg"
            :class="developmentSettings.path === value.path ? ' bg-[#001e22]/90 dark:bg-emerald-900 font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'"
          >
            <p
            :class="[
              developmentSettings.path === value.path ? 'text-white' : 'text-neutral-900 dark:text-white'
            ]"
            class="text-sm text-neutral-900 dark:text-white">{{ value.title }}</p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ value.description }}</p>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <div
        class="rounded-2xl col-span-4 border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">
          {{ developmentSettings.title || 'Select a setting' }}
        </h3>
        <div class="space-y-4">
          <!-- Dynamically render the selected component -->
          <component v-if="developmentSettings.component" :is="developmentSettings.component" />
          <p v-else class="text-neutral-500 dark:text-neutral-400">
            No component selected.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>