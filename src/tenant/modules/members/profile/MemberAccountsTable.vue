<script setup lang="ts">
import { ACTION_CONFIG, Confirm, Table } from '@/Global';
import { memberProfileApi } from '@/tenant/apis/savings/member-profileApi';
import { Plus } from 'lucide-vue-next';
const { DeleteMemberAccount } = memberProfileApi();
// DeleteMemberAccount
defineProps<{
    accounts: any[];
    currencyCode: string;
    formatCurrency: (v?: string | number) => string;
}>();
const emit = defineEmits<{
    newAccount: [];
    customFee: [account: any];
}>();
const columns = [
    { key: 'code', label: 'Account Code', sticky: 'left', width: '18em' },
    { key: 'account_type', label: 'Account Type' },
    { key: 'balance', label: 'Balance' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'actions', label: 'Actions', show: ['delete'] }
]
function handleAction(item: any, action: string) {
    if (action === 'delete') {
//    Confirm()
 Confirm({ type:'delete', confirm: () => {
     DeleteMemberAccount({ id: item.id })
 }, cancel: () => {} })
  
}
}
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
            <Table :handle-action="handleAction" v-if="accounts.length && columns.length" :dataFilter="accounts" :columns="columns"
                :action_config="ACTION_CONFIG">
                <template #actions="{ item }">
                    <button @click="emit('customFee', item)"
                        class="flex items-center gap-2 px-[14px] py-1.5 text-[12px] font-bold rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                        title="Adjust Compulsory Fees">
                        <Star :size="12" />
                        Custom Fees
                    </button>
                </template>
            </Table>
        </div>
    </div>
</template>
