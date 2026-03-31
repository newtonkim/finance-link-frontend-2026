<script setup lang="ts">
import { ref, watch } from 'vue'
import { UserCheck, XCircle } from 'lucide-vue-next'

const props = defineProps<{
    open: boolean
    submitting: boolean
}>()

const emit = defineEmits<{
    close: []
    submit: [bmNotes: string]
}>()

const bmNotes = ref('')

watch(() => props.open, (isOpen) => {
    if (isOpen) {
        bmNotes.value = ''
    }
})

function handleSubmit() {
    emit('submit', bmNotes.value.trim())
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
                        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                            <UserCheck class="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Recommend to Committee</h3>
                            <p class="text-xs text-neutral-500">This will open committee voting for this application.</p>
                        </div>
                    </div>
                    <div class="px-6 py-5">
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Branch Manager Notes <span class="text-neutral-400 font-normal">(optional)</span>
                        </label>
                        <textarea v-model="bmNotes" rows="4" placeholder="Add any notes for the committee…"
                            class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                    </div>
                    <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            @click="emit('close')">Cancel</button>
                        <button :disabled="submitting"
                            class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            @click="handleSubmit">
                            <UserCheck class="h-4 w-4" />
                            {{ submitting ? 'Submitting…' : 'Recommend to Committee' }}
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>
