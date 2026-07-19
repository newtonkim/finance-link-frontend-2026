<script setup lang="ts">
import { onMounted } from 'vue'
import { HandCoins, Info, X } from 'lucide-vue-next'
import { Label, Spinner } from '@/Global'
import { useGeneralLoanSettings } from '../composables/useGeneralLoanSettings'

const emit = defineEmits(['close'])

const {
  showDrawer,
  loading,
  saving,
  form,
  repaymentAllocationOptions,
  fetchSettings,
  openDrawer,
  closeDrawer,
  save,
} = useGeneralLoanSettings()

onMounted(() => {
  void fetchSettings()
})

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
           

            <div class="flex-1 overflow-y-auto px-6  space-y-8">
              <div v-if="loading" class="flex items-center justify-center py-10">
                <Spinner class="h-8 w-8 text-neutral-400" />
              </div>

              <div v-else class="space-y-6">
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
                    <option value="deduct_from_principal">Deduct from Principal (Net Disbursement)</option>
                    <option value="capitalize">Capitalize (Add to Principal)</option>
                    <option value="debit_savings">Debit from Savings Account</option>
                    <option value="pay_cash">Pay Cash Over Counter</option>
                  </select>

                  <div class="flex gap-2 rounded-xl bg-blue-50/50 p-3 mt-2 border border-blue-100 dark:border-blue-900/30 dark:bg-blue-900/10">
                    <Info class="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p class="text-xs text-blue-600 dark:text-blue-400 leading-snug">
                      <strong class="font-semibold block mb-1">How fallback works:</strong>
                      If "Debit from Savings" is selected but the member lacks sufficient funds during
                      disbursement, the system will automatically fall back to "Deduct from Principal" and
                      issue a warning.
                    </p>
                  </div>
                </div>

                <div class="space-y-3">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Repayment Allocation Order
                  </Label>
                  <p class="text-xs text-neutral-500 pb-1">
                    Select how payment is split across principal, interest, penalties, and charges.
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
              </div>
            </div>

          
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
                  class="flex-1 h-11 mr-5 w-full font-bold bg-[#06265a] hover:bg-[#06265a]/90 text-white shadow-sm transition-colors"
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
