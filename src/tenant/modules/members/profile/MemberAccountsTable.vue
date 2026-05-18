<template>
  <!-- {{ member.id }} -->
  <TableDrawer ref="drawer" :data="accounts" :columns="columns" :drawerTitle="drawerTitle?.title"
    :drawerWidth="drawerTitle?.width" :drawerShowFooter="showFooter" :drawerRemount="drawerRemount"
    :automaticCreate="drawerTitle?.automaticCreate" :showTableAction="false" :showSearchbar="false"
    tableDetaultHeight="" @save="handleSave" :addButtonText="{ text: 'New Account', icon: Plus }" :outerpathlinks="{
      create: '/members-account/create',
    }
      ">

    <template #actions="{ item }">
      <div class="flex items-center gap-2">
        <!-- FD Details button — only for fixed deposit accounts -->
        <button v-if="item.account_type === 'fixed'" @click="viewDrawer?.openDrawer({ id: item.id })"
          class="flex items-center gap-2 px-[14px] py-1.5 text-[12px] font-bold rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
          Fixed Deposit Details
        </button>

        <TabelActionButtons title="withdrawal" color="secondary" icon="CircleMinus"
          @action="() => openDrawer(item, 'withdrawal')" />
        <TabelActionButtons title="deposit" color="custom" icon="CircleDollarSign"
          @action="() => openDrawer(item, 'deposit')" />
      </div>
    </template>
    <template #drawer="{ action, data }">
      
      <Deposit v-if="currentAction === 'deposit'" :data="{...data, action, ...automaticCreate }" v-model:form="formData"
        @success="emit('reload')" />
      
      <Withdrawal v-else-if="currentAction === 'withdrawal'" :data="{ ...data,action, ...automaticCreate }"
        v-model:form="formData" @success="emit('reload')" />
      <Details v-else-if="action === 'view'" :data="data" />
      <Create v-else :disableMemberFields="true" :data="{ ...props.member, member_id: props?.member?.id }"
        @success="emit('reload')" />
    </template>
  </TableDrawer>

  <!-- Full FD account view with interest history and maturity controls -->
  <ViewAccountDrawer ref="viewDrawer" :currency="props.currencyCode" :format-balance="formatBalance"
    :status-class="statusClass" @edit-account="onEditAccount" />

  <EditAccountDrawer ref="editDrawer" :savings-products="savingsProducts" @success="emit('reload')" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Plus } from "lucide-vue-next";
import { Deposit, Withdrawal } from "@/tenant/modules/savings/member-account";
import { memberAccountApi, memberProfileApi } from "@/tenant/apis";
import ViewAccountDrawer from "@/tenant/modules/savings/components/ViewAccountDrawer.vue";
import EditAccountDrawer from "@/tenant/modules/savings/components/EditAccountDrawer.vue";
import { Create } from "@/tenant/modules/savings/member-account/index.ts";
import { savingsProductsApi } from "@/tenant/apis/savingsProducts/api";

memberProfileApi();

const props = defineProps<{
  accounts: any[];
  member: any;
  currencyCode: string;
  formatCurrency: (v?: string | number) => string;
}>();

const emit = defineEmits<{
  newAccount: [];
  reload: [open?: boolean];
  customFee: [account: any];
}>();

const drawer = ref<any>(null);
const viewDrawer = ref<InstanceType<typeof ViewAccountDrawer> | null>(null);
const editDrawer = ref<InstanceType<typeof EditAccountDrawer> | null>(null);
const savingsProducts = ref<any[]>([]);

async function loadSavingsProducts() {
  if (savingsProducts.value.length) return;
  try {
    const res = await savingsProductsApi.list({ status: 'active' });
    savingsProducts.value = res.data?.data ?? [];
  } catch { }
}

async function onEditAccount(account: any) {
  await loadSavingsProducts();
  editDrawer.value?.openDrawer({ id: account.id }, account);
}
const drawerRemount = ref(true);
const formData = ref<Record<string, any>>({});
const showFooter = ref(true);
const automaticCreate = ref<any>({});
const currentAction = computed(() => automaticCreate.value?.actionSlot);
const { memberAccountDepositAmount, memberAccountWithdrawalAmount } = memberAccountApi();

function formatBalance(v: string | number): string {
  const n = Number(v);
  return isNaN(n) ? '—' : `${props.currencyCode} ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

function statusClass(s: string): string {
  if (s === 'active') return 'bg-green-100 text-green-700';
  if (s === 'matured') return 'bg-red-100 text-red-700';
  return 'bg-neutral-100 text-neutral-500';
}

const drawerConfigs: Record<string, any> = {
  deposit: {
    width: "w-2/4",
    title: "Deposit Savings Account",
    action: memberAccountDepositAmount,
    automaticCreate: false
  },
  withdrawal: {
    width: "w-2/4",
    title: "Withdraw Savings Account",
    action: memberAccountWithdrawalAmount,
    automaticCreate: false

  },
  create: {
    width: "w-2/4", 
    title: "Create Savings Account",
    action: () => { },
    automaticCreate: true

  },
};
const drawerTitle = ref<any>(null);

async function handleSave(action) {


  if (action == 'add') {
    drawerTitle.value = drawerConfigs.create;


  } else {

    const actionKey = currentAction.value;
    const config = drawerConfigs[actionKey];
    if (!config) return;
    drawerRemount.value = await config.action(formData.value, automaticCreate.value);
    emit('reload', drawer.value?.drawerOpen);
  }
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
  { key: "code", label: "Account number", sticky: "left", copy: true },
  { key: "account_type", label: "Account Type" },
  { key: "balance", label: "Balance", type: "money" },
  { key: "status", label: "Status", type: "status" },
  { key: "actions", label: "Actions" },
];
watch(
  () => drawer.value?.drawerOpen,
  (v) => {
    if (!v) {
      automaticCreate.value = {};
      if( drawerTitle.value?.title == drawerConfigs?.create?.title){
        emit('reload', drawer.value?.drawerOpen);
        // let not afffect others
    }

    }
  }
);
</script>
