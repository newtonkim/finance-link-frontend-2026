<script setup lang="ts">
import { Check } from 'lucide-vue-next'

defineProps<{
    steps: { id: number; label: string }[]
    currentStep: number
}>()

const emit = defineEmits<{ goto: [step: number] }>()
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white px-6 py-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex items-center">
            <template v-for="(step, idx) in steps" :key="step.id">
                <button
                    type="button"
                    class="flex shrink-0 items-center gap-2.5"
                    :class="currentStep > step.id ? 'cursor-pointer' : 'cursor-default'"
                    @click="currentStep > step.id ? emit('goto', step.id) : undefined"
                >
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors"
                        :class="currentStep > step.id
                            ? 'bg-emerald-500 text-white'
                            : currentStep === step.id
                                ? 'bg-nfuko-primary text-white'
                                : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'"
                    >
                        <Check v-if="currentStep > step.id" class="h-4 w-4" />
                        <span v-else>{{ step.id }}</span>
                    </div>
                    <span
                        class="hidden sm:block text-sm font-medium transition-colors"
                        :class="currentStep === step.id
                            ? 'text-neutral-900 dark:text-white'
                            : currentStep > step.id
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-neutral-400 dark:text-neutral-500'"
                    >{{ step.label }}</span>
                </button>
                <div v-if="idx < steps.length - 1" class="mx-3 h-px min-w-[2rem] flex-1 bg-neutral-200 dark:bg-neutral-700" />
            </template>
        </div>
    </div>
</template>
