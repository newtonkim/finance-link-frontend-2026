<script setup lang="ts">
import { onMounted } from 'vue'
import { Settings2, X, Zap } from 'lucide-vue-next'
import { Spinner, Label, SearchableSelect } from '@/Global'
import { useGeneralLoanSettings } from '../composables/useGeneralLoanSettings'

const emit = defineEmits(['close'])

const { showDrawer, loading, saving, form, chartAccountOptions, fetchSettings, openDrawer, closeDrawer, save } =
  useGeneralLoanSettings()

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
           

            <div class="flex-1 overflow-y-auto px-6">
              <div v-if="loading" class="flex items-center justify-center py-10">
                <Spinner class="h-8 w-8 text-neutral-400" />
              </div>

              <div v-else class="space-y-8 py-4">
                <!-- Section: Loan Topups Settings -->
                <div class="flex items-center gap-2 pb-1 border-b border-neutral-200 dark:border-neutral-700">
                  <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-100">Loan Topups Settings</h2>
                </div>

                <!-- Eligibility Rules -->
                <div class="space-y-4">
                  <div class="flex items-center gap-2">
                    <Settings2 class="h-4 w-4 text-nfuko-primary" />
                    <Label class="text-sm font-bold text-neutral-800 dark:text-neutral-200">Eligibility Threshold</Label>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-6">
                    <div class="space-y-2">
                      <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Repayment Basis</Label>
                      <SearchableSelect
                        v-model="form.topup_repayment_basis"
                        :options="[
                          { id: 'principal', name: 'On Principal' },
                          { id: 'principal_interest', name: 'On Principal + Interest' },
                          { id: 'outstanding_balance', name: 'On Outstanding Balance' }
                        ]"
                        placeholder="Select basis..."
                      />
                      <p class="text-[11px] text-neutral-400">Determines how the paid percentage is calculated for eligibility.</p>
                    </div>

                    <div class="space-y-2">
                      <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Minimum Percentage Paid (%)</Label>
                      <input
                        v-model.number="form.topup_min_percentage"
                        type="number"
                        min="0"
                        max="100"
                        class="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800"
                      />
                      <p class="text-[11px] text-neutral-400">The minimum percentage of the basis that must be paid to allow a top-up.</p>
                    </div>
                  </div>
                </div>

                <hr class="border-neutral-100 dark:border-neutral-800" />

                <!-- Workflow Automation -->
                <div class="space-y-4">
                  <div class="flex items-center gap-2">
                    <Zap class="h-4 w-4 text-nfuko-primary" />
                    <Label class="text-sm font-bold text-neutral-800 dark:text-neutral-200">Workflow Automation</Label>
                  </div>

                  <div class="space-y-2">
                    <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Automatically disburse new loan?</Label>
                    <SearchableSelect
                      v-model="(form.topup_auto_disbursement as any)"
                      :options="[
                        { id: 1, name: 'Yes - Straight Disbursement (No Application)' },
                        { id: 0, name: 'No - Full Application Process required' }
                      ]"
                      placeholder="Select workflow..."
                    />
                    <p class="text-[11px] text-neutral-400">If Yes, the top-up loan will be disbursed immediately without approval stages.</p>
                  </div>
                </div>

                <hr class="border-neutral-100 dark:border-neutral-800" />

                <!-- Feature Toggle -->
                <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                  <label class="flex items-center justify-between cursor-pointer">
                    <div class="space-y-0.5">
                      <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Allow Loan Top-Ups</span>
                      <p class="text-xs text-neutral-500">Enable or disable the top-up feature globally for this product.</p>
                    </div>
                    <input
                      v-model="form.allow_top_up"
                      type="checkbox"
                      class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600 dark:bg-gray-700"
                    />
                  </label>
                </div>

                <hr class="border-neutral-100 dark:border-neutral-800" />

                <!-- Section: Loan Rescheduling Settings -->
                <div class="flex items-center gap-2 pb-1 border-b border-neutral-200 dark:border-neutral-700">
                  <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-100">Loan Rescheduling Settings</h2>
                </div>

                <!-- Allow Reschedule + Max Count -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div class="space-y-0.5">
                        <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Allow Rescheduling</span>
                        <p class="text-xs text-neutral-500">Enable globally for this branch.</p>
                      </div>
                      <input v-model="form.allow_reschedule" type="checkbox"
                        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600 dark:bg-gray-700" />
                    </label>
                  </div>
                  <div class="space-y-2">
                    <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Max Reschedule Count</Label>
                    <input v-model.number="form.max_reschedule_count" type="number" min="1"
                      class="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800" />
                    <p class="text-[11px] text-neutral-400">Maximum times a loan can be rescheduled.</p>
                  </div>
                </div>

                <!-- Reschedule Fee Income GL Account -->
                <div class="space-y-2">
                  <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Reschedule Fee Income Account
                    <span class="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">GL</span>
                  </Label>
                  <SearchableSelect
                    v-model="(form.reschedule_fee_income_account_id as any)"
                    :options="chartAccountOptions"
                    placeholder="Select income account…"
                  />
                  <p class="text-[11px] text-neutral-400">All four reschedule charges post income to this account.</p>
                </div>

                <!-- Charges Table -->
                <div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <!-- Table header -->
                  <div class="grid bg-neutral-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:bg-neutral-800"
                       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
                    <div>Charge</div>
                    <div>Type</div>
                    <div>Amount / Rate</div>
                    <div>Basis (if %)</div>
                    <div>Collection</div>
                    <div class="text-center">On</div>
                  </div>

                  <!-- Row: Reschedule Fee -->
                  <div class="grid items-center border-t border-neutral-100 px-3 py-2.5 transition-opacity dark:border-neutral-800"
                       :class="{ 'opacity-45': !form.reschedule_fee_enabled }"
                       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
                    <div>
                      <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Reschedule Fee</div>
                      <div class="text-[10px] text-neutral-400">Every reschedule</div>
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="form.reschedule_fee_type" :options="[{id:'flat',name:'Flat'},{id:'percentage',name:'%'}]"
                        :disabled="!form.reschedule_fee_enabled" />
                    </div>
                    <div class="pr-2">
                      <input v-model.number="form.reschedule_fee_amount" type="number" min="0" :disabled="!form.reschedule_fee_enabled"
                        class="block w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-nfuko-primary disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="(form.reschedule_fee_basis as any)"
                        :options="[{id:'outstanding_balance',name:'Outstanding Balance'},{id:'new_principal',name:'New Principal'},{id:'original_disbursed',name:'Original Disbursed'}]"
                        :disabled="!form.reschedule_fee_enabled || form.reschedule_fee_type !== 'percentage'"
                        placeholder="—" />
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="form.reschedule_fee_collection"
                        :options="[{id:'savings',name:'Savings'},{id:'capitalize',name:'Capitalize'},{id:'cash',name:'Cash'}]"
                        :disabled="!form.reschedule_fee_enabled" />
                    </div>
                    <div class="flex justify-center">
                      <input v-model="form.reschedule_fee_enabled" type="checkbox"
                        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600" />
                    </div>
                  </div>

                  <!-- Row: Product Change Fee -->
                  <div class="grid items-center border-t border-neutral-100 px-3 py-2.5 transition-opacity dark:border-neutral-800"
                       :class="{ 'opacity-45': !form.reschedule_product_change_fee_enabled }"
                       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
                    <div>
                      <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Product Change Fee</div>
                      <div class="text-[10px] text-neutral-400">Different product selected</div>
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="form.reschedule_product_change_fee_type" :options="[{id:'flat',name:'Flat'},{id:'percentage',name:'%'}]"
                        :disabled="!form.reschedule_product_change_fee_enabled" />
                    </div>
                    <div class="pr-2">
                      <input v-model.number="form.reschedule_product_change_fee_amount" type="number" min="0"
                        :disabled="!form.reschedule_product_change_fee_enabled"
                        class="block w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-nfuko-primary disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="(form.reschedule_product_change_fee_basis as any)"
                        :options="[{id:'outstanding_balance',name:'Outstanding Balance'},{id:'new_principal',name:'New Principal'},{id:'original_disbursed',name:'Original Disbursed'}]"
                        :disabled="!form.reschedule_product_change_fee_enabled || form.reschedule_product_change_fee_type !== 'percentage'"
                        placeholder="—" />
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="form.reschedule_product_change_fee_collection"
                        :options="[{id:'savings',name:'Savings'},{id:'capitalize',name:'Capitalize'},{id:'cash',name:'Cash'}]"
                        :disabled="!form.reschedule_product_change_fee_enabled" />
                    </div>
                    <div class="flex justify-center">
                      <input v-model="form.reschedule_product_change_fee_enabled" type="checkbox"
                        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600" />
                    </div>
                  </div>

                  <!-- Row: Same Product Fee -->
                  <div class="grid items-center border-t border-neutral-100 px-3 py-2.5 transition-opacity dark:border-neutral-800"
                       :class="{ 'opacity-45': !form.reschedule_same_product_fee_enabled }"
                       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
                    <div>
                      <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Same Product Fee</div>
                      <div class="text-[10px] text-neutral-400">Same product kept</div>
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="form.reschedule_same_product_fee_type" :options="[{id:'flat',name:'Flat'},{id:'percentage',name:'%'}]"
                        :disabled="!form.reschedule_same_product_fee_enabled" />
                    </div>
                    <div class="pr-2">
                      <input v-model.number="form.reschedule_same_product_fee_amount" type="number" min="0"
                        :disabled="!form.reschedule_same_product_fee_enabled"
                        class="block w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-nfuko-primary disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="(form.reschedule_same_product_fee_basis as any)"
                        :options="[{id:'outstanding_balance',name:'Outstanding Balance'},{id:'new_principal',name:'New Principal'},{id:'original_disbursed',name:'Original Disbursed'}]"
                        :disabled="!form.reschedule_same_product_fee_enabled || form.reschedule_same_product_fee_type !== 'percentage'"
                        placeholder="—" />
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="form.reschedule_same_product_fee_collection"
                        :options="[{id:'savings',name:'Savings'},{id:'capitalize',name:'Capitalize'},{id:'cash',name:'Cash'}]"
                        :disabled="!form.reschedule_same_product_fee_enabled" />
                    </div>
                    <div class="flex justify-center">
                      <input v-model="form.reschedule_same_product_fee_enabled" type="checkbox"
                        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600" />
                    </div>
                  </div>

                  <!-- Row: Other Charges (admin-armed, amber tint) -->
                  <div class="grid items-center border-t border-amber-200 bg-amber-50 px-3 py-2.5 transition-opacity dark:border-amber-800 dark:bg-amber-950/30"
                       :class="{ 'opacity-45': !form.reschedule_other_charges_enabled }"
                       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
                    <div>
                      <div class="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        Other Charges
                        <span class="rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white">Admin</span>
                      </div>
                      <div class="text-[10px] text-amber-700 dark:text-amber-400">Applied manually per reschedule</div>
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="form.reschedule_other_charges_type" :options="[{id:'flat',name:'Flat'},{id:'percentage',name:'%'}]"
                        :disabled="!form.reschedule_other_charges_enabled" />
                    </div>
                    <div class="pr-2">
                      <input v-model.number="form.reschedule_other_charges_amount" type="number" min="0"
                        :disabled="!form.reschedule_other_charges_enabled"
                        class="block w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-nfuko-primary disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="(form.reschedule_other_charges_basis as any)"
                        :options="[{id:'outstanding_balance',name:'Outstanding Balance'},{id:'new_principal',name:'New Principal'},{id:'original_disbursed',name:'Original Disbursed'}]"
                        :disabled="!form.reschedule_other_charges_enabled || form.reschedule_other_charges_type !== 'percentage'"
                        placeholder="—" />
                    </div>
                    <div class="pr-2">
                      <SearchableSelect v-model="form.reschedule_other_charges_collection"
                        :options="[{id:'savings',name:'Savings'},{id:'capitalize',name:'Capitalize'},{id:'cash',name:'Cash'}]"
                        :disabled="!form.reschedule_other_charges_enabled" />
                    </div>
                    <div class="flex justify-center">
                      <input v-model="form.reschedule_other_charges_enabled" type="checkbox"
                        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600" />
                    </div>
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
                  class="flex-1 h-11  mr-5 w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
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
