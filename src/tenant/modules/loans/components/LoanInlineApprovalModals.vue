<script setup lang="ts">
import { ThumbsUp, ThumbsDown } from 'lucide-vue-next'

const showApproveModal = defineModel<boolean>('showApproveModal', { default: false })
const approveComments  = defineModel<string>('approveComments', { default: '' })
const showDeclineModal = defineModel<boolean>('showDeclineModal', { default: false })
const declineReason    = defineModel<string>('declineReason', { default: '' })

defineProps<{
    approving: boolean
    declining: boolean
    declineError: string
    applicationNo?: string
}>()

const emit = defineEmits<{
    approveSubmit: []
    declineSubmit: []
}>()
</script>

<template>
    <Teleport to="body">
        <!-- Approve modal -->
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showApproveModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div class="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-neutral-900" @click.stop>
                    <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Approve Application</h3>
                        <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{{ applicationNo }}</p>
                    </div>
                    <div class="px-6 py-4">
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Comments <span class="text-neutral-400">(optional)</span></label>
                        <textarea
                            v-model="approveComments"
                            rows="3"
                            placeholder="Add any comments…"
                            class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                        />
                    </div>
                    <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800" @click="showApproveModal = false">Cancel</button>
                        <button class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50" :disabled="approving" @click="emit('approveSubmit')">
                            <ThumbsUp v-if="!approving" class="h-4 w-4" />
                            <span>{{ approving ? 'Approving…' : 'Approve' }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Decline modal -->
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showDeclineModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div class="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-neutral-900" @click.stop>
                    <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Decline Application</h3>
                        <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{{ applicationNo }}</p>
                    </div>
                    <div class="px-6 py-4">
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-500">*</span></label>
                        <textarea
                            v-model="declineReason"
                            rows="3"
                            placeholder="State the reason for declining…"
                            class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                            :class="declineError ? 'border-red-400' : ''"
                        />
                        <p v-if="declineError" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ declineError }}</p>
                    </div>
                    <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800" @click="showDeclineModal = false">Cancel</button>
                        <button class="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50" :disabled="declining" @click="emit('declineSubmit')">
                            <ThumbsDown v-if="!declining" class="h-4 w-4" />
                            <span>{{ declining ? 'Declining…' : 'Decline' }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
