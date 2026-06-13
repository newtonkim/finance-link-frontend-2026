<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
    Building2,
    UserPlus,
    CreditCard,
    FileCheck,
    ChevronRight,
    ChevronLeft,
    Eye,
    EyeOff,
} from 'lucide-vue-next';
import { Card } from '@/Global/ui/card';
import { Button } from '@/Global/ui/button';
import { Input } from '@/Global/ui/input';
import { createTenant } from '@/central/api/tenants';

const router = useRouter();

const isSubmitting = ref(false);
const submitError = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Stepper
const currentStep = ref(0);

const steps = [
    { label: 'SACCO Info', icon: Building2 },
    { label: 'Admin Account', icon: UserPlus },
    { label: 'Licensing', icon: CreditCard },
    { label: 'Review', icon: FileCheck },
];

// Form data
const form = ref({
    // Step 1: SACCO Info
    saccoName: '',
    subdomain: '',
    // Step 2: Admin Account
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    adminPasswordConfirmation: '',
    // Step 3: Licensing
    plan: 'standard',
    licenseMonths: 12,
});

const plans = [
    { value: 'basic', label: 'Basic', price: '$29/mo', description: 'For small SACCOs with up to 100 members' },
    { value: 'standard', label: 'Standard', price: '$79/mo', description: 'For growing SACCOs with up to 500 members' },
    { value: 'premium', label: 'Premium', price: '$149/mo', description: 'For large SACCOs with unlimited members' },
];

const licenseDurations = [
    { value: 3, label: '3 Months' },
    { value: 6, label: '6 Months' },
    { value: 12, label: '12 Months' },
    { value: 24, label: '24 Months' },
];

// Validation
const step1Valid = computed(() => form.value.saccoName.trim() !== '' && form.value.subdomain.trim() !== '');
const step2Valid = computed(() =>
    form.value.adminName.trim() !== '' &&
    form.value.adminEmail.trim() !== '' &&
    form.value.adminPassword.trim() !== '' &&
    form.value.adminPassword === form.value.adminPasswordConfirmation
);
const step3Valid = computed(() => form.value.plan !== '' && form.value.licenseMonths > 0);

const canProceed = computed(() => {
    switch (currentStep.value) {
        case 0: return step1Valid.value;
        case 1: return step2Valid.value;
        case 2: return step3Valid.value;
        case 3: return true;
        default: return false;
    }
});

function nextStep() {
    if (canProceed.value && currentStep.value < steps.length - 1) {
        currentStep.value++;
    }
}

function prevStep() {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
}

async function submitForm() {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    submitError.value = '';

    try {
        await createTenant({
            name: form.value.saccoName,
            subdomain: form.value.subdomain,
            admin_name: form.value.adminName,
            admin_email: form.value.adminEmail,
            admin_phone: form.value.adminPhone || undefined,
            admin_password: form.value.adminPassword,
            plan: form.value.plan,
            license_months: form.value.licenseMonths,
        });
        router.push('/central/tenants');
    } catch (err: any) {
        const data = err?.response?.data;
        if (data?.errors) {
            submitError.value = Object.values(data.errors).flat().join(' ');
        } else {
            submitError.value = data?.message ?? 'Failed to create tenant. Please try again.';
        }
    } finally {
        isSubmitting.value = false;
    }
}

// Auto-generate subdomain from name
function onNameInput() {
    if (form.value.saccoName) {
        form.value.subdomain = form.value.saccoName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
}
</script>

<template>
    <div class="p-6 space-y-8 max-w-4xl mx-auto">
        <!-- Page Title -->
        <div>
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Create New Tenant
            </h1>
        </div>

        <!-- Stepper -->
        <div class="flex items-center justify-between">
            <template v-for="(step, index) in steps" :key="step.label">
                <!-- Step -->
                <div class="flex flex-col items-center gap-2 z-10">
                    <div class="size-12 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden p-2"
                        :class="index <= currentStep
                            ? 'bg-white dark:bg-white  text-nfuko-primary shadow-lg shadow-bg-nfuko-primary/20 dark:shadow-white/20'
                            : 'bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-500'
                            ">
                        <img v-if="index === 0" src="/images/finance_link_logo_updated.png" alt="Logo"
                            class="size-full object-contain" />
                        <component v-else :is="step.icon" class="size-5" />
                    </div>
                    <span class="text-xs font-semibold transition-colors duration-200" :class="index <= currentStep
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400 dark:text-neutral-500'
                        ">
                        {{ step.label }}
                    </span>
                </div>

                <!-- Connector line -->
                <div v-if="index < steps.length - 1" class="flex-1 h-px mx-3 -mt-6 transition-colors duration-300"
                    :class="index < currentStep
                        ? ' bg-nfuko-primary dark:bg-white'
                        : 'bg-neutral-200 dark:bg-white/10'
                        "></div>
            </template>
        </div>

        <!-- Step Content -->
        <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden">
            <!-- Step 1: SACCO Information -->
            <div v-if="currentStep === 0" class="p-8 space-y-6">
                <div>
                    <h2 class="text-lg font-bold text-neutral-900 dark:text-white">SACCO Information</h2>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Basic details about the organization.
                    </p>
                </div>

                <div class="space-y-5">
                    <!-- SACCO Name -->
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            SACCO Name <span class="text-rose-500">*</span>
                        </label>
                        <Input v-model="form.saccoName" @input="onNameInput" type="text"
                            placeholder="e.g. Nairobi Savings & Credit"
                            class="h-12 rounded-xl border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10" />
                    </div>

                    <!-- Subdomain -->
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Subdomain <span class="text-rose-500">*</span>
                        </label>
                        <div class="flex">
                            <Input v-model="form.subdomain" type="text" placeholder="nairobi-sacco"
                                class="h-12 rounded-xl rounded-r-none border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10 flex-1" />
                            <div
                                class="h-12 px-4 flex items-center bg-neutral-50 dark:bg-white/5 border border-l-0 border-neutral-200 dark:border-white/10 rounded-xl rounded-l-none text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                .mfukopro.com
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 2: Admin Account -->
            <div v-if="currentStep === 1" class="p-8 space-y-6">
                <div>
                    <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Admin Account</h2>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Set up the primary administrator for this SACCO.
                    </p>
                </div>

                <div class="space-y-5">
                    <!-- Admin Name -->
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Full Name <span class="text-rose-500">*</span>
                        </label>
                        <Input v-model="form.adminName" type="text" placeholder="e.g. John Kamau"
                            class="h-12 rounded-xl border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10" />
                    </div>

                    <!-- Admin Email -->
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Email Address <span class="text-rose-500">*</span>
                        </label>
                        <Input v-model="form.adminEmail" type="email" placeholder="admin@example.com"
                            class="h-12 rounded-xl border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10" />
                    </div>

                    <!-- Admin Phone -->
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Phone Number
                        </label>
                        <Input v-model="form.adminPhone" type="tel" placeholder="+254 712 345 678"
                            class="h-12 rounded-xl border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10" />
                    </div>

                    <!-- Password -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div class="space-y-2">
                            <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Password <span class="text-rose-500">*</span>
                            </label>
                            <div class="relative">
                                <Input v-model="form.adminPassword" :type="showPassword ? 'text' : 'password'"
                                    placeholder="••••••••"
                                    class="h-12 rounded-xl border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10 pr-11" />
                                <button type="button" @click="showPassword = !showPassword"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                                    <EyeOff v-if="showPassword" class="size-4" />
                                    <Eye v-else class="size-4" />
                                </button>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Confirm Password <span class="text-rose-500">*</span>
                            </label>
                            <div class="relative">
                                <Input v-model="form.adminPasswordConfirmation"
                                    :type="showConfirmPassword ? 'text' : 'password'" placeholder="••••••••"
                                    class="h-12 rounded-xl border-neutral-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white bg-white text-sm focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:focus:ring-white/10 pr-11" />
                                <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                                    <EyeOff v-if="showConfirmPassword" class="size-4" />
                                    <Eye v-else class="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 3: Licensing -->
            <div v-if="currentStep === 2" class="p-8 space-y-6">
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
                            <button v-for="plan in plans" :key="plan.value" @click="form.plan = plan.value"
                                class="p-5 rounded-xl border-2 text-left transition-all duration-200" :class="form.plan === plan.value
                                    ? ' border-nfuko-primary dark:border-white  bg-nfuko-primary/[0.02] dark:bg-white/5'
                                    : 'border-neutral-100 dark:border-white/10 hover:border-neutral-200 dark:hover:border-white/20'
                                    ">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm font-bold text-neutral-900 dark:text-white">{{ plan.label
                                        }}</span>
                                    <div class="size-5 rounded-full border-2 flex items-center justify-center transition-all"
                                        :class="form.plan === plan.value
                                            ? ' border-nfuko-primary dark:border-white'
                                            : 'border-neutral-300 dark:border-white/20'
                                            ">
                                        <div v-if="form.plan === plan.value"
                                            class="size-2.5 rounded-full  bg-nfuko-primary dark:bg-white"></div>
                                    </div>
                                </div>
                                <p class="text-lg font-bold  text-nfuko-primary dark:text-white mb-1">{{ plan.price }}</p>
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
                            <button v-for="dur in licenseDurations" :key="dur.value"
                                @click="form.licenseMonths = dur.value"
                                class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200" :class="form.licenseMonths === dur.value
                                    ? ' bg-nfuko-primary dark:bg-white text-white dark: text-nfuko-primary shadow-sm'
                                    : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10'
                                    ">
                                {{ dur.label }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 4: Review -->
            <div v-if="currentStep === 3" class="p-8 space-y-6">
                <div>
                    <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Review</h2>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Verify all details before creating the tenant.
                    </p>
                </div>

                <div class="space-y-5">
                    <!-- SACCO Info Summary -->
                    <div
                        class="p-5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/10 space-y-3">
                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">SACCO
                            Information</h3>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="text-neutral-500 dark:text-neutral-400">Name</span>
                                <p class="font-semibold text-neutral-900 dark:text-white">{{ form.saccoName || '—' }}
                                </p>
                            </div>
                            <div>
                                <span class="text-neutral-500 dark:text-neutral-400">Subdomain</span>
                                <p class="font-semibold text-neutral-900 dark:text-white">{{ form.subdomain || '—'
                                    }}.mfukopro.com</p>
                            </div>
                        </div>
                    </div>

                    <!-- Admin Summary -->
                    <div
                        class="p-5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/10 space-y-3">
                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Admin
                            Account
                        </h3>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="text-neutral-500 dark:text-neutral-400">Name</span>
                                <p class="font-semibold text-neutral-900 dark:text-white">{{ form.adminName || '—' }}
                                </p>
                            </div>
                            <div>
                                <span class="text-neutral-500 dark:text-neutral-400">Email</span>
                                <p class="font-semibold text-neutral-900 dark:text-white">{{ form.adminEmail || '—' }}
                                </p>
                            </div>
                            <div>
                                <span class="text-neutral-500 dark:text-neutral-400">Phone</span>
                                <p class="font-semibold text-neutral-900 dark:text-white">{{ form.adminPhone || '—' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Licensing Summary -->
                    <div
                        class="p-5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/10 space-y-3">
                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                            Licensing</h3>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="text-neutral-500 dark:text-neutral-400">Plan</span>
                                <p class="font-semibold text-neutral-900 dark:text-white capitalize">{{ form.plan }}</p>
                            </div>
                            <div>
                                <span class="text-neutral-500 dark:text-neutral-400">Duration</span>
                                <p class="font-semibold text-neutral-900 dark:text-white">{{ form.licenseMonths }}
                                    Months</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Message -->
            <div v-if="submitError"
                class="mx-8 mb-2 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-600 dark:text-rose-400">
                {{ submitError }}
            </div>

            <!-- Footer Navigation -->
            <div class="px-8 py-5 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between">
                <Button v-if="currentStep > 0" @click="prevStep" variant="ghost"
                    class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5">
                    <ChevronLeft class="size-4" />
                    Back
                </Button>
                <div v-else></div>

                <Button v-if="currentStep < steps.length - 1" @click="nextStep" :disabled="!canProceed"
                    class="font-semibold rounded-xl px-6 py-2.5 shadow-sm transition-all duration-200 flex items-center gap-1.5"
                    :class="canProceed
                        ? ' bg-nfuko-primary hover:bg-[#002e35] dark:bg-white dark: text-nfuko-primary dark:hover:bg-neutral-200 text-white cursor-pointer'
                        : 'bg-neutral-200 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'">
                    Next
                    <ChevronRight class="size-4" />
                </Button>
                <Button v-else @click="submitForm" :disabled="!canProceed || isSubmitting"
                    class="font-semibold rounded-xl px-6 py-2.5 shadow-sm transition-all duration-200 flex items-center gap-1.5"
                    :class="canProceed && !isSubmitting
                        ? ' bg-[#052659] hover:bg-[#052659]/90 dark:bg-white dark: text-nfuko-primary dark:hover:bg-[#052659]/90 text-white cursor-pointer'
                        : 'bg-neutral-200 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'">
                    {{ isSubmitting ? 'Creating...' : 'Create Tenant' }}
                    <ChevronRight class="size-4" />
                </Button>
            </div>
        </Card>
    </div>
</template>

<style scoped>
/* Create tenant page specific styles */
</style>
