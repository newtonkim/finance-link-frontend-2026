<script setup lang="ts">
import { ref, watch } from 'vue'
import { ThumbsUp, ThumbsDown, XCircle } from 'lucide-vue-next'

const props = defineProps<{
    open: boolean
    submitting: boolean
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

function handleSubmit() {
    commentError.value = ''
    emit('submit', decision.value, comment.value.trim())
}
</script>

<template>
    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
        leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="open"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @mousedown.self="emit('close')">
            <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100" appear>
                <div class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
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
                    <div class="px-6 py-5">
                        <!-- Decision selector -->
                        <div class="mb-4">
                            <label class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Decision</label>
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
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Comment <span class="text-neutral-400 font-normal">(optional)</span>
                            </label>
                            <textarea v-model="comment" rows="3" placeholder="Add any comments about your decision…"
                                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                :class="commentError ? 'border-red-300 dark:border-red-700' : ''" />
                            <p v-if="commentError" class="mt-1 text-xs text-red-500">{{ commentError }}</p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            @click="emit('close')">Cancel</button>
                        <button :disabled="submitting"
                            class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            :class="decision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'"
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
