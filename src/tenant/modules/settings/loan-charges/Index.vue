<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus, Pencil, Trash2, Receipt, X, DollarSign, Search } from 'lucide-vue-next'
import { Spinner, Label, formatMoneyValue } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import ToggleSwitch from '@/Global/ToggleSwitch.vue'
import { useLoanCharges } from '../composables/useLoanCharges'

const router = useRouter()

const {
  charges,
  categoryOptions,
  loading,
  toggling,
  deleting,
  search,
  filterCategory,
  filteredCharges,
  fetch,
  toggleActive,
  remove,
  accounts,
  incomeAccounts,
  fetchAccounts,
  showDrawer,
  editingCharge,
  form,
  processing,
  errors,
  openAddDrawer,
  openEditDrawer,
  closeDrawer,
  submit,
  categoryLabel,
  frequencyLabel,
} = useLoanCharges()

onMounted(() => {
  fetch()
  fetchAccounts()
})

const CHARGE_TYPE_OPTIONS = [
  { id: 'flat', name: 'Flat Amount' },
  { id: 'percentage', name: 'Percentage' },
]

const FREQUENCY_OPTIONS = [
  { id: 'one_time', name: 'One-Time' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' },
]

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    processing_fee: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    penalty: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    late_fee: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    appraisal_fee: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    insurance: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    other: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  }
  return map[cat] ?? map.other
}
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        @click="router.push({ name: 'tenant-settings-loans' })"
      >
        <ArrowLeft class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
      </button>
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
      >
        <DollarSign class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
      </div>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Charges & Penalties
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Create and manage fees and penalties that can be assigned to loan products.
        </p>
      </div>
    </div>

    <!-- Table Card -->
    <div
      class="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <!-- Toolbar -->
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800"
      >
        <div class="flex items-center gap-3 flex-1">
          <div class="relative flex-1 max-w-xs">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Search charges..."
              class="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
          <select
            v-model="filterCategory"
            class="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          >
            <option value="">All Categories</option>
            <option v-for="opt in categoryOptions" :key="opt.id" :value="opt.id">
              {{ opt.name }}
            </option>
          </select>
        </div>
        <button
          @click="openAddDrawer"
          class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
          style="background-color: var(--color-nfuko-primary)"
        >
          <Plus class="h-4 w-4" />
          Add New
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="divide-y divide-neutral-100 dark:divide-neutral-800">
        <div v-for="i in 4" :key="i" class="flex items-center gap-4 px-6 py-4 animate-pulse">
          <div class="h-4 w-40 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div class="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div class="h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div class="ml-auto h-6 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800" />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="charges.length === 0"
        class="flex flex-col items-center gap-2 py-12 text-center"
      >
        <Receipt class="h-8 w-8 text-neutral-300" />
        <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
          No charges or penalties configured
        </p>
        <p class="text-xs text-neutral-400">
          Click "Add New" to create your first charge or penalty.
        </p>
      </div>

      <!-- No results -->
      <div
        v-else-if="filteredCharges.length === 0"
        class="flex flex-col items-center gap-2 py-12 text-center"
      >
        <Search class="h-8 w-8 text-neutral-300" />
        <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
          No matching charges found
        </p>
        <p class="text-xs text-neutral-400">Try adjusting your search or filter.</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-neutral-50/60 dark:bg-neutral-800/40">
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Name</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Category</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">
                Type & Value
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Frequency</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Grace Days</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-neutral-500">Active</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr
              v-for="charge in filteredCharges"
              :key="charge.id"
              class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
              :class="{ 'opacity-50': !charge.is_active }"
            >
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="font-semibold text-neutral-900 dark:text-white">{{
                    charge.name
                  }}</span>
                  <span v-if="charge.code" class="text-xs text-neutral-400 font-mono">{{
                    charge.code
                  }}</span>
                </div>
              </td>

              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="categoryColor(charge.category)"
                >
                  {{ categoryLabel(charge.category) }}
                </span>
              </td>

              <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                  <span class="font-mono font-semibold text-neutral-900 dark:text-white">
                    {{
                      charge.charge_type === 'percentage'
                        ? charge.value + '%'
                        : formatMoneyValue(Number(charge.value))
                    }}
                  </span>
                  <span
                    class="inline-flex w-fit rounded px-1.5 py-0.5 text-xs font-medium capitalize"
                    :class="
                      charge.charge_type === 'percentage'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    "
                  >
                    {{ charge.charge_type }}
                  </span>
                </div>
              </td>

              <td class="px-6 py-4">
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ frequencyLabel(charge.frequency) }}
                </span>
              </td>

              <td class="px-6 py-4">
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ charge.grace_days > 0 ? charge.grace_days + ' days' : '—' }}
                </span>
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
                    class="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    title="Edit charge"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                  <button
                    @click="remove(charge)"
                    :disabled="deleting === charge.id"
                    class="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 transition-colors disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
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

    <!-- ─── Create / Edit Drawer ──────────────────────────────────────── -->
    <Transition name="drawer-fade">
      <div v-if="showDrawer" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer" />
        <Transition name="drawer-slide">
          <aside
            class="absolute right-0 top-0 h-full w-full max-w-[620px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900 overflow-hidden"
            role="dialog"
            aria-label="Loan Charges"
          >
            <div class="flex h-full flex-col">
              <!-- Header -->
              <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30"
                    >
                      <DollarSign class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                    </div>
                    <h3 class="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                      {{ editingCharge ? 'Edit Charge' : 'Create New Charge' }}
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
                <!-- Name -->
                <div class="space-y-2">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Charge Name <span class="text-red-500">*</span>
                  </Label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="e.g. Late Payment Penalty, Processing Fee"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                  <p class="text-xs text-neutral-400">
                    A descriptive name that SACCO managers and members will recognise on statements.
                  </p>
                  <p v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</p>
                </div>

                <!-- Category -->
                <div class="space-y-2">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Category <span class="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
                    v-model="form.category"
                    :options="categoryOptions"
                    placeholder="Select category"
                    state="charge-category"
                  />
                  <p class="text-xs text-neutral-400">
                    Processing Fee — charged once at disbursement, deducted upfront.<br />
                    Penalty / Late Fee — charged when a repayment is overdue.<br />
                    Appraisal Fee — charged for loan assessment.<br />
                    Insurance — loan protection premium held as liability.
                  </p>
                  <p v-if="errors.category" class="text-xs text-red-500">{{ errors.category }}</p>
                </div>

                <!-- Charge Type -->
                <div class="space-y-2">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Charge Type <span class="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
                    v-model="form.charge_type"
                    :options="CHARGE_TYPE_OPTIONS"
                    placeholder="Select type"
                    state="charge-type"
                  />
                  <p class="text-xs text-neutral-400">
                    Flat Amount — a fixed amount (e.g. KES 500).<br />
                    Percentage — calculated on the loan amount or outstanding balance.
                  </p>
                </div>

                <!-- Value -->
                <div class="space-y-2">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {{ form.charge_type === 'percentage' ? 'Rate (%)' : 'Amount' }}
                    <span class="text-red-500">*</span>
                  </Label>
                  <input
                    v-model="form.value"
                    type="number"
                    min="0"
                    step="0.01"
                    :placeholder="form.charge_type === 'percentage' ? 'e.g. 5' : 'e.g. 500'"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                  <p class="text-xs text-neutral-400">
                    {{
                      form.charge_type === 'percentage'
                        ? 'Enter a value between 0 and 100.'
                        : 'Enter the flat amount to charge.'
                    }}
                  </p>
                  <p v-if="errors.value" class="text-xs text-red-500">{{ errors.value }}</p>
                </div>

                <!-- Frequency -->
                <div class="space-y-2">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Frequency <span class="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
                    v-model="form.frequency"
                    :options="FREQUENCY_OPTIONS"
                    placeholder="Select frequency"
                    state="charge-frequency"
                  />
                  <p class="text-xs text-neutral-400">
                    How often this charge is applied. Use "One-Time" for processing fees charged at
                    disbursement.
                  </p>
                  <p v-if="errors.frequency" class="text-xs text-red-500">{{ errors.frequency }}</p>
                </div>

                <!-- Grace Days -->
                <div class="space-y-2">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Grace Days
                  </Label>
                  <input
                    v-model="form.grace_days"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                  <p class="text-xs text-neutral-400">
                    Number of days after the due date before this charge applies. Set to 0 for
                    immediate application.
                  </p>
                  <p v-if="errors.grace_days" class="text-xs text-red-500">
                    {{ errors.grace_days }}
                  </p>
                </div>

                <!-- GL Mapping -->
                <div class="border-t border-neutral-100 pt-5 dark:border-neutral-800">
                  <h4 class="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                    Accounting (GL Mapping)
                  </h4>
                  <p class="text-xs text-neutral-400 mb-4">
                    These accounts are used for automatic journal entries when this charge is
                    applied to a loan.
                    <span v-if="form.category !== 'other'" class="text-red-500"
                      >Required for this category.</span
                    >
                  </p>

                  <div class="space-y-4">
                    <div class="space-y-2">
                      <Label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Income Account
                        <span v-if="form.category !== 'other'" class="text-red-500">*</span>
                      </Label>
                      <SearchableSelect
                        v-model="form.income_account_id"
                        :options="incomeAccounts"
                        placeholder="Select income account"
                        state="charge-income-account"
                      />
                      <p class="text-xs text-neutral-400">
                        <template
                          v-if="form.category === 'penalty' || form.category === 'late_fee'"
                        >
                          Penalty revenue is recognized here. Debits Penalty Receivable, credits
                          this account.
                        </template>
                        <template v-else-if="form.category === 'processing_fee'">
                          Processing fee revenue is recognized here. Credits this account at
                          disbursement.
                        </template>
                        <template v-else-if="form.category === 'insurance'">
                          Insurance premiums are held as a liability until paid to the insurer.
                        </template>
                        <template v-else> Revenue from this charge is posted here. </template>
                      </p>
                      <p v-if="errors.income_account_id" class="text-xs text-red-500">
                        {{ errors.income_account_id }}
                      </p>
                    </div>

                    <div class="space-y-2">
                      <Label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Receivable Account
                        <span v-if="form.category !== 'other'" class="text-red-500">*</span>
                      </Label>
                      <SearchableSelect
                        v-model="form.receivable_account_id"
                        :options="accounts"
                        placeholder="Select receivable account"
                        state="charge-receivable-account"
                      />
                      <p class="text-xs text-neutral-400">
                        <template
                          v-if="form.category === 'penalty' || form.category === 'late_fee'"
                        >
                          Penalties accrue here until collected from the member. DR this account
                          when penalty is assessed.
                        </template>
                        <template v-else-if="form.category === 'processing_fee'">
                          Processing fees owed but not yet collected are tracked here.
                        </template>
                        <template v-else>
                          Amounts owed but not yet collected are tracked here.
                        </template>
                      </p>
                      <p v-if="errors.receivable_account_id" class="text-xs text-red-500">
                        {{ errors.receivable_account_id }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Description -->
                <div class="space-y-2">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                    >Description</Label
                  >
                  <textarea
                    v-model="form.description"
                    rows="3"
                    placeholder="Optional notes about this charge..."
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white resize-none"
                  />
                </div>
              </div>

              <!-- Footer -->
              <div
                class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700"
              >
                <button
                  type="button"
                  @click="closeDrawer"
                  class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  @click="submit"
                  :disabled="processing"
                  class="inline-flex items-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors disabled:opacity-60 shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary"
                >
                  <Spinner v-if="processing" class="h-4 w-4" />
                  {{ processing ? 'Saving...' : editingCharge ? 'Save Changes' : 'Create Charge' }}
                </button>
              </div>
            </div>
          </aside>
        </Transition>
      </div>
    </Transition>

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
