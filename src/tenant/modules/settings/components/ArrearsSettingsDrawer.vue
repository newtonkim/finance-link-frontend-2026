<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'
import { Spinner, Label } from '@/Global'
import { useArrearsTiers } from '../composables/useArrearsTiers'

const { loading, saving, isDrawerOpen: showDrawer, tiers, openDrawer, closeDrawer, save } = useArrearsTiers()

defineExpose({ openDrawer })
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="showDrawer" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer" />
      <Transition name="drawer-slide">
        <aside
          v-show="showDrawer"
          class="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog"
          aria-label="Arrears Penalty Settings"
        >
          <div class="flex h-full flex-col">
            <!-- Header -->
            <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30"
                  >
                    <AlertTriangle class="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3
                      class="text-lg font-bold tracking-tight text-neutral-900 uppercase dark:text-white"
                    >
                      Arrears Penalty Settings
                    </h3>
                    <p class="text-xs text-neutral-500">
                      Configure global arrears flagging and automated penalty rules
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
                <div>
                  <Label class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Penalty Tiers
                  </Label>
                  <p class="text-xs text-neutral-500 mt-0.5">
                    Configure arrears charges based on how many days an installment is overdue.
                  </p>
                </div>

                <div v-for="(tier, index) in tiers" :key="index" class="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold text-neutral-900 dark:text-white">
                      {{ tier.to_day ? `${tier.from_day} - ${tier.to_day} days` : `${tier.from_day}+ days` }}
                    </h4>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <span class="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">Active</span>
                      <input
                        v-model="tier.is_active"
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600 dark:bg-gray-700"
                      />
                    </label>
                  </div>

                  <div v-if="tier.is_active" class="space-y-4 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 mt-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-[11px] font-medium text-neutral-500 mb-1">
                          Charge Type
                        </label>
                        <select
                          v-model="tier.charge_type"
                          class="block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary/20 dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <option value="flat">Flat Amount</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>

                      <div>
                        <label class="block text-[11px] font-medium text-neutral-500 mb-1">
                          Value
                        </label>
                        <input
                          v-model.number="tier.charge_value"
                          type="number"
                          min="0"
                          step="0.01"
                          class="block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary/20 dark:border-neutral-700 dark:bg-neutral-800"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label class="block text-[11px] font-medium text-neutral-500 mb-1">
                        Applies To
                      </label>
                      <select
                        v-model="tier.applies_to"
                        class="block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary/20 dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        <option value="outstanding_balance">Outstanding Loan Balance</option>
                        <option value="principal_due">Principal Due</option>
                        <option value="installment_due">Total Installment Due</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-700"
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
                :disabled="saving"
                @click="save"
                class="inline-flex items-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors disabled:opacity-60 shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary"
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
