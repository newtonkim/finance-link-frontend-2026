<template>
  <TableDrawer
 
   ref="drawer" :data="accounts" :columns="columns" :drawerTitle="drawerTitle?.title"
    :drawerWidth="drawerTitle?.width" :drawerShowFooter="showFooter" :drawerRemount="drawerRemount"
    :automaticCreate="false" :showTableAction="false" :showSearchbar="false" tableDetaultHeight="" @save="handleSave">
    <template #actions="{ item }">
      <div class="flex items-center gap-2">

        <TabelActionButtons title="withdrawal" color="secondary" icon="CircleMinus"
          @action="() => openDrawer(item, 'withdrawal')" />
        <TabelActionButtons title="deposit" color="custom" icon="CircleDollarSign"
          @action="() => openDrawer(item, 'deposit')" />
      </div>
    </template>
    <template #drawer="{ action, data }">
      <!-- {{ drawerTitle }}== -->
      <Deposit v-if="automaticCreate.actionSlot === 'deposit'" :data="{ action, ...automaticCreate }"
        v-model:form="formData" />
      <Withdrawal v-else-if="automaticCreate.actionSlot === 'withdrawal'" :data="{ action, ...automaticCreate }"
        v-model:form="formData" />

      <CreateGroups v-else :data="data" />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { TableDrawer, TabelActionButtons } from "../../../../../Global/index";
import { CreateGroups, Withdrawal, Deposit, } from './index';
import { groupSavingsApi } from "../../../../apis/savings/group-savingsApi";
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
const { createAgroupSavingAccount, DepositAndWithdrawAgroupSavingAccount } = groupSavingsApi();

const drawerConfigs: Record<string, any> = {
  deposit: {
    width: "w-2/4",
    title: "Deposit Savings Account",
    action: (v, account) => DepositAndWithdrawAgroupSavingAccount(v, 'deposit', account),
  },
  withdrawal: {
    width: "w-2/4",
    title: "Withdraw Savings Account",
    action: (v, account) => DepositAndWithdrawAgroupSavingAccount(v, 'withdrawal', account),
  },
  create: {
    width: "w-2/6",
    title: "Create a group Savings Account",
    action: (v) => createAgroupSavingAccount(v),
  },
};
const drawerTitle = ref<any>(drawerConfigs.create);

async function handleSave(type: string | undefined, data: any, d: any) {
  let success: any = false

  if (drawerConfigs?.[automaticCreate.value.actionSlot]) {
    success = await drawerConfigs?.[automaticCreate.value.actionSlot].action(data, automaticCreate.value);
  } else if (drawerConfigs?.[type] && type == 'create') {
    success = await drawerConfigs?.[type].action(data);
    success = success?.code == 200 ? true : false
  }
  drawerTitle.value = drawerConfigs[type === 'create' || type === 'add' ? 'create' : type];
  if (success) {
    drawer.value.toggleDrawer()
    emit('reload')
  }
}

function openDrawer(item: any, action: "deposit" | "withdrawal") {
  automaticCreate.value = {
    ...item,
    actionSlot: action,
    blc: item.blc,
    status: item.status,
    account_type: item.account_type,
    account_code: item.code,
    group_id: props.member?.id,
  };
  showFooter.value = true;
  drawerTitle.value = drawerConfigs[action];
  setTimeout(() => drawer.value?.toggleDrawer(), 100);
}

const columns = [
  { key: "code", label: "Account code", sticky: "left", copy: true, width: "14em",  },
  { key: "product", label: "Product",   },
  { key: "blc", label: "Balance", type: "money",width: "10em", },
  // { key: "initial_deposit", label: "Initial Deposit", type: "money",width: "10em", },
  // { key: "opening_balance", label: "Opening Balance", type: "money",width: "10em", },
  { key: "status", label: "Status", type: "status" },
  { key: "created_at", label: "Created At", type: "date", },
  { key: "actions", label: "Actions" },
];
watch(() => drawer.value?.drawerOpen, (v) => {
  if (!v) {
    automaticCreate.value = {}
  }
})
</script>
