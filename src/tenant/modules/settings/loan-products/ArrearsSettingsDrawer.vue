<script setup lang="ts">
import { onMounted } from 'vue'
import { AlertTriangle, X } from 'lucide-vue-next'
import { Spinner, Label } from '@/Global'
import { useArrearsTiers } from '../composables/useArrearsTiers'

const emit = defineEmits(['close'])

const { loading, saving, isDrawerOpen: showDrawer, tiers, openDrawer, closeDrawer, save, loadTiers } = useArrearsTiers()

onMounted(() => {
  void loadTiers()
})

// Override close and save to emit the close event
const handleClose = () => {
  closeDrawer()
  emit('close')
}

const handleSave = async () => {
  await save()
  emit('close')
}

defineExpose({ openDrawer })
</script>

<template>
 <div class="flex h-[90vh] flex-col">

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 space-y-8">
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
          
            <div  class="flex w-full gap-2   items-center justify-between">
              <div class="w-1/3 ">
                <Button
                  variant="outline"
                  class="flex-1 h-11 w-full mx-2 font-bold border-neutral-200 dark:border-neutral-800"
                  @click="handleClose"
                >
                  Close
                </Button>
              </div>

              <div class="w-1/3 ">
                <!-- @click="handleSave" -->
                <Button
                  type="submit"
                    :disabled="saving"
                @click="handleSave"
                  class="flex-1 h-11  mr-5 w-full font-bold bg-emerald-600 hover:bg-[#052659]/90 text-white shadow-sm transition-colors"
                >
                <Spinner v-if="saving" class="h-4 w-4" />

                  Save
                </Button>
              </div>
            </div> 
          </div>
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
