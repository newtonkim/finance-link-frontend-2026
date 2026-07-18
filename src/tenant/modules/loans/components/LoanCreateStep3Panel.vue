<script setup lang="ts">
import { ArrowLeft, Save, Send, Shield, Calculator } from 'lucide-vue-next'
import LoanEligibilityPanel from './LoanEligibilityPanel.vue'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import { licenseState } from '@/tenant/apis/licenseState'

defineProps<{
    form: any
    selectedMember: any
    selectedProduct: any
    collateralItems: any[]
    schedulePreview: any
    eligibilityResult: any
    eligibilityLoading: boolean
    eligibilityReady: boolean
    saving: boolean
    submitting: boolean
    canSubmit: boolean
}>()

const emit = defineEmits<{
    prev: []
    goToStep: [n: number]
    save: []
    saveAndSubmit: []
    retryEligibility: []
}>()

const { formatAmount } = useLoanApplicationHelpers()
</script>

<template>
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div class="flex flex-col gap-6">
            <!-- Application Summary -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Application Summary</h2>
                <dl class="grid gap-2 text-sm">
                    <div class="flex justify-between gap-2 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
                        <dt class="text-neutral-500">Member</dt>
                        <dd class="text-right font-medium text-neutral-900 dark:text-white">{{ selectedMember?.name ?? '—' }} <span v-if="selectedMember?.member_no" class="text-xs text-neutral-400">({{ selectedMember.member_no }})</span></dd>
                    </div>
                    <div class="flex justify-between gap-2 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
                        <dt class="text-neutral-500">Loan Product</dt>
                        <dd class="text-right font-medium text-neutral-900 dark:text-white">{{ selectedProduct?.name ?? '—' }} <span v-if="selectedProduct?.code" class="text-xs text-neutral-400">{{ selectedProduct.code }}</span></dd>
                    </div>
                    <div class="flex justify-between gap-2 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
                        <dt class="text-neutral-500">Requested Amount</dt>
                        <dd class="font-semibold text-nfuko-primary dark:text-bg-nfuko-yellow">{{ formatAmount(form.requested_amount) }}</dd>
                    </div>
                    <div class="flex justify-between gap-2 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
                        <dt class="text-neutral-500">Requested Term</dt>
                        <dd class="font-medium text-neutral-900 dark:text-white">{{ form.requested_term ?? '—' }} <span v-if="selectedProduct?.duration_type" class="text-xs text-neutral-400">{{ selectedProduct.duration_type }}</span></dd>
                    </div>
                    <div v-if="form.purpose" class="flex justify-between gap-2 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
                        <dt class="shrink-0 text-neutral-500">Purpose</dt>
                        <dd class="max-w-xs text-right font-medium text-neutral-900 dark:text-white">{{ form.purpose }}</dd>
                    </div>
                </dl>
                <button type="button" class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 mt-3 text-xs text-nfuko-primary hover:underline dark:text-bg-nfuko-yellow" @click="emit('goToStep', 1)">Edit details</button>
            </div>

            <!-- Collateral summary -->
            <div v-if="collateralItems.length" class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Shield class="h-4 w-4 text-neutral-400" />
                        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Collateral & Securities</h3>
                        <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800">{{ collateralItems.length }} item{{ collateralItems.length !== 1 ? 's' : '' }}</span>
                    </div>
                    <button type="button" class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 text-xs text-nfuko-primary hover:underline dark:text-bg-nfuko-yellow" @click="emit('goToStep', 2)">Edit</button>
                </div>
                <div class="space-y-2">
                    <div v-for="(item, idx) in collateralItems" :key="idx" class="flex items-start gap-3 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
                        <Shield class="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                        <div class="min-w-0 flex-1">
                            <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ item.asset_type }}</p>
                            <p v-if="item.description" class="mt-0.5 truncate text-xs text-neutral-500">{{ item.description }}</p>
                            <p v-if="item.estimated_value" class="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">Est. value: {{ formatAmount(item.estimated_value) }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Nav + actions -->
            <div class="flex items-center justify-between">
                <button type="button" class="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300" @click="emit('prev')">
                    <ArrowLeft class="h-4 w-4" /> Back
                </button>
                <div class="flex items-center gap-3">
                    <button type="submit" :disabled="saving || submitting || licenseState.readOnly"
                        :title="licenseState.readOnly ? 'License expired — renew to save' : ''"
                        class="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-[#052659]/90 transition-colors disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        <Save class="h-4 w-4" />{{ saving ? 'Saving…' : 'Save Draft' }}
                    </button>
                    <button type="button" :disabled="submitting || saving || !canSubmit || licenseState.readOnly"
                        :title="licenseState.readOnly ? 'License expired — renew to submit' : ''"
                        class="flex items-center gap-2 rounded-xl bg-[#052659] px-4 py-2 text-sm font-medium text-white hover:bg-[#052659]/90 transition-colors disabled:opacity-50 dark:bg-bg-nfuko-yellow dark:text-black" @click="emit('saveAndSubmit')">
                        <Send class="h-4 w-4" />{{ submitting ? 'Submitting…' : 'Save & Submit' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Right: eligibility + schedule summary -->
        <div class="flex flex-col gap-6">
            <LoanEligibilityPanel :result="eligibilityResult" :loading="eligibilityLoading" :ready="eligibilityReady" :product-max-amount="selectedProduct?.max_amount ?? null" @retry="emit('retryEligibility')" />
            <div v-if="schedulePreview" class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div class="mb-4 flex items-center gap-2">
                    <Calculator class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                    <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Repayment Summary</h3>
                </div>
                <div class="grid grid-cols-3 gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                    <div class="text-center">
                        <p class="text-xs text-neutral-500">Installment</p>
                        <p class="mt-0.5 text-sm font-bold text-neutral-900 dark:text-white">{{ formatAmount(schedulePreview.installment_amount) }}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-xs text-neutral-500">Total Interest</p>
                        <p class="mt-0.5 text-sm font-bold text-neutral-900 dark:text-white">{{ formatAmount(schedulePreview.total_interest) }}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-xs text-neutral-500">Total Repay</p>
                        <p class="mt-0.5 text-sm font-bold text-nfuko-primary dark:text-bg-nfuko-yellow">{{ formatAmount(schedulePreview.total_repayment) }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
