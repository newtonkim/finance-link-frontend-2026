<template>
    <div class="p-8 space-y-6">
        <div>
            <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Licensing</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Choose a plan and license duration for this SACCO.
            </p>
        </div>

        <div class="space-y-6">
            <!-- Plans -->
            <div class="space-y-2">
                <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Select Plan <span class="text-rose-500">*</span>
                </label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button type='button' v-for="plan in plans" :key="plan.value" @click="form.plan = plan.value"
                        class="p-5 rounded-xl border-2 text-left transition-all duration-200" :class="form.plan === plan.value
                            ? 'border-[#001d22] dark:border-white bg-[#001d22]/[0.02] dark:bg-white/5'
                            : 'border-neutral-100 dark:border-white/10 hover:border-neutral-200 dark:hover:border-white/20'
                            ">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-bold text-neutral-900 dark:text-white">{{ plan.label
                            }}</span>
                            <div class="size-5 rounded-full border-2 flex items-center justify-center transition-all"
                                :class="form.plan === plan.value
                                    ? 'border-[#001d22] dark:border-white'
                                    : 'border-neutral-300 dark:border-white/20'
                                    ">
                                <div v-if="form.plan === plan.value"
                                    class="size-2.5 rounded-full bg-[#001d22] dark:bg-white"></div>
                            </div>
                        </div>
                        <p class="text-lg font-bold text-[#001d22] dark:text-white mb-1">{{ plan.price }}</p>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ plan.description }}</p>
                    </button>
                </div>
            </div>

            <!-- License Duration -->
            <div class="space-y-2">
                <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    License Duration <span class="text-rose-500">*</span>
                </label>
                <div class="flex flex-wrap gap-3">
                    <button type='button' v-for="dur in licenseDurations" :key="dur.value" @click="form.license_months = dur.value"
                        class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200" :class="form.license_months === dur.value
                            ? 'bg-[#001d22] dark:bg-white text-white dark:text-[#001d22] shadow-sm'
                            : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10'
                            ">
                        {{ dur.label }}
                    </button>
                </div>
            </div>
        </div>
    </div>


</template>

<script setup>
import { ref, watch } from 'vue';
const emits = defineEmits(['update:form', "change"]);

const plans = [
    { value: 'basic', label: 'Basic', price: '$29/mo', description: 'For small SACCOs with up to 100 members' },
    { value: 'Standard', label: 'Standard', price: '$79/mo', description: 'For growing SACCOs with up to 500 members' },
    { value: 'Premium', label: 'Premium', price: '$149/mo', description: 'For large SACCOs with unlimited members' },
];

const licenseDurations = [
    { value: 3, label: '3 Months' },
    { value: 6, label: '6 Months' },
    { value: 12, label: '12 Months' },
    { value: 24, label: '24 Months' },
];

const form = ref({ 
    plan: '',
    license_months: 0,
});

watch(form.value, (newValue) => {
    if (newValue) {
        const data = []

        for (const key in newValue) {
            data.push({
                label: key,
                name: key,
                value: newValue[key],
            });
        }
        emits('change', data);
    }
}, { deep: true });

</script>