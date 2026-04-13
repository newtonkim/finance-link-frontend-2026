<template>
  <TableDrawer
    ref="drawer"
    :data="accounts"
    :columns="columns"
    :drawerTitle="drawerTitle?.title"
    :drawerWidth="drawerTitle?.width"
    :drawerShowFooter="showFooter"
    :drawerRemount="drawerRemount"
    :automaticCreate="false"
    :showTableAction="false"
    :showSearchbar="false"
    tableDetaultHeight=""
    @save="handleSave"
  >
    <template #add-action>
      <button
        @click="emit('newAccount')"
        class="flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-[#08262a] text-white shadow-sm mb-2"
      >
        <Plus :size="15" stroke-width="2.5" v-once />
        New Account
      </button>
    </template>
    <template #actions="{ item }">
      <div class="flex items-center gap-2">
        <button
          @click="emit('customFee', item)"
          class="flex items-center gap-2 px-[14px] py-1.5 text-[12px] font-bold rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
        >
          <Star :size="12" />
          Custom Fees
        </button>
        <TabelActionButtons
          title="withdrawal"
          color="secondary"
          icon="CircleMinus"
          @action="() => openDrawer(item, 'withdrawal')"
        />
        <TabelActionButtons
          title="deposit"
          color="custom"
          icon="CircleDollarSign"
          @action="() => openDrawer(item, 'deposit')"
        />
      </div>
    </template>
    <template #drawer="{ action, data }">
      <Deposit
        v-if="currentAction === 'deposit'"
        :data="{ action, ...automaticCreate }"
        v-model:form="formData"
      />
      <Withdrawal
        v-else-if="currentAction === 'withdrawal'"
        :data="{ action, ...automaticCreate }"
        v-model:form="formData"
      />
      <Details
        v-else-if="action === 'view'"
        :data="data"
      />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { Deposit, Withdrawal } from "@/tenant/modules/savings/member-account";
import { TableDrawer, TabelActionButtons } from "@/Global";
import { memberAccountApi,memberProfileApi } from "@/tenant/apis";
// import { memberProfileApi } from '@/tenant/apis/savings/member-profileApi';

const { getMemberProfileDetail } = memberProfileApi();

const props = defineProps<{
  accounts: any[];
  member: any;
  currencyCode: string;
  formatCurrency: (v?: string | number) => string;
}>();

const emit = defineEmits<{
  newAccount: [];
  reload: [];
  customFee: [account: any];
}>();

const drawer = ref<any>(null);
const drawerRemount = ref(true);
const formData = ref<Record<string, any>>({});
const showFooter = ref(true);
const automaticCreate = ref<any>({});
const currentAction = computed(() => automaticCreate.value?.actionSlot);
const { memberAccountDepositAmount, memberAccountWithdrawalAmount } =
  memberAccountApi();

const drawerConfigs: Record<string, any> = {
  deposit: {
    width: "w-2/4",
    title: "Deposit Savings Account",
    action: memberAccountDepositAmount,
  },
  withdrawal: {
    width: "w-2/4",
    title: "Withdraw Savings Account",
    action: memberAccountWithdrawalAmount,
  },
};
const drawerTitle = ref<any>(drawerConfigs.deposit);
 
async function handleSave(type?: string) {
  const actionKey = currentAction.value;
  const config = drawerConfigs[actionKey];
  
  if (!config) return;

  drawerRemount.value = await config.action(
    formData.value,
    automaticCreate.value
  );
  emit('reload',drawer.value.drawerOpen)
//   getMemberProfileDetail()
}

function openDrawer(item: any, action: "deposit" | "withdrawal") {
  automaticCreate.value = {
    ...item,
    actionSlot: action,
    member_code: props.member.memeber_code,
    member_name: props.member.full_name,
    blc: item.balance,
    account_type: item.account_type,
    account_code: item.code,
  };
  showFooter.value = true;
  drawerTitle.value = drawerConfigs[action];
  setTimeout(() => drawer.value?.toggleDrawer(), 100);
}
 
const columns = [
  { key: "code", label: "Account Code", sticky: "left", width: "14em",copy:true },
  { key: "account_type", label: "Account Type", width: "14em" },
  { key: "balance", label: "Balance", type: "money" },
  { key: "status", label: "Status", type: "status" },
  { key: "actions", label: "Actions" },
];
</script>