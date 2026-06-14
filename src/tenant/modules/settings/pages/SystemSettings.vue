<script setup lang="ts">
import { ref } from 'vue'
import { Monitor } from 'lucide-vue-next'

const timezone    = ref('Africa/Nairobi (EAT)')
const language    = ref('English')
const startMonth  = ref('January')
const dividend    = ref('Annually')
const maintenance = ref(false)
const debugLog    = ref(false)

const months          = ['January','February','March','April','May','June','July','August','September','October','November','December']
const dividendOptions = ['Annually', 'Semi-Annually', 'Quarterly', 'Monthly']
const timezones       = ['Africa/Nairobi (EAT)', 'Africa/Kampala (EAT)', 'Africa/Dar_es_Salaam (EAT)', 'Africa/Kigali (EAT)', 'UTC']
const languages       = ['English', 'Swahili', 'French']

const selectCls = 'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
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
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">System Settings</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure system-level preferences and defaults</p>
        </div>
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <!-- Timezone & Language -->
      <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">Timezone & Language</h3>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-neutral-500 dark:text-neutral-400">Timezone</label>
            <select v-model="timezone" :class="selectCls">
              <option v-for="tz in timezones" :key="tz">{{ tz }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-neutral-500 dark:text-neutral-400">Language</label>
            <select v-model="language" :class="selectCls">
              <option v-for="l in languages" :key="l">{{ l }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Financial Year -->
      <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">Financial Year</h3>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-neutral-500 dark:text-neutral-400">Start Month</label>
            <select v-model="startMonth" :class="selectCls">
              <option v-for="m in months" :key="m">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-neutral-500 dark:text-neutral-400">Dividend Computation</label>
            <select v-model="dividend" :class="selectCls">
              <option v-for="d in dividendOptions" :key="d">{{ d }}</option>
            </select>
          </div>
        </div>
      </div>



      <!-- System Behaviour -->
      <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
        <h3 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">System Behaviour</h3>
        <div class="space-y-5">
          <!-- Maintenance Mode -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-neutral-900 dark:text-white">Maintenance Mode</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Temporarily restrict member access</p>
            </div>
            <button
              type="button"
              @click="maintenance = !maintenance"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
              :class="maintenance ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300"
                :class="maintenance ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
          <div class="border-t border-neutral-100 dark:border-neutral-800" />
          <!-- Debug Logging -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-neutral-900 dark:text-white">Debug Logging</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Log detailed system events</p>
            </div>
            <button
              type="button"
              @click="debugLog = !debugLog"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
              :class="debugLog ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300"
                :class="debugLog ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Save -->
    <div class="flex justify-end">
      <button class="rounded-xl bg-[#052659] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#052659]/90 active:scale-[0.98] dark:bg-nfuko-yellow dark:text-[#0050D8] dark:hover:bg-[#052659]/90">
        Save Changes
      </button>
    </div>
  </div>
</template>
