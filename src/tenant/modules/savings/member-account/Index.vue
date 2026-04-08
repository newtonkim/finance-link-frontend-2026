<template>
  <TableDrawer
    :exportItems="exportItems"
    :drawerShowFooter="showFooter"
    :drawerRemount="drawerRemount"
    :automaticCreate="!automaticCreate.actionSlot"
    ref="drawer"
    :showTableAction="true"
    :drawerWidth="drawerTitle?.width"
    :url="tableUrl"
    state="memberAccountList"
    :drawerTitle="drawerTitle?.title"
    :columns="columns"
    @save="saveUser"
  >
    <template #member_name="{ item }">
      <div class="-1">
        <div class="font-semibold text-nfuko-action text-sm dark:text-white">
          {{ item.member_name }}
        </div>
        <CopyData :show="item.account_code" />
        <div class="text-[11px] uppercase tracking-wide">
          {{ item.type }}
        </div>
      </div>
    </template>
    <template #actions="{ item }: { item: any }">
      <div class="flex items-center gap-2">
        <TabelActionButtons
          @action="() => OpenThedrawer(item, 'withdrawal')"
          title="withdrawal"
          color="secondary"
          icon="CircleMinus"
        />
        <TabelActionButtons
          @action="() => OpenThedrawer(item, 'deposit')"
          title="deposit"
          color="danger"
          icon="CircleDollarSign"
        />
      </div>
    </template>
    <template #header-action>
      <PainPageHeader
        title="Members Savings Account"
        dec="Manage all member savings accounts and their balances."
      />
    </template>
    <template #searchSideAction>
      <StatusButtonsHorizontal
        v-memo="[statusFilter]"
        :filters="filters"
        v-model="statusFilter"
      />
    </template>
    <template #drawer="{ action, data }">
      <!-- ( {{ automaticCreate }}) -->
      <uploadTemplateColumData
        upload-trick="row"
        v-if="
          ['import-accounts', 'import-deposit-withdrawal'].includes(
            automaticCreate.actionSlot
          )
        "
        :title="automaticCreate?.actionSlot"
        :url="`/members-account/${automaticCreate?.actionSlot}`"
        :submit-url="automaticCreate.actionSlot"
      />
      <DepositTemplate
        v-else-if="automaticCreate?.actionSlot == 'download-deposit-template'"
        :data="{ action, ...(automaticCreate ?? {}) }"
      />
      <WithdrawalTemplate
        v-else-if="automaticCreate?.actionSlot == 'download-withdrawal-template'"
        :data="{ action, ...(automaticCreate ?? {}) }"
      />
      <Deposit
        v-else-if="automaticCreate?.actionSlot == 'deposit'"
        :data="{ action, ...(automaticCreate ?? {}) }"
        v-model:form="formData"
      />
      <ExportTemplate
        v-else-if="automaticCreate?.actionSlot == 'download-memeber-accounts-template'"
        :data="{ action, ...(automaticCreate ?? {}) }"
      />
      <Withdrawal
        v-else-if="automaticCreate?.actionSlot == 'withdrawal'"
        :data="{ action, ...(automaticCreate ?? {}) }"
        v-model:form="formData"
      />
      <Details v-else-if="['view'].includes(action)" :data="data" />
      <Edit v-else-if="action === 'edit'" :data="{ ...data, action }" />
      <Create v-else :data="{ ...data, action }" />
      <!-- <Create v-else="['add', 'edit',''].includes(action)" :data="{ ...data, action }" /> -->
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  Create,
  Details,
  Deposit,
  Withdrawal,
  ExportTemplate,
  DepositTemplate,
  Edit,
  WithdrawalTemplate,
} from ".";
import {
  TableDrawer,
  StatusButtonsHorizontal,
  PainPageHeader,
  CopyData,
  TabelActionButtons,
  uploadTemplateColumData,
} from "@/Global";
import { memberAccountApi } from "@/tenant/apis";
const drawer = ref(null),
  drawerRemount = ref(true),
  automaticCreate = ref({ drawerActions: true, actionSlot: null }),
  exportItems = ref([
    {
      label: "accounts template",
      action: (vl) => {
        automaticCreate.value = {
          actionSlot: "download-memeber-accounts-template",
          item: vl,
        };
        OpenThedrawer(vl, "download-memeber-accounts-template");
      },
    },
    {
      label: "deposit template",
      action: (vl) => {
        OpenThedrawer(vl, "download-deposit-template");
        automaticCreate.value = { actionSlot: "download-deposit-template", item: vl };
      },
    },
    {
      label: "withdrawal template",
      action: (vl) => {
        OpenThedrawer(vl, "download-withdrawal-template");
        automaticCreate.value = { actionSlot: "download-withdrawal-template", item: vl };
      },
    },
    {
      label: "Import accounts",
      action: (vl) => {
        OpenThedrawer(vl, "import-accounts");
        automaticCreate.value = { actionSlot: "import-accounts", item: vl };
      },
    },
    {
      label: "import deposit/withdrawal",
      action: (vl) => {
        OpenThedrawer(vl, "import-deposit-withdrawal");
        automaticCreate.value = { actionSlot: "import-deposit-withdrawal", item: vl };
      },
    },
  ]);
const formData = ref<Record<string, any>>({}),
  statusFilter = ref("all"),
  showFooter = ref(true),
  { memebrAccountDepositAmount, memebrAccountWithdrawalAmount } = memberAccountApi(),
  drawerTitle = ref("Create Tenant"),
  filters = ["all", "active", "suspended", "expired", "trial"],
  tableUrl = computed(() => `/members-account/list?status=${statusFilter.value}`),
  title: Record<string, string> = {
    view: { title: "Viewmember saving's Account Details", width: "w-3/5" },
    edit: { title: "Edit member saving's Account", width: "w-1/3" },
    add: { title: "Create a member saving's Account", width: "w-2/4" },
    deposit: {
      width: "w-3/4",
      title: "deposit Saving's Account",
      fun: async () => {
        drawerRemount.value = await memebrAccountDepositAmount(
          formData.value,
          automaticCreate.value
        );
      },
    }, // this will be the deposite
    withdrawal: {
      width: "w-3/4",
      title: "withdrawal Saving's Account",
      fun: async () => {
        drawerRemount.value = await memebrAccountWithdrawalAmount(
          formData.value,
          automaticCreate.value
        );
      },
    }, // this will be the withdrawal
  };
// automaticCreate.actionSlot// this will help switch off the default drawer actions  and use out side action
function saveUser(type: string, data: any) {
  if (!type && title?.[automaticCreate.value.actionSlot]) {
    // let check if there is an action slot has its own action we use that action instead of the default ones
    title?.[automaticCreate.value.actionSlot]?.fun?.();
    return;
  }
  if (["add", "edit", "view", "edit"].includes(type)) automaticCreate.value = {};
  if (title?.[type]) {
    drawerTitle.value = title?.[type];
  }
  title?.[type]?.fun?.();
  if (!["withdrawal", "deposit", "edit", "add", "view"].includes(type)) {
    drawer.value.toggleDrawer(); // close the drawer
  }
  // // // // automaticCreate.value.actionSlot=automaticCreate.value.actionSlot
  //   automaticCreate.value = {}; // celan the automatic create
}

const columns = [
  { key: "member_name", label: "Member", sticky: "left", width: "14em " },
  { key: "product", label: "product", sticky: "left", width: "14em " },
  { key: "status", label: "status", type: "status" },
  { key: "blc", label: "balance", type: "money" },
  { key: "created at", label: "created at", type: "status" },
  { key: "actions", label: "Actions", show: ["view", "edit", "delete"] },
];

function OpenThedrawer(item: any, action = "deposit") {
  automaticCreate.value = { actionSlot: action, ...item };
  showFooter.value = ["withdrawal", "deposit"].includes(action);
  //   showFooter.value = ["withdrawal", "deposit"].includes(action);
  drawerTitle.value = title?.[action];
  setTimeout(() => {
    drawer.value.toggleDrawer();
  }, 100);
} 
</script>
