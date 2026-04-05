<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Vote, ArrowRight, Clock, Users, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'
import { formatMoneyValue } from '@/Global'

const router = useRouter()

const loading = ref(false)
const applications = ref<any[]>([])

async function load() {
    loading.value = true
    try {
        const res = await loanApplicationsApi.list({ status: 'committee_voting', per_page: 50 })
        applications.value = res.data?.data ?? res.data ?? []
    } catch {
        // silently fail — list will show empty state
    } finally {
        loading.value = false
    }
}

onMounted(load)

const pendingMyVote = computed(() =>
    applications.value.filter((a: any) => !a.has_voted)
)
const alreadyVoted = computed(() =>
    applications.value.filter((a: any) => a.has_voted)
)

function formatAmount(formatted: string | null | undefined, raw: any) {
    if (formatted) return formatted
    if (raw == null || raw === '') return '—'
    return formatMoneyValue(raw)
}

function formatDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Vote class="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Pending Votes</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        Loan applications awaiting your committee vote.
                    </p>
                </div>
            </div>
            <button
                class="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                :disabled="loading"
                @click="load"
            >
                <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
                Refresh
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">
            Loading…
        </div>

        <template v-else>
            <!-- Awaiting my vote -->
            <div>
                <div class="mb-3 flex items-center gap-2">
                    <div class="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
                        <Clock class="h-3 w-3 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h2 class="text-sm font-semibold text-neutral-900 dark:text-white">
                        Awaiting your vote
                        <span class="ml-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                            {{ pendingMyVote.length }}
                        </span>
                    </h2>
                </div>

                <div
                    v-if="!pendingMyVote.length"
                    class="rounded-2xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
                >
                    No applications waiting for your vote.
                </div>

                <div v-else class="space-y-3">
                    <div
                        v-for="app in pendingMyVote"
                        :key="app.id"
                        class="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-violet-900/30 dark:bg-neutral-900 dark:hover:border-violet-700"
                        @click="router.push({ name: 'tenant-loans-show', params: { id: app.id } })"
                    >
                        <div class="flex items-center gap-3">
                            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                                <Users class="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-neutral-900 dark:text-white">
                                    {{ app.application_no }}
                                    <span v-if="app.member" class="ml-1.5 text-xs font-normal text-neutral-500">— {{ app.member.name }}</span>
                                </p>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    {{ formatAmount(app.recommended_amount_formatted, app.recommended_amount) }}
                                    · {{ app.recommended_term }} months
                                    · {{ app.loan_product?.name ?? '—' }}
                                </p>
                            </div>
                        </div>
                        <div class="flex shrink-0 items-center gap-3">
                            <!-- Votes cast / quorum -->
                            <div class="hidden sm:block text-right">
                                <p class="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                    {{ app.votes_cast ?? 0 }}<span class="text-neutral-400">/{{ app.quorum_required ?? '?' }}</span>
                                </p>
                                <p class="text-[10px] text-neutral-400">votes cast</p>
                            </div>
                            <span class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                Vote pending
                            </span>
                            <ArrowRight class="h-4 w-4 text-neutral-400" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Already voted -->
            <div v-if="alreadyVoted.length">
                <div class="mb-3 flex items-center gap-2">
                    <div class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                        <CheckCircle2 class="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 class="text-sm font-semibold text-neutral-900 dark:text-white">
                        Already voted
                        <span class="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                            {{ alreadyVoted.length }}
                        </span>
                    </h2>
                </div>

                <div class="space-y-2">
                    <div
                        v-for="app in alreadyVoted"
                        :key="app.id"
                        class="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-4 opacity-70 transition-opacity hover:opacity-100 dark:border-neutral-800 dark:bg-neutral-900"
                        @click="router.push({ name: 'tenant-loans-show', params: { id: app.id } })"
                    >
                        <div class="flex items-center gap-3">
                            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                                <Users class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-neutral-900 dark:text-white">
                                    {{ app.application_no }}
                                    <span v-if="app.member" class="ml-1.5 text-xs font-normal text-neutral-500">— {{ app.member.name }}</span>
                                </p>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    {{ formatAmount(app.recommended_amount_formatted, app.recommended_amount) }}
                                    · {{ app.recommended_term }} months
                                </p>
                            </div>
                        </div>
                        <div class="flex shrink-0 items-center gap-2">
                            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <CheckCircle2 class="h-3 w-3" />
                                Voted
                            </span>
                            <ArrowRight class="h-4 w-4 text-neutral-400" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fully empty state -->
            <div
                v-if="!pendingMyVote.length && !alreadyVoted.length"
                class="flex flex-col items-center justify-center gap-3 py-24 text-center"
            >
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                    <Vote class="h-7 w-7 text-violet-500" />
                </div>
                <p class="text-sm font-semibold text-neutral-900 dark:text-white">No pending votes</p>
                <p class="max-w-xs text-xs text-neutral-500 dark:text-neutral-400">
                    Applications in committee voting will appear here. Check back once a loan has been recommended for committee review.
                </p>
            </div>
        </template>
    </div>
</template>
