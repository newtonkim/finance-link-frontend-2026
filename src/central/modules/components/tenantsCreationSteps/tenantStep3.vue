<template>
    <div class="p-8 space-y-6 overflow-y-auto h-[50vh]">
        <div>
            <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Licensing</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Choose a plan and license duration for this SACCO.
            </p>
        </div>
        <div class="space-y-6">
            <!-- Plans -->
            <div class="space-y-2">
                <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Select Plan <span
                        class="text-rose-500">*</span>
                </label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button type='button' v-for="plan in plansCollection" :key="plan?.id" @click="form.plan = plan?.id"
                        class="p-5 rounded-xl border-2 text-left transition-all duration-200" :class="form.plan === plan?.id
                            ? ' border-nfuko-primary dark:border-white  bg-nfuko-primary/[0.02] dark:bg-white/5'
                            : 'border-neutral-100 dark:border-white/10 hover:border-neutral-200 dark:hover:border-white/20'
                            ">
                        <div class="flex items-center justify-between mb-2" :title="plan?.name">
                            <span
                                class="text-sm font-bold text-neutral-900 dark:text-white tracking-wider truncate capitalize">{{
                                    plan?.name
                                }}</span>
                            <div class="size-5 rounded-full border-2 flex items-center justify-center transition-all"
                                :class="form.plan === plan?.id
                                    ? ' border-nfuko-primary dark:border-white'
                                    : 'border-neutral-300 dark:border-white/20'
                                    ">
                                <div v-if="form.plan === plan?.id"
                                    class="size-2.5 rounded-full  bg-nfuko-primary dark:bg-white"></div>
                            </div>
                        </div>
                        <p class="text-lg font-bold  text-nfuko-primary dark:text-white mb-1">{{ plan?.cost }}</p>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ plan?.description }}</p>
                    </button>
                </div>
            </div>

            <!-- License Duration -->
            <div class="space-y-2">
                <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    License Duration <span class="text-rose-500">*</span>
                </label>
                <div class="flex flex-wrap gap-3">
                    <button type='button' v-for="dur in filterDurations()" :key="dur" @click="form.license_months = dur"
                        class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200" :class="form.license_months === dur
                            ? ' bg-nfuko-primary dark:bg-white text-white dark: text-nfuko-primary shadow-sm'
                            : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10'
                            ">
                        {{ dur }}
                    </button>
                </div>
            </div>
        </div>
    </div>


</template>

<script setup>
import { fetchTableData } from '@/Global';
import { onMounted, ref, watch } from 'vue';
const emits = defineEmits(['update:form', "change"]);
import { pomPinia } from 'septor-store';
const Store = pomPinia();
const plansCollection = ref([])
const form = ref({
    plan: '',
    license_months: 0,
});
async function collect(data = {}) {
    const res = await fetchTableData({
        data,
        props: {
            url: 'central/global/plans-drop-down',
            state: 'plans-drop-down',
        },
        Store,
    })
    plansCollection.value = res?.payload?.data
    return res
}

onMounted(() => {
    collect()
});

function filterDurations() {
    const durations = plansCollection.value.map((plan) => plan.billing_type);
    return [...new Set(durations)];
}

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