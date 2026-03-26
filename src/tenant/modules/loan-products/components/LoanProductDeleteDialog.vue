<script setup lang="ts">
defineProps<{
    show: boolean
    productName: string | undefined
    deleting: boolean
}>()

defineEmits<{
    confirm: []
    cancel: []
}>()
</script>

<template>
    <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="$emit('cancel')"
    >
        <div class="mx-4 w-full max-w-sm rounded-2xl border border-neutral-100 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-2">Delete Loan Product</h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                Are you sure you want to delete
                <strong class="text-neutral-800 dark:text-neutral-200">{{ productName }}</strong>?
                This action cannot be undone.
            </p>
            <div class="flex justify-end gap-3">
                <button
                    class="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                    @click="$emit('cancel')"
                >
                    Cancel
                </button>
                <button
                    class="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    :disabled="deleting"
                    @click="$emit('confirm')"
                >
                    {{ deleting ? 'Deleting…' : 'Delete' }}
                </button>
            </div>
        </div>
    </div>
</template>
