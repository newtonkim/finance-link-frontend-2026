<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CalendarDays, Plus, Trash2, ShieldCheck, Loader2 } from 'lucide-vue-next'
import { publicHolidaysApi, type PublicHoliday } from '../../../apis/settings/publicHolidaysApi'
import ConfirmationDialog from '@/Global/confirmationDialog/confirmationDialog.vue'
import { toast } from 'vue-sonner'

const holidays = ref<(PublicHoliday & { isNew?: boolean; isDeleted?: boolean })[]>([])
const initialHolidays = ref<string>('')
const pushHolidays = ref(false)
const pushHolidaysWeekdaysOnly = ref(false)
const relativeScheduling = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)

const showDeleteDialog = ref(false)
const holidayToDelete = ref<any>(null)

const leaveTypes = ref([
  { label: 'Annual Leave', days: 21 },
  { label: 'Sick Leave', days: 30 },
  { label: 'Maternity Leave', days: 90 },
  { label: 'Paternity Leave', days: 14 },
  { label: 'Compassionate Leave', days: 5 },
])

async function fetchHolidays() {
  isLoading.value = true
  try {
    const response = await publicHolidaysApi.list()
    holidays.value = response.data.data
    const settings = response.data.settings
    pushHolidays.value = settings.push_installments_on_holidays

    if (typeof settings.push_installments_on_holidays_weekdays_only === 'boolean') {
      pushHolidaysWeekdaysOnly.value = settings.push_installments_on_holidays_weekdays_only
    }

    if (typeof settings.relative_scheduling === 'boolean') {
      relativeScheduling.value = settings.relative_scheduling
    }

    initialHolidays.value = JSON.stringify(holidays.value)
  } catch (error) {
    console.error('Failed to fetch holidays:', error)
  } finally {
    isLoading.value = false
  }
}

function addHoliday() {
  // Only add locally, do not call API yet
  holidays.value.push({
    id: Date.now(), // Temporary ID for Vue :key
    name: 'New Holiday',
    date: new Date().toISOString().slice(0, 10),
    recurring: false,
    isNew: true
  })
}

function removeHoliday(h: any) {
  if (h.isNew) {
    holidays.value = holidays.value.filter((item) => item.id !== h.id)
  } else {
    holidayToDelete.value = h
    showDeleteDialog.value = true
  }
}

async function confirmDelete() {
  if (!holidayToDelete.value) return

  try {
    const h = holidayToDelete.value
    await publicHolidaysApi.delete(h.id)
    holidays.value = holidays.value.filter((item) => item.id !== h.id)
    initialHolidays.value = JSON.stringify(holidays.value.filter(i => !i.isNew))
    showDeleteDialog.value = false
    holidayToDelete.value = null
    toast.success('Holiday successfully deleted')
  } catch (error) {
    console.error('Failed to delete holiday:', error)
    toast.error('Failed to delete holiday')
  }
}

async function saveAll() {
  isSaving.value = true
  try {
    // 1. Save global settings
    await publicHolidaysApi.updateSettings({
      push_installments_on_holidays: pushHolidays.value,
      push_installments_on_holidays_weekdays_only: pushHolidaysWeekdaysOnly.value,
      relative_scheduling: relativeScheduling.value
    })

    // 2. Sync holidays
    const currentHolidays = holidays.value
    for (const h of currentHolidays) {
      if (h.isNew) {
        // Create new
        await publicHolidaysApi.create({
          name: h.name,
          date: h.date,
          recurring: h.recurring
        })
      } else {
        // Update existing (only if changed - optional check for performance)
        await publicHolidaysApi.update(h.id, {
          name: h.name,
          date: h.date,
          recurring: h.recurring
        })
      }
    }

    // 3. Refresh to get real IDs and clean state
    await fetchHolidays()
    toast.success('Settings and holidays saved successfully!')
  } catch (error) {
    console.error('Failed to save settings:', error)
    toast.error('Failed to save some settings. Please check console.')
  } finally {
    isSaving.value = false
  }
}

function formatDisplayDate(h: PublicHoliday) {
  if (h.recurring) {
    const d = new Date(h.date)
    const month = d.toLocaleString('en-US', { month: 'short' })
    const day = d.getDate()

    // Add ordinal suffix (1st, 2nd, 3rd, 4th...)
    const suffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
        }
    }

    return `Every ${month} ${day}${suffix(day)}`
  }
  return h.date
}

function togglePushHolidays() {
  pushHolidays.value = !pushHolidays.value
  if (pushHolidays.value) {
    pushHolidaysWeekdaysOnly.value = false
    relativeScheduling.value = false
  }
}

function togglePushHolidaysWeekdaysOnly() {
  pushHolidaysWeekdaysOnly.value = !pushHolidaysWeekdaysOnly.value
  if (pushHolidaysWeekdaysOnly.value) {
    pushHolidays.value = false
    relativeScheduling.value = false
  }
}

function toggleRelativeScheduling() {
  relativeScheduling.value = !relativeScheduling.value
  if (relativeScheduling.value) {
    pushHolidays.value = false
    pushHolidaysWeekdaysOnly.value = false
  }
}

onMounted(fetchHolidays)

const selectCls =
  'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a] overflow-y-auto">
    <!-- Header -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
            >
            <CalendarDays class="h-5 w-5 text-nfuko-primary dark:text-nfuko-yellow" />
            </div>
            <div>
            <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Public Holidays & Leave
            </h1>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Configure organisation-wide holidays and staff leave entitlements
            </p>
            </div>
        </div>

        <div v-if="isSaving" class="flex items-center gap-2 text-xs text-neutral-500 animate-pulse">
            <Loader2 class="h-4 w-4 animate-spin" />
            Saving changes...
        </div>
      </div>
    </div>

    <!-- Scheduling Automation Settings -->
    <div class="space-y-4">
      <div
        class="rounded-2xl border border-nfuko-primary/10 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-start gap-3">
            <div class="mt-1 rounded-lg bg-nfuko-primary/5 p-2 dark:bg-nfuko-yellow/5">
              <ShieldCheck class="h-5 w-5 text-nfuko-primary dark:text-nfuko-yellow" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Repayment Scheduling Logic <span class="text-orange-500">(push also weekends)</span></h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-lg">
                When enabled, any loan repayment installment that falls on a public holiday (or weekend) will be automatically pushed to the next available working day.
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="togglePushHolidays"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
            :class="pushHolidays ? 'bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300"
              :class="pushHolidays ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>

      <div
        class="rounded-2xl border border-nfuko-primary/10 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-start gap-3">
            <div class="mt-1 rounded-lg bg-nfuko-primary/5 p-2 dark:bg-nfuko-yellow/5">
              <ShieldCheck class="h-5 w-5 text-nfuko-primary dark:text-nfuko-yellow" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Repayment Scheduling Logic <span class="text-orange-500">(Only Public Holidays No Weekends)</span></h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-lg">
                When enabled, any loan repayment installment that falls on a public holiday will be automatically pushed to the next available working day. No pushing weekends.
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="togglePushHolidaysWeekdaysOnly"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
            :class="pushHolidaysWeekdaysOnly ? 'bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300"
              :class="pushHolidaysWeekdaysOnly ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>

      <div
        class="rounded-2xl border border-nfuko-primary/10 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-start gap-3">
            <div class="mt-1 rounded-lg bg-nfuko-primary/5 p-2 dark:bg-nfuko-yellow/5">
              <ShieldCheck class="h-5 w-5 text-nfuko-primary dark:text-nfuko-yellow" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Repayment Scheduling Logic <span class="text-orange-500">(Relative Scheduling) Rearranges schedule when public holiday is reached</span></h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-lg">
                This setting, when enabled, implements relative scheduling logic: if Instalment 1 shifts from April 3 to April 7, Instalment 2 becomes May 7, Instalment 3 becomes June 7, and so on. This schedule creep causes drifting due dates that can disrupt member salary cycles.
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="toggleRelativeScheduling"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
            :class="relativeScheduling ? 'bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300"
              :class="relativeScheduling ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Public Holidays List -->
      <div
        class="lg:col-span-2 rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Public Holidays</h3>
          <button
            type="button"
            @click="addHoliday"
            class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 flex items-center gap-1.5 rounded-lg border border-nfuko-primary px-3 py-1.5 text-xs font-medium text-nfuko-primary transition-colors hover: hover:text-white dark:border-nfuko-yellow dark:text-nfuko-yellow dark:hover:bg-[#052659]/90 dark:hover:text-neutral-900"
          >
            <Plus class="h-3.5 w-3.5" />
            Add Holiday
          </button>
        </div>

        <div class="overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-800">
          <table class="w-full text-sm">
            <thead>
              <tr
                class="border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/60"
              >
                <th
                  class="px-4 py-2.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400"
                >
                  Holiday Name
                </th>
                <th
                  class="px-4 py-2.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400"
                >
                  Date
                </th>
                <th
                  class="px-4 py-2.5 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400"
                >
                  Recurring
                </th>
                <th class="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr v-for="h in holidays" :key="h.id" class="group bg-white dark:bg-neutral-900">
                <td class="px-4 py-2">
                  <input
                    v-model="h.name"
                    type="text"
                    placeholder="e.g. Christmas Day"
                    class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                  <span v-if="h.isNew" class="text-[10px] text-nfuko-primary/60 dark:text-nfuko-yellow/60 font-medium px-1">Unsaved New</span>
                </td>
                <td class="px-4 py-2">
                  <div class="flex flex-col gap-1">
                    <input
                      v-model="h.date"
                      type="date"
                      class="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                    <span v-if="h.recurring" class="text-[10px] text-nfuko-primary font-medium dark:text-nfuko-yellow px-1">
                      {{ formatDisplayDate(h) }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-2 text-center">
                  <button
                    type="button"
                    @click="h.recurring = !h.recurring"
                    class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300"
                    :class="
                      h.recurring
                        ? 'bg-nfuko-primary dark:bg-nfuko-yellow'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    "
                  >
                    <span
                      class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-300"
                      :class="h.recurring ? 'translate-x-4' : 'translate-x-0.5'"
                    />
                  </button>
                </td>
                <td class="px-2 py-2 text-center">
                  <button
                    type="button"
                    @click="removeHoliday(h)"
                    class="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="holidays.length === 0 && !isLoading">
                <td
                  colspan="4"
                  class="px-4 py-6 text-center text-sm text-neutral-400 dark:text-neutral-500"
                >
                  No public holidays configured. Click "Add Holiday" to get started.
                </td>
              </tr>
              <tr v-if="isLoading">
                <td colspan="4" class="px-4 py-6 text-center text-sm text-neutral-400">
                  Loading holidays...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Leave Entitlements -->
      <div
        class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h3 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">
          Leave Entitlements
        </h3>
        <p class="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
          Standard days allocated per staff member per year.
        </p>
        <div class="space-y-3">
          <div
            v-for="lt in leaveTypes"
            :key="lt.label"
            class="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/40"
          >
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{
              lt.label
            }}</span>
            <div class="flex items-center gap-2">
              <input
                v-model.number="lt.days"
                type="number"
                min="0"
                class="w-16 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-right text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
              <span class="text-xs text-neutral-400">days</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save -->
    <div class="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800">
      <button
        @click="saveAll"
        :disabled="isSaving"
        class="flex items-center gap-2 rounded-xl bg-[#052659] px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#052659]/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 dark:bg-nfuko-yellow dark:text-[#0050D8] dark:hover:bg-[#052659]/90
      >
        <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" />
        {{ isSaving ? 'Saving...' : 'Save Holiday Settings' }}
      </button>
    </div>
  </div>

  <!-- Delete confirmation -->
  <ConfirmationDialog
    :show="showDeleteDialog"
    title="Delete Holiday"
    :message="`Are you sure you want to delete '${holidayToDelete?.name}'? This action cannot be undone.`"
    confirm-label="Delete"
    @confirm="confirmDelete"
    @cancel="showDeleteDialog = false"
  />
</template>
