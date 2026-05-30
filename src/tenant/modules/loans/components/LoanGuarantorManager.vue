<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { UserPlus, Trash2, CheckCircle, XCircle, Loader2, Search, X } from 'lucide-vue-next'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'
import { tenantClient } from '../../../apis/tenantClient'

interface GuarantorMember {
    id: number
    name: string
    member_no: string
    savings_account: { account_no: string; balance: number } | null
}

interface Guarantor {
    id: number
    member_id: number
    member: { id: number; name: string; member_no: string } | null
    guarantee_amount: number
    guarantee_amount_formatted: string
    notes: string | null
    created_at: string
}

interface AdequacyResult {
    adequate: boolean
    required: number
    actual: number
    remaining_needed: number
}

const props = defineProps<{
    applicationId: number
    minGuarantors: number
    applicantMemberId: number | null | undefined
    /** Show add form — false on show/read-only page */
    editable?: boolean
}>()

const emit = defineEmits<{ (e: 'adequacy-change', adequate: boolean): void }>()

// ─── State ────────────────────────────────────────────────────────────────────
const guarantors   = ref<Guarantor[]>([])
const adequacy     = ref<AdequacyResult | null>(null)
const listLoading  = ref(false)
const removing     = ref<number | null>(null)

// ─── Add form ─────────────────────────────────────────────────────────────────
const memberSearch       = ref('')
const showMemberDropdown = ref(false)
const memberLoading      = ref(false)
const memberOptions      = ref<GuarantorMember[]>([])
const selectedMember     = ref<GuarantorMember | null>(null)
const guaranteeAmount    = ref<string>('')
const notes              = ref('')
const adding             = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ─── Load guarantors ──────────────────────────────────────────────────────────
async function load() {
    listLoading.value = true
    try {
        const res = await loanApplicationsApi.listGuarantors(props.applicationId)
        guarantors.value = res.data?.data ?? []
        adequacy.value   = { adequate: res.data?.adequate, ...res.data }
        emit('adequacy-change', res.data?.adequate ?? false)
    } catch {
        toast.error('Failed to load guarantors.')
    } finally {
        listLoading.value = false
    }
}

// ─── Member search ────────────────────────────────────────────────────────────
async function searchMembers(q: string) {
    memberLoading.value = true
    try {
        const res = await tenantClient.get('/loan-applications/member-search', {
            params: q ? { search: q } : undefined,
        })
        memberOptions.value = (res.data?.data ?? []).filter(
            (m: GuarantorMember) => m.id !== props.applicantMemberId
        )
    } catch {
        // silently fail
    } finally {
        memberLoading.value = false
    }
}

function onSearchInput() {
    showMemberDropdown.value = true
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => searchMembers(memberSearch.value.trim()), 350)
}

function selectMember(m: GuarantorMember) {
    selectedMember.value     = m
    memberSearch.value       = ''
    showMemberDropdown.value = false
}

function clearSelection() {
    selectedMember.value  = null
    guaranteeAmount.value = ''
    notes.value           = ''
}

// ─── Add guarantor ────────────────────────────────────────────────────────────
async function addGuarantor() {
    if (!selectedMember.value) return
    const amount = parseFloat(guaranteeAmount.value.replace(/,/g, ''))
    if (isNaN(amount) || amount < 0) {
        toast.error('Enter a valid guarantee amount.')
        return
    }

    adding.value = true
    try {
        await loanApplicationsApi.addGuarantor(props.applicationId, {
            member_id:        selectedMember.value.id,
            guarantee_amount: amount,
            notes:            notes.value || undefined,
        })
        toast.success('Guarantor added.')
        clearSelection()
        await load()
    } catch (err: any) {
        const msg = err?.response?.data?.errors?.member_id?.[0]
            ?? err?.response?.data?.message
            ?? 'Failed to add guarantor.'
        toast.error(msg)
    } finally {
        adding.value = false
    }
}

// ─── Remove guarantor ─────────────────────────────────────────────────────────
async function removeGuarantor(g: Guarantor) {
    removing.value = g.id
    try {
        await loanApplicationsApi.removeGuarantor(props.applicationId, g.id)
        toast.success('Guarantor removed.')
        await load()
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to remove guarantor.')
    } finally {
        removing.value = null
    }
}

// ─── Computed ─────────────────────────────────────────────────────────────────
const alreadyAdded = computed(() =>
    selectedMember.value
        ? guarantors.value.some(g => g.member_id === selectedMember.value!.id)
        : false
)

function handleBlur() {
    setTimeout(() => {
        showMemberDropdown.value = false
    }, 200)
}

// ─── Init ─────────────────────────────────────────────────────────────────────
watch(() => props.applicationId, load, { immediate: true })
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mb-4 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Guarantors</h3>
            <!-- Adequacy badge -->
            <span v-if="adequacy" :class="[
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                adequacy.adequate
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
            ]">
                <CheckCircle v-if="adequacy.adequate" class="h-3 w-3" />
                <XCircle v-else class="h-3 w-3" />
                {{ adequacy.actual }} / {{ adequacy.required }} required
            </span>
        </div>

        <!-- Loading skeleton -->
        <div v-if="listLoading" class="space-y-2">
            <div v-for="n in 2" :key="n" class="h-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        </div>

        <!-- Guarantor list -->
        <ul v-else-if="guarantors.length" class="mb-4 divide-y divide-neutral-100 dark:divide-neutral-800">
            <li v-for="g in guarantors" :key="g.id"
                class="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div class="min-w-0">
                    <p class="font-medium text-neutral-900 dark:text-white truncate">
                        {{ g.member?.name ?? '—' }}
                    </p>
                    <p class="text-xs text-neutral-400 dark:text-neutral-500">
                        {{ g.member?.member_no }}
                        <span v-if="g.guarantee_amount" class="ml-2 font-medium text-neutral-600 dark:text-neutral-300">
                            {{ g.guarantee_amount_formatted }}
                        </span>
                    </p>
                </div>
                <button v-if="editable"
                    :disabled="removing === g.id"
                    class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                    @click="removeGuarantor(g)">
                    <Loader2 v-if="removing === g.id" class="h-4 w-4 animate-spin" />
                    <Trash2 v-else class="h-4 w-4" />
                </button>
            </li>
        </ul>

        <p v-else-if="!listLoading && !editable"
            class="mb-4 text-sm text-neutral-400 dark:text-neutral-500">
            No guarantors added.
        </p>

        <!-- Add guarantor form (editable mode only) -->
        <template v-if="editable">
            <div class="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <!-- Selected member card -->
                <div v-if="selectedMember"
                    class="mb-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800 dark:bg-emerald-900/20">
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-emerald-800 dark:text-emerald-300 truncate">
                            {{ selectedMember.name }}
                        </p>
                        <p class="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                            {{ selectedMember.member_no }}
                            <span v-if="selectedMember.savings_account">
                                · Savings: {{ selectedMember.savings_account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </span>
                        </p>
                    </div>
                    <button @click="clearSelection" class="rounded-full p-1 hover:bg-emerald-100 dark:hover:bg-emerald-800">
                        <X class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </button>
                </div>

                <!-- Member search input -->
                <div v-else class="relative mb-3">
                    <div class="relative">
                        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                            v-model="memberSearch"
                            type="text"
                            placeholder="Search member to add as guarantor…"
                            class="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                            @input="onSearchInput"
                            @focus="showMemberDropdown = true"
                            @blur="handleBlur"
                        />
                    </div>
                    <div v-if="showMemberDropdown"
                        class="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div v-if="memberLoading" class="flex items-center gap-2 px-4 py-3 text-sm text-neutral-400">
                            <Loader2 class="h-4 w-4 animate-spin" /> Searching…
                        </div>
                        <ul v-else>
                            <li v-for="m in memberOptions" :key="m.id"
                                class="cursor-pointer px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                @mousedown.prevent="selectMember(m)">
                                <p class="font-medium text-neutral-900 dark:text-white">{{ m.name }}</p>
                                <p class="text-xs text-neutral-400">
                                    {{ m.member_no }}
                                    <span v-if="m.savings_account" class="ml-1">
                                        · {{ m.savings_account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                                    </span>
                                </p>
                            </li>
                            <li v-if="!memberOptions.length"
                                class="px-4 py-6 text-center text-sm text-neutral-400">
                                No members found
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Amount + add button -->
                <div v-if="selectedMember" class="flex gap-2">
                    <input
                        v-model="guaranteeAmount"
                        type="text"
                        inputmode="decimal"
                        placeholder="Guarantee amount"
                        class="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                    <button
                        :disabled="adding || alreadyAdded"
                        class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 flex items-center gap-1.5 rounded-xl  px-4 py-2 text-sm font-medium text-white transition hover:/90 disabled:opacity-50 dark:bg-bg-nfuko-yellow dark:text-black"
                        @click="addGuarantor"
                    >
                        <Loader2 v-if="adding" class="h-4 w-4 animate-spin" />
                        <UserPlus v-else class="h-4 w-4" />
                        {{ adding ? 'Adding…' : alreadyAdded ? 'Already added' : 'Add' }}
                    </button>
                </div>
            </div>
        </template>
    </div>
</template>
