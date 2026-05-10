<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { toast } from 'vue-sonner';
import { X, Plus, Check } from 'lucide-vue-next';
import SearchableSelect from '@/Global/SearchableSelect.vue';
import { tenantClient } from '@/tenant/apis/tenantClient';
import type { SavingsProduct } from '../composables/useMember';

const props = defineProps<{
    memberId: number;
    savingsAccounts: any[];
    savingsProducts: SavingsProduct[];
    currencyCode: string;
}>();

const toggleCharge = (id: number) => {
    const idx = form.charges.indexOf(id);
    idx > -1 ? form.charges.splice(idx, 1) : form.charges.push(id);
};

const isChargeSelected = (id: number) => form.charges.includes(id);

const getChargeName = (id: number) => selectedProductCharges.value.find(c => c.id === id)?.type ?? `Charge ${id}`;


</script>

<template>
   <
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.25s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-slide-leave-active { transition: transform 0.2s ease-in; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
