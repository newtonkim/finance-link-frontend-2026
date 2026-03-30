<script setup lang="ts">
import {
    XCircle, ClipboardCheck, FileSearch, Users, Undo2,
    XCircle as XCircleIcon, ThumbsUp, ThumbsDown,
} from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'

// ─── Cancel modal (from useLoanApplicationShow) ───────────────────────────────
const props = defineProps<{
    // Cancel
    showCancelModal: boolean
    cancelReasonError: string
    cancelling: boolean
    // Appraise
    showAppraiseModal: boolean
    appraising: boolean
    appraiseForm: { recommended_amount: string | number; recommended_term: string | number; risk_rating: string; appraisal_notes?: string }
    appraiseErrors: Record<string, string>
    // Request Docs
    showRequestDocsModal: boolean
    requestingDocs: boolean
    requestDocsError: string
    // Request Guarantors
    showRequestGuarantorsModal: boolean
    requestingGuarantors: boolean
    requestGuarantorsError: string
    // Return
    showReturnModal: boolean
    returning: boolean
    returnError: string
    // Reject
    showRejectModal: boolean
    rejecting: boolean
    rejectError: string
    // Approve
    showApproveModal: boolean
    approving: boolean
    // Decline
    showDeclineModal: boolean
    declining: boolean
    declineError: string
}>()

const emit = defineEmits<{
    cancelClose: []
    cancelConfirm: []
    appraiseClose: []
    appraiseSubmit: []
    requestDocsClose: []
    requestDocsSubmit: []
    requestGuarantorsClose: []
    requestGuarantorsSubmit: []
    returnClose: []
    returnSubmit: []
    rejectClose: []
    rejectSubmit: []
    approveClose: []
    approveSubmit: []
    declineClose: []
    declineSubmit: []
}>()

// Two-way text field models
const cancelReason         = defineModel<string>('cancelReason', { default: '' })
const requestDocsNote      = defineModel<string>('requestDocsNote', { default: '' })
const requestGuarantorsNote = defineModel<string>('requestGuarantorsNote', { default: '' })
const returnReason         = defineModel<string>('returnReason', { default: '' })
const rejectReason         = defineModel<string>('rejectReason', { default: '' })
const approveComments      = defineModel<string>('approveComments', { default: '' })
const declineReason        = defineModel<string>('declineReason', { default: '' })

const { riskBadgeClass } = useLoanApplicationHelpers()

const modalBase = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'
const cardBase  = 'w-full rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900'
const inputBase = 'mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
const btnCancel = 'rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
</script>

<template>
    <Teleport to="body">

        <!-- ── Cancel modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showCancelModal" :class="modalBase" @mousedown.self="emit('cancelClose')">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div :class="[cardBase, 'max-w-md']">
                        <div class="flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex items-center gap-2">
                                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                                    <XCircle class="h-5 w-5 text-red-500 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Cancel Application</h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">This will stop the application process.</p>
                                </div>
                            </div>
                            <button class="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800" @click="emit('cancelClose')">
                                <XCircle class="h-4 w-4" />
                            </button>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-400">*</span></label>
                            <textarea v-model="cancelReason" rows="4" placeholder="e.g. Member failed to provide required payslips…"
                                :class="[inputBase, cancelReasonError ? 'border-red-300 dark:border-red-700' : '']"
                                @keydown.esc="emit('cancelClose')" />
                            <p v-if="cancelReasonError" class="mt-1 text-xs text-red-500">{{ cancelReasonError }}</p>
                            <p class="mt-1 text-right text-xs text-neutral-400">{{ cancelReason.length }} / 500</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button :class="btnCancel" @click="emit('cancelClose')">Keep</button>
                            <button :disabled="cancelling || !cancelReason.trim()"
                                class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                                @click="emit('cancelConfirm')">
                                <XCircle class="h-4 w-4" />{{ cancelling ? 'Cancelling…' : 'Confirm Cancellation' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Appraise modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showAppraiseModal" :class="modalBase" @mousedown.self="emit('appraiseClose')">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div :class="[cardBase, 'max-w-lg']">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-nfuko-primary/10">
                                <ClipboardCheck class="h-5 w-5 text-nfuko-primary" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Appraise & Recommend</h3>
                                <p class="text-xs text-neutral-500">Set recommended terms and risk rating.</p>
                            </div>
                        </div>
                        <div class="grid gap-4 px-6 py-5 sm:grid-cols-2">
                            <div>
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Recommended Amount <span class="text-red-400">*</span></label>
                                <input v-model="appraiseForm.recommended_amount" type="number" min="1" placeholder="0.00"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="appraiseErrors.recommended_amount ? 'border-red-300' : ''" />
                                <p v-if="appraiseErrors.recommended_amount" class="mt-1 text-xs text-red-500">{{ appraiseErrors.recommended_amount }}</p>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Recommended Term (months) <span class="text-red-400">*</span></label>
                                <input v-model="appraiseForm.recommended_term" type="number" min="1" placeholder="12"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="appraiseErrors.recommended_term ? 'border-red-300' : ''" />
                                <p v-if="appraiseErrors.recommended_term" class="mt-1 text-xs text-red-500">{{ appraiseErrors.recommended_term }}</p>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Risk Rating <span class="text-red-400">*</span></label>
                                <div class="mt-1.5 grid grid-cols-4 gap-2">
                                    <button v-for="r in ['low', 'medium', 'high', 'critical']" :key="r" type="button"
                                        class="rounded-xl border px-3 py-2 text-xs font-medium capitalize transition-colors"
                                        :class="appraiseForm.risk_rating === r
                                            ? riskBadgeClass(r) + ' border-current'
                                            : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700'"
                                        @click="appraiseForm.risk_rating = r">
                                        {{ r }}
                                    </button>
                                </div>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Appraisal Notes</label>
                                <textarea v-model="appraiseForm.appraisal_notes" rows="3" placeholder="Optional notes…"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            </div>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button :class="btnCancel" @click="emit('appraiseClose')">Cancel</button>
                            <button :disabled="appraising" class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50" @click="emit('appraiseSubmit')">
                                <ClipboardCheck class="h-4 w-4" />{{ appraising ? 'Saving…' : 'Appraise & Recommend' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Request Documents modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showRequestDocsModal" :class="modalBase" @mousedown.self="emit('requestDocsClose')">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div :class="[cardBase, 'max-w-md']">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                                <FileSearch class="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Request Documents</h3>
                                <p class="text-xs text-neutral-500">Specify which documents are needed.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Note <span class="text-red-400">*</span></label>
                            <textarea v-model="requestDocsNote" rows="4" placeholder="e.g. Please provide the last 3 months' payslips and bank statements…"
                                :class="[inputBase, requestDocsError ? 'border-red-300' : '']" />
                            <p v-if="requestDocsError" class="mt-1 text-xs text-red-500">{{ requestDocsError }}</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button :class="btnCancel" @click="emit('requestDocsClose')">Cancel</button>
                            <button :disabled="requestingDocs" class="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50" @click="emit('requestDocsSubmit')">
                                <FileSearch class="h-4 w-4" />{{ requestingDocs ? 'Saving…' : 'Request Documents' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Request Guarantors modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showRequestGuarantorsModal" :class="modalBase" @mousedown.self="emit('requestGuarantorsClose')">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div :class="[cardBase, 'max-w-md']">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                                <Users class="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Request Guarantors</h3>
                                <p class="text-xs text-neutral-500">Specify what guarantors are required.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Note <span class="text-red-400">*</span></label>
                            <textarea v-model="requestGuarantorsNote" rows="4" placeholder="e.g. At least 2 guarantors are required, each guaranteeing a minimum of KES 50,000…"
                                :class="[inputBase, requestGuarantorsError ? 'border-red-300' : '']" />
                            <p v-if="requestGuarantorsError" class="mt-1 text-xs text-red-500">{{ requestGuarantorsError }}</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button :class="btnCancel" @click="emit('requestGuarantorsClose')">Cancel</button>
                            <button :disabled="requestingGuarantors" class="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50" @click="emit('requestGuarantorsSubmit')">
                                <Users class="h-4 w-4" />{{ requestingGuarantors ? 'Saving…' : 'Request Guarantors' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Return for Correction modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showReturnModal" :class="modalBase" @mousedown.self="emit('returnClose')">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div :class="[cardBase, 'max-w-md']">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30">
                                <Undo2 class="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Return for Correction</h3>
                                <p class="text-xs text-neutral-500">Application will go back to draft for the member to fix.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-400">*</span></label>
                            <textarea v-model="returnReason" rows="4" placeholder="e.g. The requested amount exceeds the member's eligible limit…"
                                :class="[inputBase, returnError ? 'border-red-300' : '']" />
                            <p v-if="returnError" class="mt-1 text-xs text-red-500">{{ returnError }}</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button :class="btnCancel" @click="emit('returnClose')">Cancel</button>
                            <button :disabled="returning" class="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50" @click="emit('returnSubmit')">
                                <Undo2 class="h-4 w-4" />{{ returning ? 'Returning…' : 'Return for Correction' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Reject modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showRejectModal" :class="modalBase" @mousedown.self="emit('rejectClose')">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div :class="[cardBase, 'max-w-md']">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                                <XCircleIcon class="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Reject Application</h3>
                                <p class="text-xs text-neutral-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-400">*</span></label>
                            <textarea v-model="rejectReason" rows="4" placeholder="e.g. Member does not meet the minimum savings threshold…"
                                :class="[inputBase, rejectError ? 'border-red-300' : '']" />
                            <p v-if="rejectError" class="mt-1 text-xs text-red-500">{{ rejectError }}</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button :class="btnCancel" @click="emit('rejectClose')">Cancel</button>
                            <button :disabled="rejecting" class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50" @click="emit('rejectSubmit')">
                                <XCircleIcon class="h-4 w-4" />{{ rejecting ? 'Rejecting…' : 'Confirm Rejection' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Approve modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showApproveModal" :class="modalBase" @mousedown.self="emit('approveClose')">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div :class="[cardBase, 'max-w-md']">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30">
                                <ThumbsUp class="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Approve Application</h3>
                                <p class="text-xs text-neutral-500">Record your approval vote.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Comments <span class="text-neutral-400 font-normal">(optional)</span></label>
                            <textarea v-model="approveComments" rows="3" placeholder="Any comments on your approval…" :class="inputBase" />
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button :class="btnCancel" @click="emit('approveClose')">Cancel</button>
                            <button :disabled="approving" class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50" @click="emit('approveSubmit')">
                                <ThumbsUp class="h-4 w-4" />{{ approving ? 'Saving…' : 'Confirm Approval' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Decline modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showDeclineModal" :class="modalBase" @mousedown.self="emit('declineClose')">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div :class="[cardBase, 'max-w-md']">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                                <ThumbsDown class="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Decline Application</h3>
                                <p class="text-xs text-neutral-500">This will move the application to rejected.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-400">*</span></label>
                            <textarea v-model="declineReason" rows="4" placeholder="e.g. Application does not meet the credit committee's requirements…"
                                :class="[inputBase, declineError ? 'border-red-300' : '']" />
                            <p v-if="declineError" class="mt-1 text-xs text-red-500">{{ declineError }}</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button :class="btnCancel" @click="emit('declineClose')">Cancel</button>
                            <button :disabled="declining" class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50" @click="emit('declineSubmit')">
                                <ThumbsDown class="h-4 w-4" />{{ declining ? 'Saving…' : 'Confirm Decline' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

    </Teleport>
</template>
