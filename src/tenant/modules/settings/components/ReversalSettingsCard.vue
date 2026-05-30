<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RotateCcw, Save } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import ToggleSwitch from '@/Global/ToggleSwitch.vue'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { toast } from 'vue-sonner'

const STAFF_ROLES = [
  { id: 'admin', label: 'Admin' },
  { id: 'manager', label: 'Manager' },
  { id: 'accountant', label: 'Accountant' },
  { id: 'teller', label: 'Teller' },
  { id: 'supervisor', label: 'Supervisor' },
]

const loading = ref(false)
const saving = ref(false)

const form = ref({
  reversal_requires_approval: false,
  reversal_approver_roles: [] as string[],
  reversal_max_days: 0,
})

async function load() {
  loading.value = true
  try {
    const res = await tenantClient.get('/onboarding-settings')
    const data = res.data?.data ?? res.data
    if (data) {
      form.value.reversal_requires_approval = !!data.reversal_requires_approval
      form.value.reversal_approver_roles = Array.isArray(data.reversal_approver_roles)
        ? data.reversal_approver_roles
        : []
      form.value.reversal_max_days = data.reversal_max_days ?? 0
    }
  } catch {
    toast.error('Failed to load reversal settings.')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await tenantClient.put('/onboarding-settings', form.value)
    toast.success('Reversal settings saved.')
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to save reversal settings.')
  } finally {
    saving.value = false
  }
}

function toggleRole(roleId: string) {
  const idx = form.value.reversal_approver_roles.indexOf(roleId)
  if (idx >= 0) {
    form.value.reversal_approver_roles.splice(idx, 1)
  } else {
    form.value.reversal_approver_roles.push(roleId)
  }
}

onMounted(load)
</script>

<template>
  <div class="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
          <RotateCcw class="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Reversal Settings</h3>
          <p class="text-xs text-neutral-500 mt-0.5">Control who can approve reversals and when they are allowed.</p>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="px-6 py-6 space-y-5">
      <div v-for="i in 3" :key="i" class="h-10 rounded-xl bg-neutral-100 animate-pulse dark:bg-neutral-800" />
    </div>

    <div v-else class="px-6 py-6 space-y-6">
      <!-- Require approval toggle -->
      <div class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-700 dark:bg-neutral-800/60">
        <div>
          <p class="text-sm font-semibold text-neutral-900 dark:text-white">Require approval before reversal is applied</p>
          <p class="text-xs text-neutral-500 mt-0.5">When enabled, reversals are queued for an authorised approver. When off, any staff with access can reverse immediately.</p>
        </div>
        <ToggleSwitch
          :value="form.reversal_requires_approval"
          @toggle="form.reversal_requires_approval = !form.reversal_requires_approval"
        />
      </div>

      <!-- Approver roles (only shown when approval required) -->
      <Transition
        enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition-all duration-150"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="form.reversal_requires_approval" class="space-y-3">
          <div>
            <p class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Roles authorised to approve reversals</p>
            <p class="text-xs text-neutral-500 mt-0.5">Staff with these roles can approve or reject reversal requests.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="role in STAFF_ROLES"
              :key="role.id"
              type="button"
              @click="toggleRole(role.id)"
              class="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              :class="form.reversal_approver_roles.includes(role.id)
                ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'"
            >
              <span
                class="h-2 w-2 rounded-full"
                :class="form.reversal_approver_roles.includes(role.id) ? 'bg-amber-500' : 'bg-neutral-300'"
              />
              {{ role.label }}
            </button>
          </div>
          <p v-if="form.reversal_approver_roles.length === 0" class="text-xs text-amber-600 dark:text-amber-400">
            ⚠ No roles selected — no one will be able to approve pending reversals.
          </p>
        </div>
      </Transition>

      <!-- Max days -->
      <div class="space-y-2">
        <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Maximum days after transaction to allow reversal
        </label>
        <div class="flex items-center gap-3">
          <input
            v-model.number="form.reversal_max_days"
            type="number"
            min="0"
            class="w-32 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
          <span class="text-sm text-neutral-500">days</span>
        </div>
        <p class="text-xs text-neutral-400">
          Set to <strong>0</strong> for no time limit. Otherwise staff cannot request a reversal after this many days from the transaction date.
        </p>
      </div>

      <!-- Save button -->
      <div class="flex justify-end pt-2">
        <button
          type="button"
          @click="save"
          :disabled="saving"
          class="inline-flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#052659]/90 transition-colors disabled:opacity-60 shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary"
        >
          <Spinner v-if="saving" class="h-4 w-4" />
          <Save v-else class="h-4 w-4" />
          {{ saving ? 'Saving…' : 'Save Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>
