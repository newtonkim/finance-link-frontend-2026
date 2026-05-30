<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { toast } from 'vue-sonner';
import { X, Plus, Check, Loader2, Info } from 'lucide-vue-next';
import SearchableSelect from '@/Global/SearchableSelect.vue';
import { tenantClient } from '@/tenant/apis/tenantClient';
import type { SavingsProduct } from '../composables/useMember';

const props = defineProps<{
    memberId: number;
    savingsAccounts: any[];
    savingsProducts: SavingsProduct[];
    currencyCode: string;
}>();

const emit = defineEmits(['success']);

const isOpen = ref(false);
const submitting = ref(false);

const form = reactive({
    product_id: null as number | null,
    charges: [] as number[],
});

const selectedProduct = computed(() => 
    props.savingsProducts.find(p => p.id === form.product_id)
);

const selectedProductCharges = computed(() => 
    selectedProduct.value?.charges || []
);

// Reset charges when product changes
watch(() => form.product_id, () => {
    form.charges = [];
});

const toggleCharge = (id: number) => {
    const idx = form.charges.indexOf(id);
    if (idx > -1) {
        form.charges.splice(idx, 1);
    } else {
        form.charges.push(id);
    }
};

const isChargeSelected = (id: number) => form.charges.includes(id);

const getChargeName = (id: number) => 
    selectedProductCharges.value.find(c => c.id === id)?.type ?? `Charge ${id}`;

const openDrawer = () => {
    form.product_id = null;
    form.charges = [];
    isOpen.value = true;
};

const closeDrawer = () => {
    isOpen.value = false;
};

const handleSubmit = async () => {
    if (!form.product_id) {
        toast.error('Please select a savings product.');
        return;
    }

    submitting.value = true;
    try {
        await tenantClient.post(`/members/${props.memberId}/accounts`, {
            product_id: form.product_id,
            charges: form.charges,
        });
        toast.success('Savings account created successfully.');
        emit('success');
        closeDrawer();
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to create savings account.');
    } finally {
        submitting.value = false;
    }
};

defineExpose({ openDrawer });
</script>

<template>
    <Transition name="drawer-fade">
        <div v-if="isOpen" class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" @click="closeDrawer" />
    </Transition>

    <Transition name="drawer-slide">
        <div v-if="isOpen" class="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-md bg-white shadow-2xl dark:bg-neutral-900 flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                    <h2 class="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">New Savings Account</h2>
                    <p class="text-xs text-neutral-500 mt-1">Configure a new product for this member.</p>
                </div>
                <button @click="closeDrawer" class="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <X class="w-5 h-5 text-neutral-400" />
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <!-- Product Selection -->
                <div class="space-y-2">
                    <label class="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Select Product</label>
                    <SearchableSelect
                        v-model="form.product_id"
                        :options="props.savingsProducts.map(p => ({ id: p.id, name: p.name }))"
                        placeholder="Choose a savings product..."
                    />
                </div>

                <!-- Product Details Preview -->
                <div v-if="selectedProduct" class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-3">
                    <div class="flex items-center gap-2">
                        <Info class="w-4 h-4 text-nfuko-primary dark:text-nfuko-yellow" />
                        <span class="text-xs font-bold text-neutral-700 dark:text-neutral-200">Product Configuration</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-[10px] text-neutral-400 font-bold uppercase">Type</p>
                            <p class="text-sm font-bold text-neutral-900 dark:text-white capitalize">{{ selectedProduct.type }}</p>
                        </div>
                        <div>
                            <p class="text-[10px] text-neutral-400 font-bold uppercase">Min. Balance</p>
                            <p class="text-sm font-bold text-neutral-900 dark:text-white">{{ props.currencyCode }} {{ Number(selectedProduct.minimum_balance).toLocaleString() }}</p>
                        </div>
                    </div>
                </div>

                <!-- Charges Selection -->
                <div v-if="selectedProduct && selectedProductCharges.length > 0" class="space-y-3">
                    <label class="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Applicable Charges</label>
                    <div class="space-y-2">
                        <button
                            v-for="charge in selectedProductCharges"
                            :key="charge.id"
                            @click="toggleCharge(charge.id)"
                            :class="[
                                'w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left',
                                isChargeSelected(charge.id)
                                    ? 'bg-nfuko-primary/5 border-nfuko-primary ring-1 ring-nfuko-primary'
                                    : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700'
                            ]"
                        >
                            <div class="flex items-center gap-3">
                                <div :class="[
                                    'w-5 h-5 rounded-md flex items-center justify-center border transition-colors',
                                    isChargeSelected(charge.id) ? 'bg-nfuko-primary border-nfuko-primary' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                                ]">
                                    <Check v-if="isChargeSelected(charge.id)" class="w-3 h-3 text-white" />
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-neutral-900 dark:text-white">{{ charge.type }}</p>
                                    <p class="text-[10px] text-neutral-500 capitalize">{{ charge.charge_type.replace('_', ' ') }}</p>
                                </div>
                            </div>
                            <span class="text-sm font-black text-nfuko-primary dark:text-nfuko-yellow">
                                {{ props.currencyCode }} {{ Number(charge.amount).toLocaleString() }}
                            </span>
                        </button>
                    </div>
                </div>

                <div v-else-if="selectedProduct" class="p-8 text-center bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                    <p class="text-xs font-bold text-neutral-400">No additional charges for this product.</p>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                <button
                    @click="handleSubmit"
                    :disabled="submitting || !form.product_id"
                    class="w-full py-4 bg-[#052659] text-white rounded-xl font-black text-sm shadow-lg shadow-nfuko-primary/20 hover:bg-[#052659]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                    <Plus v-else class="w-4 h-4" />
                    Create Account
                </button>
            </div>
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
