<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowLeft, HandCoins, Save, Send, ChevronRight, Plus, Trash2, Shield } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useLoanApplicationEdit } from '../composables/useLoanApplicationEdit'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import LoanEligibilityPanel from '../components/LoanEligibilityPanel.vue'
import LoanGuarantorManager from '../components/LoanGuarantorManager.vue'
import LoanDocumentUploader from '../components/LoanDocumentUploader.vue'
import LoanFormStepIndicator from '../components/LoanFormStepIndicator.vue'
import LoanFormRepaymentPreview from '../components/LoanFormRepaymentPreview.vue'
import LoanEditStep1Panel from '../components/LoanEditStep1Panel.vue'

const router = useRouter()
const { formatAmount } = useLoanApplicationHelpers()

const {
    loading, saving, submitting, form,
    selectedProduct, schedulePreview, previewLoading,
    eligibilityResult, eligibilityLoading, triggerEligibilityCheck,
    members, products, fetchMembers, onProductChange, fieldError,
    save, submit,
} = useLoanApplicationEdit()

// ─── Eligibility / guards ─────────────────────────────────────────────────────
const eligibilityReady   = computed(() => !!(form.value.member_id && form.value.loan_product_id && form.value.requested_amount && form.value.requested_term))
const guarantorsAdequate = ref(true)
const minGuarantors      = computed(() => (selectedProduct.value as any)?.min_guarantors ?? 0)
const canSubmit          = computed(() => (eligibilityResult.value?.failed?.length ?? 0) === 0 && (minGuarantors.value === 0 || guarantorsAdequate.value))

// ─── Member dropdown ──────────────────────────────────────────────────────────
type MemberOption = { id: number; name: string; member_no: string; savings_account: { account_no: string; balance: number } | null }
const memberSearch       = ref('')
const showMemberDropdown = ref(false)
const memberLoading      = ref(false)
const selectedMember     = ref<MemberOption | null>(null)
let memberTimer: ReturnType<typeof setTimeout> | null = null

watch(() => form.value.member_id, id => { if (id && !selectedMember.value) { const m = members.value.find(m => m.id === id); if (m) selectedMember.value = m } }, { immediate: true })
watch(members, list => { if (form.value.member_id && !selectedMember.value) { const m = list.find(m => m.id === form.value.member_id); if (m) selectedMember.value = m } })

async function openMemberDropdown() { showMemberDropdown.value = true; if (!members.value.length) { memberLoading.value = true; await fetchMembers(); memberLoading.value = false } }
function onMemberInput() { showMemberDropdown.value = true; if (memberTimer) clearTimeout(memberTimer); memberTimer = setTimeout(async () => { memberLoading.value = true; await fetchMembers(memberSearch.value.trim() || undefined); memberLoading.value = false }, 350) }
function selectMember(m: MemberOption) { form.value.member_id = m.id; selectedMember.value = m; memberSearch.value = ''; showMemberDropdown.value = false }
function closeMemberDropdown() { setTimeout(() => { showMemberDropdown.value = false }, 200) }
function clearMember() { form.value.member_id = null; selectedMember.value = null; memberSearch.value = '' }

// ─── Product dropdown ─────────────────────────────────────────────────────────
const productSearch       = ref('')
const showProductDropdown = ref(false)
const filteredProducts    = computed(() => {
    const q = productSearch.value.trim().toLowerCase()
    return q ? products.value.filter(p => p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)) : products.value
})
watch(() => form.value.loan_product_id, id => { if (id && !productSearch.value) { const p = products.value.find(p => p.id === id); if (p) productSearch.value = p.code ? `${p.name} (${p.code})` : p.name } }, { immediate: true })
watch(products, list => { if (form.value.loan_product_id && !productSearch.value) { const p = list.find(p => p.id === form.value.loan_product_id); if (p) productSearch.value = p.code ? `${p.name} (${p.code})` : p.name } })
function selectProduct(p: { id: number; name: string; code?: string }) { form.value.loan_product_id = p.id; productSearch.value = p.code ? `${p.name} (${p.code})` : p.name; showProductDropdown.value = false; void onProductChange() }
function closeProductDropdown() { setTimeout(() => { showProductDropdown.value = false }, 200) }
function clearProduct() { form.value.loan_product_id = null; productSearch.value = ''; void onProductChange() }

// ─── Amount input ─────────────────────────────────────────────────────────────
const amountDisplay = ref('')
function onAmountInput(e: Event) { const raw = (e.target as HTMLInputElement).value.replace(/,/g, ''); amountDisplay.value = raw; const n = parseFloat(raw); form.value.requested_amount = isNaN(n) ? null : n }
function onAmountFocus() { amountDisplay.value = form.value.requested_amount != null ? String(form.value.requested_amount) : '' }
function onAmountBlur() { amountDisplay.value = form.value.requested_amount != null ? Number(form.value.requested_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '' }
watch(() => form.value.requested_amount, v => { if (v != null && !amountDisplay.value) amountDisplay.value = Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }, { immediate: true })

// ─── Stepper ──────────────────────────────────────────────────────────────────
const currentStep = ref(1)
const steps       = [{ id: 1, label: 'Member & Product' }, { id: 2, label: 'Loan Details' }, { id: 3, label: 'Docs & Submit' }]
function goToStep(n: number) { currentStep.value = n }
function nextStep()          { if (currentStep.value < steps.length) currentStep.value++ }
function prevStep()          { if (currentStep.value > 1) currentStep.value-- }
const step1Valid = computed(() => !!(form.value.member_id && form.value.loan_product_id))
const step2Valid = computed(() => !!(form.value.requested_amount && form.value.requested_term))

// ─── Collateral ───────────────────────────────────────────────────────────────
interface CollateralItem { asset_type: string; description: string; estimated_value: number | null; notes: string }
const collateralItems = ref<CollateralItem[]>([])
const assetTypes      = ['Land', 'Building', 'Vehicle', 'Equipment', 'Savings/Deposit', 'Other']
function addCollateralItem()             { collateralItems.value.push({ asset_type: '', description: '', estimated_value: null, notes: '' }) }
function removeCollateralItem(i: number) { collateralItems.value.splice(i, 1) }
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
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    <span v-if="form.application_no" class="font-mono font-medium text-neutral-700 dark:text-neutral-300">{{ form.application_no }} · </span>
                    Update details or submit for review.
                </p>
            </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">Loading…</div>

        <template v-else>
            <LoanFormStepIndicator :steps="steps" :current-step="currentStep" @goto="goToStep" />

            <form @submit.prevent="save">

                <!-- Step 1 -->
                <LoanEditStep1Panel
                    v-show="currentStep === 1"
                    :form="form"
                    :selected-member="selectedMember"
                    :members="members"
                    :member-search="memberSearch"
                    :member-loading="memberLoading"
                    :show-member-dropdown="showMemberDropdown"
                    :product-search="productSearch"
                    :show-product-dropdown="showProductDropdown"
                    :filtered-products="filteredProducts"
                    :selected-product="selectedProduct"
                    :field-error="fieldError"
                    :eligibility-result="eligibilityResult"
                    :eligibility-loading="eligibilityLoading"
                    :eligibility-ready="eligibilityReady"
                    :step1-valid="step1Valid"
                    @open-member-dropdown="openMemberDropdown"
                    @on-member-input="onMemberInput"
                    @select-member="selectMember"
                    @close-member-dropdown="closeMemberDropdown"
                    @clear-member="clearMember"
                    @update:member-search="memberSearch = $event"
                    @open-product-dropdown="showProductDropdown = true"
                    @select-product="selectProduct"
                    @close-product-dropdown="closeProductDropdown"
                    @clear-product="clearProduct"
                    @update:product-search="productSearch = $event"
                    @next="nextStep"
                    @retry-eligibility="triggerEligibilityCheck"
                />

                <!-- Step 2 -->
                <div v-show="currentStep === 2" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div class="flex flex-col gap-6">
                        <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Loan Details</h2>
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Requested Amount <span class="text-red-500">*</span></label>
                                    <input :value="amountDisplay" type="text" inputmode="decimal" placeholder="0.00"
                                        class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white"
                                        :class="fieldError('requested_amount') ? 'border-red-400' : 'border-neutral-200 dark:border-neutral-700'"
                                        @input="onAmountInput" @focus="onAmountFocus" @blur="onAmountBlur" />
                                    <p v-if="fieldError('requested_amount')" class="mt-1 text-xs text-red-500">{{ fieldError('requested_amount') }}</p>
                                </div>
                                <div>
                                    <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Requested Term <span class="text-red-500">*</span></label>
                                    <div class="flex items-center gap-2">
                                        <input v-model="form.requested_term" type="number" min="1" placeholder="e.g. 12"
                                            class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white"
                                            :class="fieldError('requested_term') ? 'border-red-400' : 'border-neutral-200 dark:border-neutral-700'" />
                                        <span v-if="selectedProduct?.duration_type" class="shrink-0 text-sm text-neutral-500">{{ selectedProduct.duration_type }}</span>
                                    </div>
                                    <p v-if="fieldError('requested_term')" class="mt-1 text-xs text-red-500">{{ fieldError('requested_term') }}</p>
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Purpose</label>
                                    <textarea v-model="form.purpose" rows="3" placeholder="Briefly describe the purpose of this loan…" class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Repayment Source</label>
                                    <input v-model="form.repayment_source" type="text" placeholder="e.g. Monthly salary, Business income…" class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                </div>
                            </div>
                        </div>

                        <!-- Collateral (inline) -->
                        <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div class="mb-5 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <Shield class="h-4 w-4 text-neutral-400" />
                                    <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Collateral & Securities</h2>
                                    <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800">Optional</span>
                                </div>
                                <button type="button" class="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300" @click="addCollateralItem">
                                    <Plus class="h-3.5 w-3.5" /> Add Item
                                </button>
                            </div>
                            <div v-if="!collateralItems.length" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-8 text-center dark:border-neutral-700">
                                <Shield class="mb-2 h-6 w-6 text-neutral-300 dark:text-neutral-600" />
                                <p class="text-sm text-neutral-500">No collateral added.</p>
                            </div>
                            <div v-else class="space-y-4">
                                <div v-for="(item, idx) in collateralItems" :key="idx" class="relative rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                                    <button type="button" class="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors" @click="removeCollateralItem(idx)">
                                        <Trash2 class="h-3.5 w-3.5" />
                                    </button>
                                    <div class="grid gap-3 pr-6 sm:grid-cols-2">
                                        <div>
                                            <label class="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Asset Type</label>
                                            <select v-model="item.asset_type" class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                                <option value="">Select type…</option>
                                                <option v-for="t in assetTypes" :key="t" :value="t">{{ t }}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Estimated Value</label>
                                            <input v-model.number="item.estimated_value" type="number" min="0" step="0.01" placeholder="0.00" class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                        </div>
                                        <div class="sm:col-span-2">
                                            <label class="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Description</label>
                                            <input v-model="item.description" type="text" placeholder="e.g. Title deed ref. LR1234…" class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <button type="button" class="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300" @click="prevStep">
                                <ArrowLeft class="h-4 w-4" /> Back
                            </button>
                            <button type="button" :disabled="!step2Valid" class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors disabled:opacity-40" @click="nextStep">
                                Next: Docs & Submit <ChevronRight class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-col gap-6">
                        <LoanFormRepaymentPreview :schedule-preview="schedulePreview" :preview-loading="previewLoading" />
                    </div>
                </div>

                <!-- Step 3 -->
                <div v-show="currentStep === 3" class="flex flex-col gap-6">
                    <LoanGuarantorManager v-if="form.id" :application-id="form.id" :min-guarantors="minGuarantors" :applicant-member-id="form.member_id" :editable="true" @adequacy-change="(v) => { guarantorsAdequate = v }" />
                    <LoanDocumentUploader v-if="form.id" :application-id="form.id" :editable="true" />
                    <LoanEligibilityPanel :result="eligibilityResult" :loading="eligibilityLoading" :ready="eligibilityReady" @retry="triggerEligibilityCheck" />
                    <div class="flex items-center justify-between">
                        <button type="button" class="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300" @click="prevStep">
                            <ArrowLeft class="h-4 w-4" /> Back
                        </button>
                        <div class="flex items-center gap-3">
                            <button type="button" class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300" @click="router.back()">Cancel</button>
                            <button type="submit" :disabled="saving" class="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                <Save class="h-4 w-4" />{{ saving ? 'Saving…' : 'Save Draft' }}
                            </button>
                            <button v-if="form.status === 'draft'" type="button" :disabled="submitting || !canSubmit"
                                class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:bg-nfuko-primary/90 disabled:opacity-50 dark:bg-bg-nfuko-yellow dark:text-black"
                                @click="submit">
                                <Send class="h-4 w-4" />{{ submitting ? 'Submitting…' : 'Submit Application' }}
                            </button>
                        </div>
                    </div>
                </div>

            </form>
        </template>
    </div>
</template>
