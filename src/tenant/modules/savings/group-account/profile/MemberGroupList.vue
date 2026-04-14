<template>
  <TableDrawer ref="drawer" :showAddButton="false" :data="accounts" :columns="columns" :drawerTitle="drawerTitle?.title"
    :drawerWidth="drawerTitle?.width" :drawerShowFooter="showFooter" :drawerRemount="drawerRemount"
    :automaticCreate="false" :showTableAction="false" :showSearchbar="false" tableDetaultHeight="" @save="handleSave">
    <template #member_code="{ item }">

      <span>
        <CopyData :show="item?.member_code" :copy="item?.member_code">
          <template #text>
            <button @click="navigateToMemberProfile(item)"
              class=" font-semibold text-nfuko-action text-sm dark:text-white  cursor-pointer">
              <span>{{ item?.member_code }}</span>
            </button>
          </template>
        </CopyData>
      </span>
    </template>

    <template #actions="{ item }">
      <div class="flex items-center gap-2">

        <TabelActionButtons v-if="item?.total_loan_balance > 0" @action="() => navigateIntoLoanDetails(item)"
          title="loan details" color="danger" icon="CirclePile" />
        <TabelActionButtons v-else title="loan details" color="default" icon="CirclePile" />
      </div>
    </template>
    <template #drawer="{ action, data }">

    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { TableDrawer, TabelActionButtons, CopyData, setLocalValues } from "@/Global";
import { memberAccountApi, memberProfileApi } from "@/tenant/apis";
import { useRouter } from 'vue-router';
const router = useRouter();
function navigateIntoLoanDetails(item: any) {
  console.log(item);
  router.push(`/tenant/loans/${item?.loan_id}`)

}
function navigateToMemberProfile(item: any) {
  router.push(`/tenant/member/profile`)
  setLocalValues('memberProfile', { ...item, id: item?.id })
}

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
const { memberAccountDepositAmount, memberAccountWithdrawalAmount } = memberAccountApi();

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
  emit('reload', drawer.value.drawerOpen)
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
  { key: "member_code", label: "Member Code", sticky: "left", width: "14em", copy: true },
  { key: "member_name", label: "Member Name", sticky: "left", width: "14em" },
  { key: "member_status", label: "Status", type: "status" },
  { key: "total_loan_balance", label: "Active loan balance", type: "money" },
  { key: "created_at", label: "created_at", width: "14em" },
  { key: "actions", label: "Actions" },
];
</script>