<script setup lang="ts">
import { onMounted } from 'vue'
import { Settings2, X, Info } from 'lucide-vue-next'
import { Spinner, Label } from '@/Global'
import { useGeneralLoanSettings } from '../composables/useGeneralLoanSettings'

const {
  showDrawer, loading, saving, form,
  repaymentAllocationOptions,
  fetchSettings,
  openDrawer, closeDrawer, save,
} = useGeneralLoanSettings()

onMounted(() => {
  // Warm once so opening drawer and saving do not trigger back-to-back calls.
  void fetchSettings()
})

defineExpose({ openDrawer })
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="showDrawer" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer" />
      <Transition name="drawer-slide">
        <aside
          v-show="showDrawer"
          class="absolute right-0 top-0 h-full w-full max-w-[500px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog"
          aria-label="Loan Settings"
        >
          <div class="flex h-full flex-col">
            <!-- Header -->
            <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30"
                  >
                    <Settings2 class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                  </div>
                  <div>
                    <h3
                      class="text-lg font-bold tracking-tight text-neutral-900 uppercase dark:text-white"
                    >
                      Loan Settings
                    </h3>
                    <p class="text-xs text-neutral-500">
                      Manage disbursement and operational rules
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="closeDrawer"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              <div v-if="loading" class="flex items-center justify-center py-10">
                <Spinner class="h-8 w-8 text-neutral-400" />
              </div>
              <div v-else class="space-y-6">
                <!-- Charge Deduction Mode -->
                <div class="space-y-3">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                    >Default Charge Deduction Mode</Label
                  >
                  <p class="text-xs text-neutral-500 pb-1">
                    Select how upfront charges should be collected when disbursing a loan.
                  </p>

                  <select
                    v-model="form.charge_deduction_mode"
                    class="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-bg-nfuko-yellow"
                  >
                    <option value="deduct_from_principal">
                      Deduct from Principal (Net Disbursement)
                    </option>
                    <option value="capitalize">Capitalize (Add to Principal)</option>
                    <option value="debit_savings">Debit from Savings Account</option>
                    <option value="pay_cash">Pay Cash Over Counter</option>
                  </select>

                  <div
                    class="flex gap-2 rounded-xl bg-blue-50/50 p-3 mt-2 border border-blue-100 dark:border-blue-900/30 dark:bg-blue-900/10"
                  >
                    <Info class="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p class="text-xs text-blue-600 dark:text-blue-400 leading-snug">
                      <strong class="font-semibold block mb-1">How fallback works:</strong>
                      If "Debit from Savings" is selected but the member lacks sufficient funds
                      during disbursement, the system will automatically fall back to "Deduct from
                      Principal" and issue a warning.
                    </p>
                  </div>
                </div>

                <!-- Repayment Allocation Order -->
                <div class="space-y-3">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Repayment Allocation Order
                  </Label>
                  <p class="text-xs text-neutral-500 pb-1">
                    Select how payment is split across principal, interest, penalties, and charges.
                    This applies to new repayment postings and previews.
                  </p>

                  <div class="grid gap-2">
                    <button
                      v-for="opt in repaymentAllocationOptions"
                      :key="opt.value"
                      type="button"
                      @click="form.repayment_allocation_order = opt.value"
                      class="w-full rounded-xl border p-3 text-left transition-all"
                      :class="
                        form.repayment_allocation_order === opt.value
                          ? 'border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-200 dark:border-emerald-700 dark:bg-emerald-900/20 dark:ring-emerald-800'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600'
                      "
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          {{ opt.title }}
                        </span>
                        <span
                          v-if="form.repayment_allocation_order === opt.value"
                          class="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white"
                        >
                          Active
                        </span>
                      </div>
                      <p class="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">
                        {{ opt.sequence }}
                      </p>
                      <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {{ opt.help }}
                      </p>
                    </button>
                  </div>
                </div>

                <!-- Approval Workflow limits -->
                <div class="space-y-3">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                    >Approval Workflow</Label
                  >
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-neutral-500 mb-1"
                        >Minimum Approvers</label
                      >
                      <input
                        type="number"
                        min="1"
                        v-model.number="form.min_approvers"
                        class="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-neutral-500 mb-1"
                        >Maximum Approvers</label
                      >
                      <input
                        type="number"
                        min="1"
                        v-model.number="form.max_approvers"
                        class="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800"
                      />
                    </div>
                  </div>
                </div>

                <!-- Feature Toggles -->
                <div class="space-y-4">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                    >Features & Overrides</Label
                  >

                  <label class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      v-model="form.auto_penalty"
                      class="h-4 w-4 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-bg-nfuko-yellow"
                    />
                    <span class="text-sm text-neutral-700 dark:text-neutral-300"
                      >Apply Auto Penalties</span
                    >
                  </label>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700"
            >
              <button
                type="button"
                @click="closeDrawer"
                class="rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="save"
                :disabled="saving"
                class="inline-flex items-center gap-2 rounded-lg bg-[#052659] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#052659]/90 transition-colors disabled:opacity-60 shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary"
              >
                <Spinner v-if="saving" class="h-4 w-4" />
                Save Settings
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
