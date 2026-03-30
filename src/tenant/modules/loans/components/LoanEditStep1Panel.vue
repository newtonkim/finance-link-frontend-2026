<script setup lang="ts">
import { ChevronDown, Loader2, ChevronRight } from 'lucide-vue-next'
import LoanEligibilityPanel from './LoanEligibilityPanel.vue'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'

defineProps<{
    form: any
    selectedMember: any
    members: any[]
    memberSearch: string
    memberLoading: boolean
    showMemberDropdown: boolean
    productSearch: string
    showProductDropdown: boolean
    filteredProducts: any[]
    selectedProduct: any
    fieldError: (field: string) => string | null | undefined
    eligibilityResult: any
    eligibilityLoading: boolean
    eligibilityReady: boolean
    step1Valid: boolean
}>()

const emit = defineEmits<{
    openMemberDropdown: []
    onMemberInput: []
    selectMember: [m: any]
    closeMemberDropdown: []
    clearMember: []
    'update:memberSearch': [v: string]
    openProductDropdown: []
    selectProduct: [p: any]
    closeProductDropdown: []
    clearProduct: []
    'update:productSearch': [v: string]
    next: []
    retryEligibility: []
}>()

const { formatAmount } = useLoanApplicationHelpers()
</script>

<template>
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="flex flex-col gap-6">
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Member & Product</h2>
                <div class="grid gap-4">
                    <!-- Member -->
                    <div>
                        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Member <span class="text-red-500">*</span></label>
                        <div v-if="selectedMember" class="flex items-center justify-between rounded-xl border px-4 py-3" :class="fieldError('member_id') ? 'border-red-400' : 'border-neutral-200 dark:border-neutral-700'">
                            <div class="flex flex-col gap-1">
                                <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ selectedMember.name }}</p>
                                <div class="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-neutral-500">
                                    <span v-if="selectedMember.member_no">{{ selectedMember.member_no }}</span>
                                    <template v-if="selectedMember.savings_account">
                                        <span>{{ selectedMember.savings_account.account_no }}</span>
                                        <span class="font-medium text-nfuko-primary dark:text-bg-nfuko-yellow">{{ formatAmount(selectedMember.savings_account.balance) }}</span>
                                    </template>
                                </div>
                            </div>
                            <button type="button" class="ml-4 shrink-0 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 transition-colors" @click="emit('clearMember')">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <div v-else class="relative">
                            <div class="flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm" :class="fieldError('member_id') ? 'border-red-400' : 'border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800'">
                                <input :value="memberSearch" type="text" placeholder="Type name or member number to search…"
                                    class="flex-1 bg-transparent text-sm outline-none dark:text-white dark:placeholder-neutral-500"
                                    @input="emit('onMemberInput'); emit('update:memberSearch', ($event.target as HTMLInputElement).value)"
                                    @focus="emit('openMemberDropdown')"
                                    @blur="emit('closeMemberDropdown')" />
                                <Loader2 v-if="memberLoading" class="h-4 w-4 shrink-0 animate-spin text-neutral-400" />
                                <ChevronDown v-else class="h-4 w-4 shrink-0 text-neutral-400" />
                            </div>
                            <div v-if="showMemberDropdown" class="absolute z-20 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                                <div v-if="memberLoading" class="flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-400">
                                    <Loader2 class="h-4 w-4 animate-spin" /> Searching…
                                </div>
                                <ul v-else-if="members.length" class="max-h-56 overflow-y-auto">
                                    <li v-for="m in members" :key="m.id" class="cursor-pointer px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50" @mousedown.prevent="emit('selectMember', m)">
                                        <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ m.name }}</p>
                                        <div class="flex flex-wrap items-center gap-x-3 mt-0.5 text-xs text-neutral-400">
                                            <span v-if="m.member_no">{{ m.member_no }}</span>
                                            <template v-if="m.savings_account">
                                                <span>{{ m.savings_account.account_no }}</span>
                                                <span class="font-medium text-neutral-600 dark:text-neutral-300">{{ formatAmount(m.savings_account.balance) }}</span>
                                            </template>
                                        </div>
                                    </li>
                                </ul>
                                <p v-else class="px-4 py-3 text-sm text-neutral-400">{{ memberSearch ? 'No members found.' : 'Start typing to search members.' }}</p>
                            </div>
                        </div>
                        <p v-if="fieldError('member_id')" class="mt-1 text-xs text-red-500">{{ fieldError('member_id') }}</p>
                    </div>

                    <!-- Product -->
                    <div>
                        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Loan Product <span class="text-red-500">*</span></label>
                        <div class="relative">
                            <div class="flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm" :class="fieldError('loan_product_id') ? 'border-red-400' : 'border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800'">
                                <input :value="productSearch" type="text" placeholder="Type to search loan products…"
                                    class="flex-1 bg-transparent text-sm outline-none dark:text-white dark:placeholder-neutral-500"
                                    @input="emit('update:productSearch', ($event.target as HTMLInputElement).value)"
                                    @focus="emit('openProductDropdown')"
                                    @blur="emit('closeProductDropdown')" />
                                <button v-if="form.loan_product_id" type="button" class="shrink-0 text-neutral-400 hover:text-neutral-600" @mousedown.prevent="emit('clearProduct')">
                                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                                <ChevronDown v-else class="h-4 w-4 shrink-0 text-neutral-400" />
                            </div>
                            <div v-if="showProductDropdown" class="absolute z-20 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                                <ul v-if="filteredProducts.length" class="max-h-56 overflow-y-auto">
                                    <li v-for="p in filteredProducts" :key="p.id" class="cursor-pointer px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50" @mousedown.prevent="emit('selectProduct', p)">
                                        <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ p.name }}</p>
                                        <p class="text-xs text-neutral-400">{{ p.code }}</p>
                                    </li>
                                </ul>
                                <p v-else class="px-4 py-3 text-sm text-neutral-400">No products found.</p>
                            </div>
                        </div>
                        <p v-if="fieldError('loan_product_id')" class="mt-1 text-xs text-red-500">{{ fieldError('loan_product_id') }}</p>
                    </div>
                </div>
                <div class="mt-6 flex justify-end">
                    <button type="button" :disabled="!step1Valid" class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors disabled:opacity-40" @click="emit('next')">
                        Next: Loan Details <ChevronRight class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Sidebar -->
        <div class="flex flex-col gap-6">
            <div v-if="selectedProduct" class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Product Details</h3>
                <dl class="grid gap-2 text-sm">
                    <div class="flex justify-between gap-2"><dt class="text-neutral-500">Interest Rate</dt><dd class="font-medium text-neutral-900 dark:text-white">{{ selectedProduct.interest_rate ?? '—' }}% <span class="text-xs text-neutral-400">/{{ selectedProduct.interest_period?.replace(/_/g, ' ') }}</span></dd></div>
                    <div class="flex justify-between gap-2"><dt class="text-neutral-500">Repayment Cycle</dt><dd class="font-medium capitalize text-neutral-900 dark:text-white">{{ selectedProduct.repayment_cycle ?? '—' }}</dd></div>
                    <div class="flex justify-between gap-2"><dt class="text-neutral-500">Default Term</dt><dd class="font-medium text-neutral-900 dark:text-white">{{ selectedProduct.loan_duration ?? '—' }} {{ selectedProduct.duration_type }}</dd></div>
                </dl>
            </div>
            <LoanEligibilityPanel :result="eligibilityResult" :loading="eligibilityLoading" :ready="eligibilityReady" @retry="emit('retryEligibility')" />
        </div>
    </div>
</template>
