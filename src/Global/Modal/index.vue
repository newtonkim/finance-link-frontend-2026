<template>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
        <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div class="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" @click="close" />

            <div
                class="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-950 dark:border dark:border-neutral-800">
                <div class="mb-6 flex items-center justify-between">
                    <h3 class="text-xl font-bold text-neutral-900 dark:text-white">
                        {{ title }}
                    </h3>

                    <button class="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 transition-colors"
                        @click="close">
                        ✕
                    </button>
                </div>

                <div class="space-y-5">
                    <form @submit.prevent="handleSubmit">
                        <slot name="body"   />
                    </form>
                </div>

                <div class="mt-8 flex gap-3">
                    <button type="button"
                        class="flex-1 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                        @click="close">
                        Cancel
                    </button>

                    <button type="button" 
                        class="flex-1 rounded-2xl bg-nfuko-primary px-4 py-3 text-sm font-bold text-white hover:bg-nfuko-primary/90 transition-colors disabled:opacity-50"
                        @click="handleSubmit">
                        {{ actionText }}
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue"

const props = withDefaults(
    defineProps<{
        modelValue: boolean
        title?: string
        actionText?: string
    }>(),
    {
        title: "Add New ",
        actionText: "Add ",
    }
)

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void
    (e: "submit", value: any): void
}>()

 

 

const close = () => {
    emit("update:modelValue", false)
}

const handleSubmit = () => {
    // if (!isValid.value) return
    emit("submit", {  })
    close()
}
</script>