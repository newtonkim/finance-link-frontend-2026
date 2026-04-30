<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronLeft, Search, Check } from 'lucide-vue-next';

const router = useRouter();

const form = ref({
    tenant: '',
    plan: '',
    startsAt: '',
    expiresAt: '',
    status: 'active',
});

// --- Tenant searchable dropdown ---
const tenantOptions = ref([
    { value: 'nairobi-sacco', label: 'Nairobi Savings & Credit' },
    { value: 'mombasa-sacco', label: 'Mombasa SACCO' },
    { value: 'kisumu-coop', label: 'Kisumu Cooperative' },
    { value: 'eldoret-savings', label: 'Eldoret Savings' },
    { value: 'nakuru-credit', label: 'Nakuru Credit Union' },
]);

const tenantSearch = ref('');
const tenantOpen = ref(false);
const tenantSelectedLabel = computed(() => {
    const found = tenantOptions.value.find(o => o.value === form.value.tenant);
    return found ? found.label : '';
});
const filteredTenants = computed(() => {
    if (!tenantSearch.value.trim()) return tenantOptions.value;
    const q = tenantSearch.value.toLowerCase();
    return tenantOptions.value.filter(o => o.label.toLowerCase().includes(q));
});
function selectTenant(opt: { value: string; label: string }) {
    form.value.tenant = opt.value;
    tenantSearch.value = '';
    tenantOpen.value = false;
}

// --- Plan searchable dropdown ---
const planOptions = [
    { value: 'basic', label: 'Basic' },
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
];

const planSearch = ref('');
const planOpen = ref(false);
const planSelectedLabel = computed(() => {
    const found = planOptions.find(o => o.value === form.value.plan);
    return found ? found.label : '';
});
const filteredPlans = computed(() => {
    if (!planSearch.value.trim()) return planOptions;
    const q = planSearch.value.toLowerCase();
    return planOptions.filter(o => o.label.toLowerCase().includes(q));
});
function selectPlan(opt: { value: string; label: string }) {
    form.value.plan = opt.value;
    planSearch.value = '';
    planOpen.value = false;
}

// --- Status (not searchable, stays native) ---
const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'trial', label: 'Trial' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'expired', label: 'Expired' },
];

// Close dropdowns on outside click
function onPageClick() {
    tenantOpen.value = false;
    planOpen.value = false;
}

function cancel() {
    router.push('/central/licenses');
}

function submitForm() {
    // TODO: Submit to API
    // console.log('Creating license:', form.value);
    router.push('/central/licenses');
}
</script>

<template>
    <div class="p-6 space-y-6 max-w-3xl mx-auto" @click="onPageClick">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <button @click="cancel"
                class="size-10 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                <ChevronLeft class="size-5 text-neutral-600 dark:text-neutral-300" />
            </button>
            <h1 class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Create New License
            </h1>
        </div>
        <!-- Form Card -->
        <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden">
            <div class="p-8 space-y-6">

                <!-- Tenant (searchable) -->
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Tenant
                    </label>
                    <div class="relative" @click.stop>
                        <button @click="tenantOpen = !tenantOpen; planOpen = false" type="button"
                            class="w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] bg-white text-left text-sm flex items-center justify-between transition-shadow"
                            :class="tenantOpen ? 'ring-2 ring-bg-nfuko-primary/10 dark:ring-white/10' : ''">
                            <span
                                :class="tenantSelectedLabel ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'">
                                {{ tenantSelectedLabel || 'Select a Tenant' }}
                            </span>
                            <svg class="size-4 text-neutral-400 dark:text-neutral-500 transition-transform"
                                :class="tenantOpen ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>

                        <!-- Dropdown -->
                        <Transition enter-active-class="transition duration-100 ease-out"
                            enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                            leave-active-class="transition duration-75 ease-in"
                            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
                            <div v-if="tenantOpen"
                                class="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                <!-- Search input -->
                                <div class="p-2 border-b border-neutral-100 dark:border-white/10">
                                    <div class="relative">
                                        <Search
                                            class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                                        <input v-model="tenantSearch" type="text" placeholder="Search tenants..."
                                            class="w-full h-9 pl-9 pr-3 rounded-lg border-0 bg-neutral-50 dark:bg-white/5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary/20 dark:focus:ring-white/20"
                                            @click.stop />
                                    </div>
                                </div>
                                <!-- Options -->
                                <div class="max-h-48 overflow-y-auto py-1">
                                    <button v-for="opt in filteredTenants" :key="opt.value" @click="selectTenant(opt)"
                                        class="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                                        :class="form.tenant === opt.value ? ' text-nfuko-primary dark:text-white font-semibold' : 'text-neutral-700 dark:text-neutral-300'">
                                        {{ opt.label }}
                                        <Check v-if="form.tenant === opt.value"
                                            class="size-4  text-nfuko-primary dark:text-white" />
                                    </button>
                                    <div v-if="filteredTenants.length === 0"
                                        class="px-4 py-3 text-sm text-neutral-400 dark:text-neutral-500 text-center">
                                        No tenants found
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>

                <!-- Plan (searchable) -->
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Plan
                    </label>
                    <div class="relative" @click.stop>
                        <button @click="planOpen = !planOpen; tenantOpen = false" type="button"
                            class="w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] bg-white text-left text-sm flex items-center justify-between transition-shadow"
                            :class="planOpen ? 'ring-2 ring-bg-nfuko-primary/10 dark:ring-white/10' : ''">
                            <span
                                :class="planSelectedLabel ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'">
                                {{ planSelectedLabel || 'Select a Plan' }}
                            </span>
                            <svg class="size-4 text-neutral-400 dark:text-neutral-500 transition-transform"
                                :class="planOpen ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>

                        <!-- Dropdown -->
                        <Transition enter-active-class="transition duration-100 ease-out"
                            enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                            leave-active-class="transition duration-75 ease-in"
                            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
                            <div v-if="planOpen"
                                class="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                <!-- Search input -->
                                <div class="p-2 border-b border-neutral-100 dark:border-white/10">
                                    <div class="relative">
                                        <Search
                                            class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                                        <input v-model="planSearch" type="text" placeholder="Search plans..."
                                            class="w-full h-9 pl-9 pr-3 rounded-lg border-0 bg-neutral-50 dark:bg-white/5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary/20 dark:focus:ring-white/20"
                                            @click.stop />
                                    </div>
                                </div>
                                <!-- Options -->
                                <div class="max-h-48 overflow-y-auto py-1">
                                    <button v-for="opt in filteredPlans" :key="opt.value" @click="selectPlan(opt)"
                                        class="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                                        :class="form.plan === opt.value ? ' text-nfuko-primary dark:text-white font-semibold' : 'text-neutral-700 dark:text-neutral-300'">
                                        {{ opt.label }}
                                        <Check v-if="form.plan === opt.value"
                                            class="size-4  text-nfuko-primary dark:text-white" />
                                    </button>
                                    <div v-if="filteredPlans.length === 0"
                                        class="px-4 py-3 text-sm text-neutral-400 dark:text-neutral-500 text-center">
                                        No plans found
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>

                <!-- Dates -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Starts At
                        </label>
                        <Input v-model="form.startsAt" type="date"
                            class="h-12 rounded-xl border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Expires At
                        </label>
                        <Input v-model="form.expiresAt" type="date"
                            class="h-12 rounded-xl border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10" />
                    </div>
                </div>

                <!-- Status -->
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Status
                    </label>
                    <div class="relative">
                        <select v-model="form.status"
                            class="w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10 transition-shadow">
                            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                        <svg class="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-8 py-5 border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-3">
                <Button @click="cancel" variant="outline"
                    class="font-semibold rounded-xl px-6 py-2.5 border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all">
                    Cancel
                </Button>
                <Button @click="submitForm"
                    class=" bg-nfuko-primary hover:bg-[#002e35] dark:bg-white dark: text-nfuko-primary dark:hover:bg-neutral-200 text-white font-semibold rounded-xl px-6 py-2.5 shadow-sm transition-all duration-200">
                    Create License
                </Button>
            </div>
        </Card>
    </div>
</template>

<style scoped>
/* Create license page specific styles */
</style>
