<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ThumbsUp, ThumbsDown, Check, Minus } from 'lucide-vue-next'

interface CommitteeMember {
    id: number
    name: string
    has_voted: boolean
    decision?: 'approve' | 'decline' | null
    abstained?: boolean
}

const props = defineProps<{
    open: boolean
    submitting: boolean
    committeeMembers?: CommitteeMember[]
}>()

const emit = defineEmits<{
    close: []
    submit: [decision: 'approve' | 'decline', comment: string]
}>()

const decision = ref<'approve' | 'decline'>('approve')
const comment = ref('')
const commentError = ref('')

watch(() => props.open, (isOpen) => {
    if (isOpen) {
        decision.value = 'approve'
        comment.value = ''
        commentError.value = ''
    }
})

const votedCount = computed(() => props.committeeMembers?.filter(m => m.has_voted).length ?? 0)
const totalCount = computed(() => props.committeeMembers?.length ?? 0)

function handleSubmit() {
    commentError.value = ''
    emit('submit', decision.value, comment.value.trim())
}
</script>

<template>
    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="open"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @mousedown.self="emit('close')">
            <Transition enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                <div class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">

                    <!-- Header -->
                    <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <div class="flex h-9 w-9 items-center justify-center rounded-xl"
                            :class="decision === 'approve' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'">
                            <ThumbsUp v-if="decision === 'approve'" class="h-5 w-5 text-green-600" />
                            <ThumbsDown v-else class="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Cast Your Vote</h3>
                            <p class="text-xs text-neutral-500">Select your decision and add an optional comment.</p>
                        </div>
                    </div>

                    <div class="px-6 py-5 space-y-4">

                        <!-- Committee member roster -->
                        <div v-if="committeeMembers && committeeMembers.length">
                            <div class="mb-2 flex items-center justify-between">
                                <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Committee voters</span>
                                <span class="text-xs font-semibold text-violet-600 dark:text-violet-400">
                                    {{ votedCount }}/{{ totalCount }} voted
                                </span>
                            </div>
                            <div class="divide-y divide-neutral-100 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-700 overflow-hidden">
                                <div v-for="member in committeeMembers" :key="member.id"
                                    class="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-neutral-800/40">
                                    <!-- Avatar + name -->
                                    <div class="flex items-center gap-2.5">
                                        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                                            :class="member.has_voted
                                                ? (member.abstained ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                                                    : member.decision === 'approve' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400')
                                                : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500'">
                                            {{ member.name.charAt(0).toUpperCase() }}
                                        </div>
                                        <span class="text-sm text-neutral-800 dark:text-neutral-200">{{ member.name }}</span>
                                    </div>
                                    <!-- Vote status badge -->
                                    <div class="flex items-center gap-1.5">
                                        <template v-if="member.has_voted">
                                            <template v-if="member.abstained">
                                                <Minus class="h-3.5 w-3.5 text-neutral-400" />
                                                <span class="text-xs font-medium text-neutral-400">Abstained</span>
                                            </template>
                                            <template v-else-if="member.decision === 'approve'">
                                                <Check class="h-3.5 w-3.5 text-green-500" />
                                                <span class="text-xs font-semibold text-green-600 dark:text-green-400">Approved</span>
                                            </template>
                                            <template v-else>
                                                <ThumbsDown class="h-3.5 w-3.5 text-red-500" />
                                                <span class="text-xs font-semibold text-red-500 dark:text-red-400">Declined</span>
                                            </template>
                                        </template>
                                        <template v-else>
                                            <span class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Decision selector -->
                        <div>
                            <label class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Your Decision</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button type="button"
                                    class="flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors"
                                    :class="decision === 'approve'
                                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400'"
                                    @click="decision = 'approve'">
                                    <ThumbsUp class="h-4 w-4" />
                                    Approve
                                </button>
                                <button type="button"
                                    class="flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors"
                                    :class="decision === 'decline'
                                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400'"
                                    @click="decision = 'decline'">
                                    <ThumbsDown class="h-4 w-4" />
                                    Decline
                                </button>
                            </div>
                        </div>

                        <!-- Comment -->
                        <div>
                            <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                Comment <span class="text-neutral-400 font-normal">(optional)</span>
                            </label>
                            <textarea v-model="comment" rows="3"
                                placeholder="Add any comments about your decision…"
                                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                :class="commentError ? 'border-red-300 dark:border-red-700' : ''" />
                            <p v-if="commentError" class="mt-1 text-xs text-red-500">{{ commentError }}</p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <button
                            class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            @click="emit('close')">Cancel</button>
                        <button :disabled="submitting"
                            class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            :class="decision === 'approve' ? 'bg-green-600 hover:bg-[#052659]/90 : 'bg-red-500 hover:bg-[#052659]/90
                            @click="handleSubmit">
                            <ThumbsUp v-if="decision === 'approve'" class="h-4 w-4" />
                            <ThumbsDown v-else class="h-4 w-4" />
                            {{ submitting ? 'Submitting…' : decision === 'approve' ? 'Confirm Approval' : 'Confirm Decline' }}
                        </button>
                    </div>

                </div>
            </Transition>
        </div>
    </Transition>
</template>
