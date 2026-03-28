<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowLeft, HandCoins, Save, Send, ChevronDown, Loader2, Calculator } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useRouter } from 'vue-router'
import { useLoanApplicationEdit } from '../composables/useLoanApplicationEdit'
import LoanEligibilityPanel from '../components/LoanEligibilityPanel.vue'
import LoanGuarantorManager from '../components/LoanGuarantorManager.vue'
import LoanDocumentUploader from '../components/LoanDocumentUploader.vue'

const router = useRouter()

const {
    loading, saving, submitting, errors,
    form,
    selectedProduct, schedulePreview, previewLoading,
    eligibilityResult, eligibilityLoading, triggerEligibilityCheck,
    members, products,
    fetchMembers, onProductChange,
    fieldError,
    save, submit,
} = useLoanApplicationEdit()

const eligibilityReady = computed(() =>
    !!(form.value.member_id && form.value.loan_product_id && form.value.requested_amount && form.value.requested_term)
)
const hasEligibilityFailures  = computed(() => (eligibilityResult.value?.failed?.length ?? 0) > 0)
const guarantorsAdequate      = ref(true)
const minGuarantors           = computed(() => (selectedProduct.value as any)?.min_guarantors ?? 0)
const canSubmit               = computed(() => !hasEligibilityFailures.value && (minGuarantors.value === 0 || guarantorsAdequate.value))

// ─── Member search dropdown ───────────────────────────────────────────────────
type MemberOption = { id: number; name: string; member_no: string; savings_account: { account_no: string; balance: number } | null }

const memberSearch       = ref('')
const showMemberDropdown = ref(false)
const memberLoading      = ref(false)
const selectedMember     = ref<MemberOption | null>(null)
let memberSearchTimer: ReturnType<typeof setTimeout> | null = null

// Seed selectedMember card once the application loads and members list is ready
watch(() => form.value.member_id, (id) => {
    if (id && !selectedMember.value) {
        const found = members.value.find(m => m.id === id)
        if (found) selectedMember.value = found
    }
}, { immediate: true })

watch(members, (list) => {
    if (form.value.member_id && !selectedMember.value) {
        const found = list.find(m => m.id === form.value.member_id)
        if (found) selectedMember.value = found
    }
})

async function openMemberDropdown() {
    showMemberDropdown.value = true
    if (!members.value.length) {
        memberLoading.value = true
        await fetchMembers()
        memberLoading.value = false
    }
}

function onMemberSearchInput() {
    showMemberDropdown.value = true
    if (memberSearchTimer) clearTimeout(memberSearchTimer)
    memberSearchTimer = setTimeout(async () => {
        memberLoading.value = true
        await fetchMembers(memberSearch.value.trim() || undefined)
        memberLoading.value = false
    }, 350)
}

function selectMember(m: MemberOption) {
    form.value.member_id     = m.id
    selectedMember.value     = m
    memberSearch.value       = ''
    showMemberDropdown.value = false
}

function closeMemberDropdown() {
    setTimeout(() => { showMemberDropdown.value = false }, 200)
}

function clearMember() {
    form.value.member_id = null
    selectedMember.value = null
    memberSearch.value   = ''
}

// ─── Product search dropdown ──────────────────────────────────────────────────
const productSearch       = ref('')
const showProductDropdown = ref(false)

const filteredProducts = computed(() => {
    const q = productSearch.value.trim().toLowerCase()
    if (!q) return products.value
    return products.value.filter(p =>
        p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
    )
})

// Seed product search input when application loads
watch(() => form.value.loan_product_id, (id) => {
    if (id && !productSearch.value) {
        const found = products.value.find(p => p.id === id)
        if (found) productSearch.value = found.code ? `${found.name} (${found.code})` : found.name
    }
}, { immediate: true })

watch(products, (list) => {
    if (form.value.loan_product_id && !productSearch.value) {
        const found = list.find(p => p.id === form.value.loan_product_id)
        if (found) productSearch.value = found.code ? `${found.name} (${found.code})` : found.name
    }
})

function openProductDropdown() {
    showProductDropdown.value = true
}

function selectProduct(p: { id: number; name: string; code?: string }) {
    form.value.loan_product_id = p.id
    productSearch.value        = p.code ? `${p.name} (${p.code})` : p.name
    showProductDropdown.value  = false
    void onProductChange()
}

function closeProductDropdown() {
    setTimeout(() => { showProductDropdown.value = false }, 200)
}

function clearProduct() {
    form.value.loan_product_id = null
    productSearch.value        = ''
    void onProductChange()
}

function formatAmount(v: number | string | null | undefined) {
    if (v == null || v === '') return '—'
    return formatMoneyValue(v)
}

// ─── Money input helpers ──────────────────────────────────────────────────────
const amountDisplay = ref('')

function onAmountInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/,/g, '')
    amountDisplay.value = raw
    const num = parseFloat(raw)
    form.value.requested_amount = isNaN(num) ? null : num
}

function onAmountFocus() {
    amountDisplay.value = form.value.requested_amount != null ? String(form.value.requested_amount) : ''
}

function onAmountBlur() {
    if (form.value.requested_amount != null) {
        amountDisplay.value = Number(form.value.requested_amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    } else {
        amountDisplay.value = ''
    }
}

// Seed display when application loads
watch(() => form.value.requested_amount, (v) => {
    if (v != null && !amountDisplay.value) {
        amountDisplay.value = Number(v).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }
}, { immediate: true })
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">

        <!-- Header -->
        <div class="flex items-center gap-3">
            <button class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="router.back()">
                <ArrowLeft class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <HandCoins class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Edit Loan Application</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Update application details or submit for review.</p>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">Loading…</div>

        <form v-else class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" @submit.prevent="save">

            <!-- ─── Left column ──────────────────────────────────────────────── -->
            <div class="flex flex-col gap-6">
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="mb-5 flex items-center justify-between">
                        <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Application Details</h2>
                        <span v-if="form.application_no" class="font-mono text-xs font-medium text-neutral-400 dark:text-neutral-500">{{ form.application_no }}</span>
                    </div>
                    <div class="grid gap-4 sm:grid-cols-2">

                        <!-- Member -->
                        <div class="sm:col-span-2">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Member <span class="text-red-500">*</span></label>

                            <!-- Selected member card -->
                            <div v-if="selectedMember"
                                class="flex items-center justify-between rounded-xl border px-4 py-3"
                                :class="fieldError('member_id') ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'"
                            >
                                <div class="flex flex-col gap-1">
                                    <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ selectedMember.name }}</p>
                                    <div class="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                        <span v-if="selectedMember.member_no">
                                            Member No: <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ selectedMember.member_no }}</span>
                                        </span>
                                        <template v-if="selectedMember.savings_account">
                                            <span>
                                                Account: <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ selectedMember.savings_account.account_no }}</span>
                                            </span>
                                            <span>
                                                Balance: <span class="font-medium text-nfuko-primary dark:text-bg-nfuko-yellow">{{ formatAmount(selectedMember.savings_account.balance) }}</span>
                                            </span>
                                        </template>
                                        <span v-else class="text-neutral-400 dark:text-neutral-500 italic">No savings account</span>
                                    </div>
                                </div>
                                <button type="button" class="ml-4 shrink-0 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors" @click="clearMember">
                                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>

                            <!-- Search input -->
                            <div v-else class="relative">
                                <div class="flex w-full items-center rounded-xl border px-3 py-2 text-sm gap-2"
                                    :class="fieldError('member_id') ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'">
                                    <input
                                        v-model="memberSearch"
                                        type="text"
                                        placeholder="Type name or member number to search…"
                                        class="flex-1 bg-transparent text-sm text-neutral-900 outline-none dark:text-white dark:placeholder-neutral-500"
                                        @input="onMemberSearchInput"
                                        @focus="openMemberDropdown"
                                        @blur="closeMemberDropdown"
                                    />
                                    <Loader2 v-if="memberLoading" class="h-4 w-4 shrink-0 animate-spin text-neutral-400" />
                                    <ChevronDown v-else class="h-4 w-4 shrink-0 text-neutral-400" />
                                </div>
                                <div v-if="showMemberDropdown" class="absolute z-20 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                                    <div v-if="memberLoading" class="flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-400">
                                        <Loader2 class="h-4 w-4 animate-spin" /> Searching…
                                    </div>
                                    <ul v-else-if="members.length" class="max-h-56 overflow-y-auto">
                                        <li
                                            v-for="m in members" :key="m.id"
                                            class="cursor-pointer px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                            @mousedown.prevent="selectMember(m)"
                                        >
                                            <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ m.name }}</p>
                                            <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                                <p v-if="m.member_no" class="text-xs text-neutral-400 dark:text-neutral-500">{{ m.member_no }}</p>
                                                <template v-if="m.savings_account">
                                                    <span class="text-xs text-neutral-300 dark:text-neutral-600">·</span>
                                                    <p class="text-xs text-neutral-400 dark:text-neutral-500">
                                                        {{ m.savings_account.account_no }}
                                                        <span class="font-medium text-neutral-600 dark:text-neutral-300">{{ formatAmount(m.savings_account.balance) }}</span>
                                                    </p>
                                                </template>
                                            </div>
                                        </li>
                                    </ul>
                                    <p v-else class="px-4 py-3 text-sm text-neutral-400 dark:text-neutral-500">
                                        {{ memberSearch ? 'No members found.' : 'Start typing to search members.' }}
                                    </p>
                                </div>
                            </div>

                            <p v-if="fieldError('member_id')" class="mt-1 text-xs text-red-500">{{ fieldError('member_id') }}</p>
                        </div>

                        <!-- Loan Product -->
                        <div class="sm:col-span-2">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Loan Product <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <div class="flex w-full items-center rounded-xl border px-3 py-2 text-sm gap-2"
                                    :class="fieldError('loan_product_id') ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'">
                                    <input
                                        v-model="productSearch"
                                        type="text"
                                        placeholder="Type to search loan products…"
                                        class="flex-1 bg-transparent text-sm text-neutral-900 outline-none dark:text-white dark:placeholder-neutral-500"
                                        @focus="openProductDropdown"
                                        @blur="closeProductDropdown"
                                    />
                                    <button v-if="form.loan_product_id" type="button" class="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" @mousedown.prevent="clearProduct">
                                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                    <ChevronDown v-else class="h-4 w-4 shrink-0 text-neutral-400" />
                                </div>
                                <div v-if="showProductDropdown" class="absolute z-20 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                                    <ul v-if="filteredProducts.length" class="max-h-56 overflow-y-auto">
                                        <li
                                            v-for="p in filteredProducts" :key="p.id"
                                            class="cursor-pointer px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                            @mousedown.prevent="selectProduct(p)"
                                        >
                                            <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ p.name }}</p>
                                            <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ p.code }}</p>
                                        </li>
                                    </ul>
                                    <p v-else class="px-4 py-3 text-sm text-neutral-400 dark:text-neutral-500">No products found.</p>
                                </div>
                            </div>
                            <p v-if="fieldError('loan_product_id')" class="mt-1 text-xs text-red-500">{{ fieldError('loan_product_id') }}</p>
                        </div>

                        <!-- Requested Amount -->
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Requested Amount <span class="text-red-500">*</span></label>
                            <input
                                :value="amountDisplay"
                                type="text"
                                inputmode="decimal"
                                placeholder="0.00"
                                class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white"
                                :class="fieldError('requested_amount') ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'"
                                @input="onAmountInput"
                                @focus="onAmountFocus"
                                @blur="onAmountBlur"
                            />
                            <p v-if="fieldError('requested_amount')" class="mt-1 text-xs text-red-500">{{ fieldError('requested_amount') }}</p>
                        </div>

                        <!-- Requested Term -->
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Requested Term <span class="text-red-500">*</span></label>
                            <div class="flex items-center gap-2">
                                <input v-model="form.requested_term" type="number" min="1" placeholder="e.g. 12"
                                    class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white"
                                    :class="fieldError('requested_term') ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'" />
                                <span v-if="selectedProduct?.duration_type" class="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">{{ selectedProduct.duration_type }}</span>
                            </div>
                            <p v-if="fieldError('requested_term')" class="mt-1 text-xs text-red-500">{{ fieldError('requested_term') }}</p>
                        </div>

                        <!-- Purpose -->
                        <div class="sm:col-span-2">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Purpose</label>
                            <textarea v-model="form.purpose" rows="3" placeholder="Briefly describe the purpose of this loan…"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>

                        <!-- Repayment Source -->
                        <div class="sm:col-span-2">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Repayment Source</label>
                            <input v-model="form.repayment_source" type="text" placeholder="e.g. Monthly salary, Business income…"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                    </div>
                </div>

                <!-- Guarantors -->
                <LoanGuarantorManager
                    v-if="form.id"
                    :application-id="form.id"
                    :min-guarantors="minGuarantors"
                    :applicant-member-id="form.member_id"
                    :editable="true"
                    @adequacy-change="(v) => { guarantorsAdequate = v }"
                />

                <!-- Documents -->
                <LoanDocumentUploader
                    v-if="form.id"
                    :application-id="form.id"
                    :editable="true"
                />

                <!-- Actions -->
                <div class="flex items-center justify-end gap-3">
                    <button type="button" class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800" @click="router.back()">Cancel</button>
                    <button type="submit" :disabled="saving" class="flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600">
                        <Save class="h-4 w-4" />
                        {{ saving ? 'Saving…' : 'Save Draft' }}
                    </button>
                    <button
                        v-if="form.status === 'draft'"
                        type="button"
                        :disabled="submitting || !canSubmit"
                        :title="!canSubmit ? (hasEligibilityFailures ? 'Fix eligibility failures before submitting' : 'Add required guarantors before submitting') : undefined"
                        class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors disabled:opacity-50 dark:bg-bg-nfuko-yellow dark:text-black"
                        @click="submit"
                    >
                        <Send class="h-4 w-4" />
                        {{ submitting ? 'Submitting…' : 'Submit Application' }}
                    </button>
                </div>
            </div>

            <!-- ─── Right column ─────────────────────────────────────────────── -->
            <div class="flex flex-col gap-6">
                <!-- Product info -->
                <div v-if="selectedProduct" class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Product Details</h3>
                    <dl class="grid gap-2 text-sm">
                        <div class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Interest Method</dt>
                            <dd class="text-right font-medium text-neutral-900 dark:text-white">
                                <template v-if="selectedProduct.interest_method === 'reducing_balance'">
                                    Reducing Balance
                                    <span v-if="selectedProduct.repayment_structure" class="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                        {{ selectedProduct.repayment_structure === 'equal_installment' ? 'Equal Installment'
                                         : selectedProduct.repayment_structure === 'equal_principal' ? 'Equal Principal'
                                         : selectedProduct.repayment_structure === 'interest_only_balloon' ? 'Interest Only + Balloon'
                                         : selectedProduct.repayment_structure }}
                                    </span>
                                </template>
                                <template v-else>
                                    {{ selectedProduct.interest_method ? selectedProduct.interest_method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—' }}
                                </template>
                            </dd>
                        </div>
                        <div class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Interest Rate</dt>
                            <dd class="font-medium text-neutral-900 dark:text-white">{{ selectedProduct.interest_rate ?? '—' }}% <span class="text-xs text-neutral-400">/{{ selectedProduct.interest_period?.replace(/_/g, ' ') }}</span></dd>
                        </div>
                        <div class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Repayment Cycle</dt>
                            <dd class="font-medium text-neutral-900 dark:text-white capitalize">{{ selectedProduct.repayment_cycle ?? '—' }}</dd>
                        </div>
                        <div class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Default Term</dt>
                            <dd class="font-medium text-neutral-900 dark:text-white">{{ selectedProduct.loan_duration ?? '—' }} {{ selectedProduct.duration_type }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- Eligibility panel -->
                <LoanEligibilityPanel
                    :result="eligibilityResult"
                    :loading="eligibilityLoading"
                    :ready="eligibilityReady"
                    @retry="triggerEligibilityCheck"
                />

                <!-- Schedule preview -->
                <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="mb-4 flex items-center gap-2">
                        <Calculator class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Repayment Preview</h3>
                    </div>
                    <div v-if="previewLoading" class="space-y-2">
                        <div v-for="n in 4" :key="n" class="h-4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                    </div>
                    <div v-else-if="schedulePreview">
                        <div class="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                            <div class="text-center">
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">Installment</p>
                                <p class="mt-0.5 text-sm font-bold text-neutral-900 dark:text-white">{{ formatAmount(schedulePreview.installment_amount) }}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">Total Interest</p>
                                <p class="mt-0.5 text-sm font-bold text-neutral-900 dark:text-white">{{ formatAmount(schedulePreview.total_interest) }}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">Total Repay</p>
                                <p class="mt-0.5 text-sm font-bold text-nfuko-primary dark:text-bg-nfuko-yellow">{{ formatAmount(schedulePreview.total_repayment) }}</p>
                            </div>
                        </div>
                        <div v-if="schedulePreview.schedule_preview.length" class="max-h-64 overflow-y-auto">
                            <table class="w-full text-xs">
                                <thead class="sticky top-0 bg-white dark:bg-neutral-900">
                                    <tr class="border-b border-neutral-100 text-left font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                                        <th class="py-1.5 pr-3">#</th>
                                        <th class="py-1.5 pr-3 text-right">Principal</th>
                                        <th class="py-1.5 pr-3 text-right">Interest</th>
                                        <th class="py-1.5 pr-3 text-right">Installment</th>
                                        <th class="py-1.5 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    <tr v-for="row in schedulePreview.schedule_preview" :key="row.period">
                                        <td class="py-1.5 pr-3 text-neutral-500">{{ row.period }}</td>
                                        <td class="py-1.5 pr-3 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.principal) }}</td>
                                        <td class="py-1.5 pr-3 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.interest) }}</td>
                                        <td class="py-1.5 pr-3 text-right font-medium text-neutral-900 dark:text-white">{{ formatAmount(row.installment) }}</td>
                                        <td class="py-1.5 text-right text-neutral-500">{{ formatAmount(row.balance) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div v-else class="flex flex-col items-center justify-center py-8 text-center">
                        <Calculator class="mb-2 h-6 w-6 text-neutral-300 dark:text-neutral-600" />
                        <p class="text-xs text-neutral-400 dark:text-neutral-500">Select a product and enter an amount to see the repayment schedule.</p>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>
