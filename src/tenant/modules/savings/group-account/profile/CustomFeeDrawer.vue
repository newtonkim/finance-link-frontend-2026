<script setup lang="ts">
import { reactive, ref } from 'vue';
import { toast } from 'vue-sonner';
import { X, Star } from 'lucide-vue-next';
import { tenantClient } from '../../../../apis/tenantClient';

const props = defineProps<{ currencyCode: string }>();
const emit = defineEmits<{ success: [] }>();

const open = ref(false);
const processing = ref(false);
const errors = ref<Record<string, any>>({});

const form = reactive({
    account_id: 0,
    custom_monthly_fee_enabled: false,
    custom_monthly_fee_type: 'amount',
    custom_monthly_fee_amount: null as number | string | null,
});

function openDrawer(account: any) {
    Object.assign(form, {
        account_id: account.id,
        custom_monthly_fee_enabled: account.custom_monthly_fee_enabled ?? false,
        custom_monthly_fee_type: account.custom_monthly_fee_type ?? 'amount',
        custom_monthly_fee_amount: account.custom_monthly_fee_amount,
    });
    errors.value = {};
    open.value = true;
}

async function submit() {
    processing.value = true;
    errors.value = {};
    try {
        await tenantClient.put(`/savings-accounts/${form.account_id}/custom-fees`, form);
        toast.success('Custom fee settings updated successfully.');
        open.value = false;
        emit('success');
    } catch (error: any) {
        if (error.response?.status === 422) {
            errors.value = error.response.data.errors || {};
        } else {
            toast.error('Failed to update custom fee settings.');
        }
    } finally {
        processing.value = false;
    }
}

defineExpose({ openDrawer });
</script>

<template>
    <Transition name="drawer-fade">
        <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="open = false"></div>
            <Transition name="drawer-slide">
                <div v-if="open" class="relative w-full max-w-[440px] h-full bg-card border-l border-border shadow-2xl flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-5 border-b border-border">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Star :size="16" class="text-amber-600 dark:text-amber-500" />
                            </div>
                            <h3 class="text-[15px] font-bold text-foreground">Custom Fees</h3>
                        </div>
                        <button @click="open = false"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                            <X :size="18" />
                        </button>
                    </div>

                    <form @submit.prevent="submit" class="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
                        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                            <h4 class="text-sm font-semibold text-amber-900 dark:text-amber-500 mb-1">Fee Overrides</h4>
                            <p class="text-xs text-amber-700 dark:text-amber-400">
                                Settings defined here will override the default periodic charges assigned to the savings product for this specific member account.
                            </p>
                        </div>

                        <!-- Toggle -->
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="block text-sm font-semibold text-foreground">Enable Custom Fee</label>
                                <p class="text-xs text-muted-foreground mt-0.5">Override product defaults</p>
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <div class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out"
                                    :class="form.custom_monthly_fee_enabled ? 'bg-bg-nfuko-yellow' : 'bg-secondary'">
                                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out"
                                        :class="form.custom_monthly_fee_enabled ? 'translate-x-6' : 'translate-x-1'"></span>
                                    <input v-model="form.custom_monthly_fee_enabled" type="checkbox" class="sr-only">
                                </div>
                            </label>
                        </div>

                        <template v-if="form.custom_monthly_fee_enabled">
                            <div class="grid gap-4 border-t border-border pt-4">
                                <div>
                                    <label class="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Fee Format</label>
                                    <select v-model="form.custom_monthly_fee_type"
                                        class="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-sm focus:border-bg-nfuko-yellow focus:ring-1 focus:ring-bg-nfuko-yellow/50 transition-all">
                                        <option value="amount">Fixed Amount</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Amount / Rate</label>
                                    <div class="relative">
                                        <span v-if="form.custom_monthly_fee_type === 'amount'" class="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted-foreground">{{ currencyCode }}</span>
                                        <span v-else class="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted-foreground">%</span>
                                        <input v-model="form.custom_monthly_fee_amount" type="number" step="0.01"
                                            class="w-full py-2.5 border border-border bg-background rounded-xl text-sm focus:border-bg-nfuko-yellow focus:ring-1 focus:ring-bg-nfuko-yellow/50 transition-all"
                                            :class="form.custom_monthly_fee_type === 'amount' ? 'pl-12 pr-4' : 'pl-4 pr-10'" />
                                    </div>
                                    <p v-if="errors.custom_monthly_fee_amount" class="mt-1 text-[11px] text-[#dc2626]">
                                        {{ errors.custom_monthly_fee_amount[0] || errors.custom_monthly_fee_amount }}
                                    </p>
                                </div>
                            </div>
                        </template>
                    </form>

                    <div class="p-5 border-t border-border flex items-center justify-end gap-3">
                        <button @click="open = false" type="button"
                            class="px-5 py-2.5 rounded-lg text-[12px] font-semibold text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-all">
                            Cancel
                        </button>
                        <button @click="submit" :disabled="processing"
                            class="px-5 py-2.5 rounded-lg text-[12px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            <span v-if="processing" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                            Apply Changes
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.25s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-slide-leave-active { transition: transform 0.2s ease-in; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
