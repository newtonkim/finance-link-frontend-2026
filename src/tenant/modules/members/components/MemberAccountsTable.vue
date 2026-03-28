<script setup lang="ts">
import { Plus, Wallet, Edit, Star } from 'lucide-vue-next';

defineProps<{
    accounts: any[];
    currencyCode: string;
    formatCurrency: (v?: string | number) => string;
}>();

const emit = defineEmits<{
    newAccount: [];
    customFee: [account: any];
}>();
</script>

<template>
    <div class="bg-white border border-gray-100 rounded-2xl shadow-sm mb-2">
        <div class="px-6 py-5 flex items-center justify-between border-b border-gray-100">
            <h3 class="text-[13px] font-bold text-[#546576] uppercase tracking-wider">Accounts</h3>
            <button @click="emit('newAccount')"
                class="flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-[#08262a] text-white transition-colors shadow-sm">
                <Plus :size="15" stroke-width="2.5" />
                New Account
            </button>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left min-w-[650px]">
                <thead>
                    <tr class="border-b border-gray-100 bg-white">
                        <th class="py-4 px-6 text-[12px] font-bold text-[#788896] uppercase tracking-wider">Account Number</th>
                        <th class="py-4 px-6 text-[12px] font-bold text-[#788896] uppercase tracking-wider">Account Type</th>
                        <th class="py-4 px-6 text-[12px] font-bold text-[#788896] uppercase tracking-wider">Balance ({{ currencyCode }})</th>
                        <th class="py-4 px-6 text-[12px] font-bold text-[#788896] uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="!accounts?.length">
                        <td colspan="4" class="py-8 text-center text-[13px] text-gray-500">No accounts found.</td>
                    </tr>
                    <tr v-for="account in accounts" :key="account.id"
                        class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td class="py-5 px-6">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-full bg-[#fdf8ed] flex items-center justify-center">
                                    <Wallet :size="16" class="text-[#cda434]" />
                                </div>
                                <span class="text-[14px] font-bold text-gray-900 font-mono tracking-tight">{{ account.account_no }}</span>
                            </div>
                        </td>
                        <td class="py-5 px-6">
                            <span class="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold bg-[#e0f2fe] text-[#0369a1] capitalize">
                                {{ account.account_type }}
                            </span>
                        </td>
                        <td class="py-5 px-6">
                            <span class="block text-[18px] font-extrabold text-gray-900 font-mono tracking-tight">{{ account.balance_formatted || formatCurrency(account.balance) }}</span>
                            <span class="block text-[11px] text-[#788896] mt-0.5">Last updated today</span>
                        </td>
                        <td class="py-5 px-6">
                            <div class="flex items-center gap-2">
                                <button class="flex items-center gap-2 px-[14px] py-1.5 text-[12px] font-bold rounded-full border border-gray-200 text-[#546576] hover:bg-gray-50 transition-colors">
                                    <Edit :size="12" />
                                    Update Details
                                </button>
                                <button @click="emit('customFee', account)"
                                    class="flex items-center gap-2 px-[14px] py-1.5 text-[12px] font-bold rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                                    title="Adjust Compulsory Fees">
                                    <Star :size="12" />
                                    Custom Fees
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
