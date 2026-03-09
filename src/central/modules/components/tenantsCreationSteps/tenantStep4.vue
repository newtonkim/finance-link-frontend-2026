<template>
    <div class="p-8 space-y-6">
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
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';

const emits = defineEmits(['update:form', "change"]);

const form = ref({
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
