<script setup lang="ts">
import { ref, watch } from 'vue'
import { Undo2, XCircle } from 'lucide-vue-next'

const props = defineProps<{
    open: boolean
    submitting: boolean
}>()

const emit = defineEmits<{
    close: []
    submit: [correctionReason: string]
}>()

const correctionReason = ref('')
const reasonError = ref('')

watch(() => props.open, (isOpen) => {
    if (isOpen) {
        correctionReason.value = ''
        reasonError.value = ''
    }
})

function handleSubmit() {
    reasonError.value = ''
    if (correctionReason.value.trim().length < 10) {
        reasonError.value = 'Please provide a reason of at least 10 characters.'
        return
    }
    emit('submit', correctionReason.value.trim())
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
                        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30">
                            <Undo2 class="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Return for Correction</h3>
                            <p class="text-xs text-neutral-500">Application will go back to the loan officer for corrections.</p>
                        </div>
                    </div>
                    <div class="px-6 py-5">
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Reason <span class="text-red-400">*</span>
                        </label>
                        <textarea v-model="correctionReason" rows="4" placeholder="e.g. The recommended amount exceeds the member's eligible limit. Please revise and resubmit…"
                            class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                            :class="reasonError ? 'border-red-300 dark:border-red-700' : ''" />
                        <p v-if="reasonError" class="mt-1 text-xs text-red-500">{{ reasonError }}</p>
                    </div>
                    <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            @click="emit('close')">Cancel</button>
                        <button :disabled="submitting"
                            class="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-[#052659]/90 disabled:opacity-50"
                            @click="handleSubmit">
                            <Undo2 class="h-4 w-4" />
                            {{ submitting ? 'Returning…' : 'Return for Correction' }}
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>
