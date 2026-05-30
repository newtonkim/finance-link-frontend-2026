<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus, Pencil, Trash2, Receipt, X } from 'lucide-vue-next'
import { Spinner, Label } from '@/Global'
import { formatMoneyValue } from '@/Global'
import ToggleSwitch from '@/Global/ToggleSwitch.vue'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import MultiSearchableSelect from '@/Global/MultiSearchableSelect.vue'
import { useGeneralCharges } from '../composables/useGeneralCharges'
import {
  APPLICATION_OPTIONS, CHARGE_TYPE_OPTIONS, WHERE_TO_APPLY_OPTIONS,
  INTERVAL_TYPE_OPTIONS, IS_FINE_OPTIONS, IS_REVENUE_OPTIONS, FIELD_CLS,
} from '../constants'

const {
  charges, loading, toggling, reversibleToggling, deleting,
  fetch, toggleActive, toggleReversible, remove, applicationLabel,
  savingProductOptions, loanProductOptions, creditAccountOptions, fetchOptions,
  showDrawer, editingCharge, form, processing, errors,
  openAddDrawer, openEditDrawer, closeDrawer, submit,
} = useGeneralCharges()

onMounted(() => {
  fetchOptions()
  fetch()
})
</script>

<template>
  <!-- ─── Card shell ──────────────────────────────────────────────────────── -->
  <div class="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
      <div>
        <h3 class="text-base font-semibold text-neutral-900 dark:text-white">General Charges</h3>
        <p class="text-xs text-neutral-500 mt-0.5">Charges applied on registration, shares, loan applications and more.</p>
      </div>
      <button
        @click="openAddDrawer"
        class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
        style="background-color: var(--color-nfuko-primary);"
      >
        <Plus class="h-4 w-4" />
        Add New Charge
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="divide-y divide-neutral-100 dark:divide-neutral-800">
      <div v-for="i in 3" :key="i" class="flex items-center gap-4 px-6 py-4 animate-pulse">
        <div class="h-4 w-40 rounded bg-neutral-100 dark:bg-neutral-800" />
        <div class="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800" />
        <div class="ml-auto h-6 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="charges.length === 0" class="flex flex-col items-center gap-2 py-12 text-center">
      <Receipt class="h-8 w-8 text-neutral-300" />
      <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No charges configured</p>
      <p class="text-xs text-neutral-400">Click "Add New Charge" to create your first charge.</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-neutral-50/60 dark:bg-neutral-800/40">
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Charge Name</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Applies On</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Applies To</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Amount</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Reversible</th>
            <th class="px-6 py-3 text-center text-xs font-semibold text-neutral-500">Active</th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-500">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
          <tr
            v-for="charge in charges"
            :key="charge.id"
            class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
            :class="{ 'opacity-50': !charge.is_active }"
          >
            <td class="px-6 py-4">
              <span class="font-semibold text-neutral-900 dark:text-white">{{ charge.name }}</span>
            </td>

            <td class="px-6 py-4">
              <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="{
                  'bg-blue-50 text-blue-700': charge.application === 'on_registration',
                  'bg-purple-50 text-purple-700': charge.application === 'on_shares',
                  'bg-amber-50 text-amber-700': charge.application === 'on_loan_application',
                  'bg-neutral-100 text-neutral-600': charge.application === 'other',
                }"
              >
                {{ applicationLabel(charge.application) }}
              </span>
            </td>

            <td class="px-6 py-4">
              <span v-if="charge.where_to_apply" class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                :class="{
                  'bg-sky-50 text-sky-700': charge.where_to_apply === 'loans',
                  'bg-emerald-50 text-emerald-700': charge.where_to_apply === 'savings',
                  'bg-violet-50 text-violet-700': charge.where_to_apply === 'shares',
                }"
              >
                {{ charge.where_to_apply === 'savings' ? 'Savings Products' : charge.where_to_apply }}
              </span>
              <span v-else class="text-neutral-400">—</span>
            </td>

            <td class="px-6 py-4">
              <div class="flex flex-col gap-1">
                <span class="font-mono font-semibold text-neutral-900 dark:text-white">
                  {{ charge.charge_type === 'percentage' ? charge.amount + '%' : formatMoneyValue(Number(charge.amount), 0) }}
                </span>
                <span class="inline-flex w-fit rounded px-1.5 py-0.5 text-xs font-medium capitalize"
                  :class="charge.charge_type === 'percentage' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-600'"
                >
                  {{ charge.charge_type ?? 'flat amount' }}
                </span>
              </div>
            </td>

            <td class="px-6 py-4">
              <ToggleSwitch
                :value="charge.is_reversible"
                :loading="reversibleToggling === charge.id"
                @toggle="toggleReversible(charge)"
              />
            </td>

            <td class="px-6 py-4 text-center">
              <ToggleSwitch
                :value="charge.is_active"
                :loading="toggling === charge.id"
                @toggle="toggleActive(charge)"
              />
            </td>

            <td class="px-6 py-4 text-right">
              <div class="inline-flex items-center gap-2">
                <button
                  @click="openEditDrawer(charge)"
                  class="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors"
                  title="Edit charge"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </button>
                <button
                  @click="remove(charge)"
                  :disabled="deleting === charge.id"
                  class="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 transition-colors disabled:opacity-50"
                  title="Delete charge"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ─── Add / Edit Drawer ───────────────────────────────────────────────── -->
  <Transition name="drawer-fade">
    <div v-if="showDrawer" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer" />
      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[620px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog"
          aria-label="General Charges"
        >
          <div class="flex h-full flex-col">
            <!-- Header -->
            <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                    <Receipt class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                  </div>
                  <h3 class="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                    {{ editingCharge ? 'Edit Charge' : 'Add New Charge' }}
                  </h3>
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
            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <!-- Is it a revenue -->
              <div class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Is it a revenue</Label>
                <SearchableSelect v-model="form.is_revenue" :options="IS_REVENUE_OPTIONS" placeholder="Please Select option" state="revenue-select" />
              </div>

              <!-- Charge name -->
              <div class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Charge name <span class="text-red-500">*</span></Label>
                <input v-model="form.name" type="text" placeholder="Charge name" :class="FIELD_CLS" />
                <p v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</p>
              </div>

              <!-- Application -->
              <div class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Application <span class="text-red-500">*</span></Label>
                <SearchableSelect v-model="form.application" :options="APPLICATION_OPTIONS" placeholder="Please Select option" state="application-select" />
              </div>

              <!-- Applies To (always visible) -->
              <div class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Applies To</Label>
                <SearchableSelect v-model="form.where_to_apply" :options="WHERE_TO_APPLY_OPTIONS" placeholder="Select where to apply" state="where-to-apply-select-main" />
              </div>

              <!-- Saving products (on_registration) -->
              <div v-if="form.application === 'on_registration'" class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Saving products <span class="text-red-500">*</span></Label>
                <MultiSearchableSelect v-model="form.saving_product_ids" :options="savingProductOptions" placeholder="Choose saving products ..." state="saving-product-select" />
              </div>

              <!-- Loan products (on_loan_application) -->
              <div v-if="form.application === 'on_loan_application'" class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Loan types <span class="text-red-500">*</span></Label>
                <MultiSearchableSelect v-model="form.loan_product_ids" :options="loanProductOptions" placeholder="Choose loan products ..." state="loan-product-select" />
              </div>

              <!-- Charge type (on_loan_application) -->
              <div v-if="form.application === 'on_loan_application'" class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Percentage/Amount <span class="text-red-500">*</span></Label>
                <SearchableSelect v-model="form.charge_type" :options="CHARGE_TYPE_OPTIONS" placeholder="Select charge type" state="charge-type-select" />
              </div>

              <!-- Other application sub-fields -->
              <template v-if="form.application === 'other'">
                <template v-if="form.where_to_apply === 'loans'">
                  <div class="space-y-2">
                    <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Loan types <span class="text-red-500">*</span></Label>
                    <MultiSearchableSelect v-model="form.loan_product_ids" :options="loanProductOptions" placeholder="Choose loan products ..." state="other-loan-product-select" />
                  </div>
                  <div class="space-y-2">
                    <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Is it a fine to be applied on loan mishandling? <span class="text-red-500">*</span></Label>
                    <SearchableSelect v-model="form.is_fine" :options="IS_FINE_OPTIONS" placeholder="Select yes or no" state="is-fine-select" />
                  </div>
                  <div class="space-y-2">
                    <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interval type <span class="text-red-500">*</span></Label>
                    <SearchableSelect v-model="form.interval_type" :options="INTERVAL_TYPE_OPTIONS" placeholder="Select the interval type" state="interval-type-select" />
                  </div>
                  <div class="space-y-2">
                    <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interval <span class="text-red-500">*</span></Label>
                    <input v-model="form.interval" type="number" min="1" :class="FIELD_CLS" />
                  </div>
                  <div class="space-y-2">
                    <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Percentage/Amount <span class="text-red-500">*</span></Label>
                    <SearchableSelect v-model="form.charge_type" :options="CHARGE_TYPE_OPTIONS" placeholder="Select amount/percentage" state="other-charge-type-select" />
                  </div>
                </template>

                <template v-if="form.where_to_apply === 'savings'">
                  <div class="space-y-2">
                    <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Saving products <span class="text-red-500">*</span></Label>
                    <MultiSearchableSelect v-model="form.saving_product_ids" :options="savingProductOptions" placeholder="Choose saving products ..." state="other-saving-product-select" />
                  </div>
                  <div class="space-y-2">
                    <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interval type <span class="text-red-500">*</span></Label>
                    <SearchableSelect v-model="form.interval_type" :options="INTERVAL_TYPE_OPTIONS" placeholder="Select the interval type" state="interval-type-select-savings" />
                  </div>
                  <div class="space-y-2">
                    <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interval <span class="text-red-500">*</span></Label>
                    <input v-model="form.interval" type="number" min="1" :class="FIELD_CLS" />
                  </div>
                </template>
              </template>

              <!-- Amount -->
              <div v-if="['on_shares', 'on_loan_application', 'on_registration', 'other'].includes(form.application)" class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Amount <span class="text-red-500">*</span></Label>
                <input v-model="form.amount" type="number" :class="FIELD_CLS" />
              </div>

              <!-- Credit account (optional) -->
              <div v-if="['on_registration', 'on_loan_application'].includes(form.application)" class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Credit account (optional)</Label>
                <SearchableSelect v-model="form.credit_account_id" :options="creditAccountOptions" placeholder="Select option" state="credit-account-select" />
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <button type="button" @click="closeDrawer" class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors">
                Close
              </button>
              <button
                type="button"
                @click="submit"
                :disabled="processing"
                class="inline-flex items-center gap-2 rounded-lg bg-[#052659] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#052659]/90 transition-colors disabled:opacity-60 shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary"
              >
                <Spinner v-if="processing" class="h-4 w-4" />
                {{ processing ? 'Saving...' : editingCharge ? 'Save Changes' : 'Add New Charge' }}
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
