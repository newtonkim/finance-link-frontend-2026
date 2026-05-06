<script setup lang="ts">
import { UserCog } from 'lucide-vue-next'
import { ChevronRight } from 'lucide-vue-next'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'

defineProps<{
  form: any
  selectedMember: any
  selectedProduct: any
  memberOptions: any[]
  productOptions: any[]
  staffOptions: any[]
  branches: any[]
  showBranchSelect: boolean
  fieldError: (field: string) => string | null | undefined
  step1Valid: boolean
}>()

const emit = defineEmits<{
  selectMember: [m: any]
  clearMember: []
  selectProduct: [p: any]
  next: []
}>()

const { formatAmount } = useLoanApplicationHelpers()
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
    <!-- Main: Member + Product -->
    <div class="flex flex-col gap-6">
      <div
        class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">
          Member & Product
        </h2>
        <div class="grid gap-4">
          <!-- Member -->
          <div>
            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Member <span class="text-red-500">*</span></label
            >
            <div
              v-if="selectedMember"
              class="flex items-center justify-between rounded-xl border px-4 py-3"
              :class="
                fieldError('member_id')
                  ? 'border-red-400'
                  : 'border-neutral-200 dark:border-neutral-700'
              "
            >
              <div class="flex flex-col gap-1">
                <p class="text-sm font-semibold text-neutral-900 dark:text-white">
                  {{ selectedMember.name }}
                </p>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-neutral-500">
                  <span v-if="selectedMember.member_no"
                    >Member No:
                    <span class="font-medium text-neutral-700 dark:text-neutral-300">{{
                      selectedMember.member_no
                    }}</span></span
                  >
                  <template v-if="selectedMember.savings_account">
                    <span
                      >Account:
                      <span class="font-medium text-neutral-700 dark:text-neutral-300">{{
                        selectedMember.savings_account.account_no
                      }}</span></span
                    >
                    <span
                      >Balance:
                      <span class="font-medium text-nfuko-primary dark:text-bg-nfuko-yellow">{{
                        formatAmount(selectedMember.savings_account.balance)
                      }}</span></span
                    >
                  </template>
                </div>
              </div>
              <button
                type="button"
                class="ml-4 shrink-0 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                @click="emit('clearMember')"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SearchableSelect
              v-if="!selectedMember"
              v-model="form.member_id"
              :options="memberOptions"
              placeholder="Search for a member..."
              :error="fieldError('member_id') ?? undefined"
              @update:itemSelected="(v)=>{
                form.member_details = v
                emit('selectMember', v)
              }"
            >
              <template #option="{ item }">
                <div class="flex flex-col py-0.5">
                  <span class="font-semibold text-neutral-900 dark:text-white">{{
                    item.name
                  }}</span>
                  <div class="flex items-center gap-2 text-[10px] text-neutral-500">
                    <span>{{ item.member_no }}</span>
                    <template v-if="item.phone">
                      <span class="text-neutral-300">·</span>
                      <span>{{ item.phone }}</span>
                    </template>
                    <template v-if="item.savings_account">
                      <span class="text-neutral-300">·</span>
                      <span>{{ item.savings_account.account_no }}</span>
                      <span class="font-medium text-nfuko-primary dark:text-bg-nfuko-yellow">{{
                        formatAmount(item.savings_account.balance)
                      }}</span>
                    </template>
                  </div>
                </div>
              </template>
            </SearchableSelect>
          </div>
          <!-- Product -->
          <div>
            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Loan Product <span class="text-red-500">*</span></label
            >
            <SearchableSelect
              v-model="form.loan_product_id"
              :options="productOptions"
              placeholder="Choose a loan product..."
              :error="fieldError('loan_product_id') ?? undefined"
              
              @update:itemSelected="(v)=>{
                form.loan_product_details = v
                emit('selectProduct', v)
                }"
            />
          </div>
          <!-- Branch -->
          <div v-if="showBranchSelect">
            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Branch</label
            >
            <SearchableSelect
              v-model="form.branch_id"
              :options="branches"
          @update:item-selected="(v)=>form.branch_name = v.name"

              placeholder="Select a branch..."
              :error="fieldError('branch_id') ?? undefined"
            />
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button
            type="button"
            :disabled="!step1Valid"
            class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors disabled:opacity-40"
            @click="emit('next')"
          >
            Next: Loan Details <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar: Product details + Loan Officer -->
    <div class="flex flex-col gap-6 relative z-10">
      <div
        v-if="selectedProduct"
        class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Product Details</h3>
        <dl class="grid gap-2 text-sm">
          <div class="flex justify-between gap-2">
            <dt class="text-neutral-500 dark:text-neutral-400">Interest Rate</dt>
            <dd class="font-medium text-neutral-900 dark:text-white">
              {{ selectedProduct.interest_rate ?? '—' }}%
              <span class="text-xs text-neutral-400"
                >/{{ selectedProduct.interest_period?.replace(/_/g, ' ') }}</span
              >
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-neutral-500 dark:text-neutral-400">Repayment Cycle</dt>
            <dd class="font-medium capitalize text-neutral-900 dark:text-white">
              {{ selectedProduct.repayment_cycle ?? '—' }}
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-neutral-500 dark:text-neutral-400">Default Term</dt>
            <dd class="font-medium text-neutral-900 dark:text-white">
              {{ selectedProduct.loan_duration ?? '—' }} {{ selectedProduct.duration_type }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Loan Officer -->
      <div
        class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="mb-4 flex items-center gap-2">
          <UserCog class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Loan Officer</h3>
        </div>
        <SearchableSelect
          v-model="form.loan_officer_id"
          :options="staffOptions"
          placeholder="Select loan officer..."
          @update:item-selected="(v)=>form.loan_officer_name = v.name"
          :error="fieldError('loan_officer_id') ?? undefined"
        />
      </div>
    </div>
  </div>
</template>
