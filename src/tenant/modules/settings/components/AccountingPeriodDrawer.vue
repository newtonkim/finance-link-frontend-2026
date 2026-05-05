<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { X, Lock, Unlock, Loader2, AlertCircle } from 'lucide-vue-next'
import { tenantClient as request } from '@/tenant/apis/tenantClient'
import { toast } from 'vue-sonner'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const toggling = ref<string | null>(null)
const periods = ref<any[]>([])
const customPeriod = ref<string>('')

const fetchPeriods = async () => {
  loading.value = true
  try {
    const res = await request.get('/accounting-periods')
    periods.value = res.data?.data || []
  } catch (error: any) {
    toast.error('Failed to load accounting periods.')
  } finally {
    loading.value = false
  }
}

const toggleLock = async (periodCode: string) => {
  if (!periodCode) return;

  toggling.value = periodCode
  try {
    const res = await request.post('/accounting-periods/toggle', {
      period_code: periodCode
    })

    // Update local state
    const index = periods.value.findIndex(p => p.period_code === periodCode)
    if (index !== -1) {
      periods.value[index] = { ...periods.value[index], ...res.data.data }
    } else {
      // If it's a custom period not in the list, refresh the list or push it
      periods.value.unshift(res.data.data)
      periods.value.sort((a, b) => b.period_code.localeCompare(a.period_code))
    }

    customPeriod.value = ''
    toast.success(res.data.message)
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to toggle period lock.')
  } finally {
    toggling.value = null
  }
}

onMounted(() => {
  if (props.isOpen) {
    fetchPeriods()
  }
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

    <!-- Drawer Panel -->
    <div class="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col animate-slide-in-right">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Accounting Periods</h2>
          <p class="text-xs text-neutral-500">Lock historical periods to prevent ledger postings</p>
        </div>
        <button @click="$emit('close')" class="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4">

        <div v-if="loading" class="flex justify-center items-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-nfuko-primary dark:text-bg-nfuko-yellow" />
        </div>

        <template v-else>
          <div class="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
            <AlertCircle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-amber-800 dark:text-amber-300">
              Locking a period prevents all users from posting new expenses or journals dated within that month.
            </p>
          </div>

          <!-- Custom Period Selector -->
          <div class="flex flex-col gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 mb-6">
            <label class="text-sm font-semibold text-neutral-900 dark:text-white">Manage Specific Period</label>
            <div class="flex items-center gap-3">
              <input
                type="month"
                v-model="customPeriod"
                class="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
              <button
                @click="toggleLock(customPeriod)"
                :disabled="!customPeriod || toggling === customPeriod"
                class="bg-nfuko-primary text-white hover:bg-nfuko-primary/90 disabled:opacity-50 h-9 px-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center dark:bg-nfuko-yellow dark:text-neutral-900"
              >
                <Loader2 v-if="toggling === customPeriod" class="w-4 h-4 animate-spin" />
                <span v-else>Toggle Lock</span>
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="period in periods"
              :key="period.period_code"
              class="flex flex-col p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    {{ period.period_code }}
                    <span
                      v-if="period.is_locked"
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                    >
                      Locked
                    </span>
                    <span
                      v-else
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    >
                      Open
                    </span>
                  </h3>
                  <p class="text-xs text-neutral-500 mt-1" v-if="period.is_locked">
                    Locked by {{ period.locked_by }}
                  </p>
                </div>

                <button
                  @click="toggleLock(period.period_code)"
                  :disabled="toggling === period.period_code"
                  class="relative inline-flex h-8 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus:outline-none"
                  :class="[
                    period.is_locked
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40',
                    toggling === period.period_code ? 'opacity-70 cursor-not-allowed' : ''
                  ]"
                >
                  <Loader2 v-if="toggling === period.period_code" class="w-4 h-4 animate-spin" />
                  <template v-else>
                    <Unlock v-if="period.is_locked" class="w-4 h-4 mr-2" />
                    <Lock v-else class="w-4 h-4 mr-2" />
                    {{ period.is_locked ? 'Unlock' : 'Lock' }}
                  </template>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in-right {
  animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
