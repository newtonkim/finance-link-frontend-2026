<script setup lang="ts">
import SettingsSidebar from '../components/SettingsSidebar.vue'
import SettingsSearch from '../components/SettingsSearch.vue'
import SettingsBreadcrumbs from '../components/SettingsBreadcrumbs.vue'
</script>

<template>
  <div class="flex flex-col h-full w-full bg-white dark:bg-neutral-950 overflow-hidden">
    <!-- Settings Header -->
    <header
      class="h-16 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-6 bg-white dark:bg-neutral-900 z-10">
      <div class="flex items-center gap-6">
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <div class="hidden md:block h-6 w-[1px] bg-neutral-200 dark:bg-neutral-700"></div>
        <SettingsBreadcrumbs />
      </div>
      <div class="flex items-center gap-4">
        <SettingsSearch />
      </div>
    </header>

    <!-- Settings Body -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar -->
      <SettingsSidebar />

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Optional: specific styles for the settings layout */
</style>
