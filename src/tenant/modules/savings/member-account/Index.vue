<template>
  <TableDrawer :exportItems="exportItems" :drawerShowFooter="showFooter" :drawerRemount="drawerRemount"
    :automaticCreate="!(automaticCreate as any).actionSlot" ref="drawer" :showTableAction="true"
    :drawerWidth="drawerTitle?.width" :url="tableUrl" state="memberAccountList" :drawerTitle="drawerTitle?.title"
    :columns="columns" @save="saveUser">
    <!-- Member — avatar + name + copyable account code -->
    <template #member_name="{ item }">
      <div class="flex items-center gap-3 py-1">
        <div class="size-9 rounded-xl overflow-hidden shrink-0 ring-1 ring-black/5">
          <img v-if="item.member_image" :src="item.member_image" :alt="item.member_name"
            class="size-full object-cover" />
          <div v-else class="size-full bg-nfuko-primary/10 flex items-center justify-center text-[11px] font-black text-nfuko-primary">
            {{ memberInitials(item.member_name) }}
          </div>
        </div>
        <div class="min-w-0">
          <div class="font-bold text-[13px] text-gray-900 dark:text-white truncate">{{ item.member_name }}</div>
          <div class="flex items-center gap-1 mt-0.5">
            <span class="font-mono text-[11px] text-gray-500 truncate">{{ item.account_code }}</span>
            <CopyData :show="item.account_code" />
          </div>
        </div>
      </div>
    </template>

    <!-- Product chip -->
    <template #product="{ item }">
      <span class="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1 text-[12px] font-semibold text-gray-700 capitalize">
        <Wallet :size="13" class="text-gray-400 shrink-0" />
        {{ item.product || '—' }}
      </span>
    </template>

    <!-- Status pill -->
    <template #status="{ item }">
      <span :class="['inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold capitalize ring-1 ring-inset', statusPill(item.status)]">
        <span class="size-1.5 rounded-full" :class="statusDot(item.status)" />
        {{ item.status || '—' }}
      </span>
    </template>

    <!-- Balance — prominent -->
    <template #blc="{ item }">
      <span class="text-[14px] font-black text-gray-900 dark:text-white tabular-nums">{{ currencyCode }} {{ formatMoneyValue(item.blc ?? 0) }}</span>
    </template>

    <!-- Created at -->
    <template #created_at="{ item }">
      <span class="text-[13px] font-medium text-gray-500">{{ fmtDate(item.created_at) }}</span>
    </template>

    <template #actions="{ item }: any">
      <div class="flex items-center gap-2">
        <button @click="OpenThedrawer(item, 'withdrawal')" :disabled="licenseState.readOnly"
          :title="licenseState.readOnly ? 'License expired — renew to withdraw' : ''"
          class="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg text-white bg-[#052659] hover:bg-[#052659]/90 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#052659]">
          <CircleMinus :size="14" /> Withdraw
        </button>
        <button @click="OpenThedrawer(item, 'deposit')" :disabled="licenseState.readOnly"
          :title="licenseState.readOnly ? 'License expired — renew to deposit' : ''"
          class="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600">
          <CircleDollarSign :size="14" /> Deposit
        </button>
      </div>
    </template>
    <template #header-action>
      <PainPageHeader title="Members Savings Account" dec="Manage all member savings accounts and their balances." />
    </template>
    <template #searchSideAction>
      <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
    </template>
    <template #drawer="{ action, data }">

      <uploadTemplateColumData upload-trick="row" v-if="
        [
          'import-accounts',
          'import-deposit-withdrawal',
          'import-opening-balance',
        ].includes((automaticCreate as any).actionSlot)
      " :title="(automaticCreate as any)?.actionSlot" :url="`/members-account/${(automaticCreate as any)?.actionSlot}`"
        :submit-url="(automaticCreate as any).actionSlot" submit="import" />
      <OpeningBalanceTemplate v-else-if="
        automaticCreate?.actionSlot == 'download-account-opening-balance-template'
      " :data="{ action, ...(automaticCreate ?? {}) }" />
      <DepositTemplate v-else-if="automaticCreate?.actionSlot == 'download-deposit-template'"
        :data="{ action, ...(automaticCreate ?? {}) }" />
      <WithdrawalTemplate v-else-if="automaticCreate?.actionSlot == 'download-withdrawal-template'"
        :data="{ action, ...(automaticCreate ?? {}) }" />
      <Deposit v-else-if="automaticCreate?.actionSlot == 'deposit'" :data="{ action, ...(automaticCreate ?? {}) }"
        v-model:form="formData" /> 
      <ExportTemplate v-else-if="automaticCreate?.actionSlot == 'download-memeber-accounts-template'"
        :data="{ action, ...(automaticCreate ?? {}) }" />
      <Withdrawal v-else-if="automaticCreate?.actionSlot == 'withdrawal'" :data="{ action, ...(automaticCreate ?? {}) }"
        v-model:form="formData" />
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
  OpeningBalanceTemplate,
} from ".";
import {
  TableDrawer,
  StatusButtonsHorizontal,
  PainPageHeader,
  CopyData,
  uploadTemplateColumData,
  formatMoneyValue,
} from "@/Global";
import { storeToRefs } from "pinia";
import { Wallet, CircleMinus, CircleDollarSign } from "lucide-vue-next";
import { useCurrencyStore } from "@/stores/currency";
import { memberAccountApi } from "@/tenant/apis";
import { licenseState } from "@/tenant/apis/licenseState";

const { currencyCode } = storeToRefs(useCurrencyStore());

function memberInitials(name?: string): string {
  const words = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return String(name ?? "—").slice(0, 2).toUpperCase();
}
function statusPill(s?: string): string {
  const v = String(s ?? "").toLowerCase();
  if (["active"].includes(v)) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (["suspended", "expired", "closed"].includes(v)) return "bg-rose-50 text-rose-700 ring-rose-600/20";
  if (["trial", "dormant", "pending"].includes(v)) return "bg-amber-50 text-amber-700 ring-amber-600/20";
  return "bg-gray-100 text-gray-500 ring-gray-500/20";
}
function statusDot(s?: string): string {
  const v = String(s ?? "").toLowerCase();
  if (["active"].includes(v)) return "bg-emerald-500";
  if (["suspended", "expired", "closed"].includes(v)) return "bg-rose-500";
  if (["trial", "dormant", "pending"].includes(v)) return "bg-amber-500";
  return "bg-gray-400";
}
function fmtDate(v?: string): string {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
const drawer = ref<any>(null),
  drawerRemount = ref(true),
  automaticCreate = ref<any>({ drawerActions: true, actionSlot: null }),
  exportItems = ref([
    {
      label: "opening balance template",
      action: (vl: any) => {
        automaticCreate.value = {
          actionSlot: "download-account-opening-balance-template",
          item: vl,
        };
        OpenThedrawer(vl, "download-account-opening-balance-template");
      },
    },
    {
      label: "accounts template",
      action: (vl: any) => {
        automaticCreate.value = {
          actionSlot: "download-memeber-accounts-template",
          item: vl,
        };
        OpenThedrawer(vl, "download-memeber-accounts-template");
      },
    },
    {
      label: "deposit template",
      action: (vl: any) => {
        OpenThedrawer(vl, "download-deposit-template");
        automaticCreate.value = { actionSlot: "download-deposit-template", item: vl };
      },
    },
    {
      label: "withdrawal template",
      action: (vl: any) => {
        OpenThedrawer(vl, "download-withdrawal-template");
        automaticCreate.value = { actionSlot: "download-withdrawal-template", item: vl };
      },
    },
    {
      label: "import opening balance",
      action: (vl: any) => {
        automaticCreate.value = {
          actionSlot: "import-opening-balance",
          item: vl,
        };
        OpenThedrawer(vl, "import-opening-balance");
      },
    },
    {
      label: "Import accounts",
      action: (vl: any) => {
        OpenThedrawer(vl, "import-accounts");
        automaticCreate.value = { actionSlot: "import-accounts", item: vl };
      },
    },
    {
      label: "import deposit/withdrawal",
      action: (vl: any) => {
        OpenThedrawer(vl, "import-deposit-withdrawal");
        automaticCreate.value = { actionSlot: "import-deposit-withdrawal", item: vl };
      },
    },
  ]);
const formData = ref<Record<string, any>>({}),
  statusFilter = ref("all"),
  showFooter = ref(true),
  { memberAccountDepositAmount, memberAccountWithdrawalAmount } = memberAccountApi(),
  drawerTitle = ref<any>({ title: 'Members Savings Account', width: 'w-2/3' }),
  filters = ["all", "active", "suspended", "expired", "trial"],
  tableUrl = computed(() => `/members-account/list?status=${statusFilter.value}`);
const title: Record<string, any> = {
  view: { title: "View member saving's Account Details", width: "w-2/3" },
  edit: { title: "Edit member saving's Account", width: "w-2/3" },
  add: { title: "Create a member saving's Account", width: "w-2/4" },
  deposit: {
    width: "w-2/4",
    title: "deposit Saving's Account",
    fun: async () => {
      drawerRemount.value = await memberAccountDepositAmount(
        formData.value,
        automaticCreate.value
      );
    },
  }, // this will be the deposite
  withdrawal: {
    width: "w-2/4",
    title: "withdrawal Saving's Account",
    fun: async () => {
      drawerRemount.value = await memberAccountWithdrawalAmount(
        formData.value,
        automaticCreate.value
      );
    },
  }, // this will be the withdrawal
};
// automaticCreate.actionSlot// this will help switch off the default drawer actions  and use out side action
function saveUser(type: string, data: any) {
  if (title?.[automaticCreate.value.actionSlot]) {
    // let check if there is an action slot has its own action we use that action instead of the default ones
    title?.[automaticCreate.value.actionSlot]?.fun?.();
    if (type == 'create') {
      drawer.value?.toggleDrawer();
    }
    return;
  }
  if (["add", "edit", "view", "edit"].includes(type)) automaticCreate.value = { actionSlot: null };
  if (title?.[type]) {
    drawerTitle.value = title?.[type];
  }
  title?.[type]?.fun?.();
  if (!["withdrawal", "deposit", "edit", "add", "view"].includes(type)) {
    drawer.value?.toggleDrawer(); // close the drawer
  }
}

const columns = [
  { key: "member_name", label: "Member", sticky: "left", width: "14em " },
  { key: "product", label: "product", sticky: "left", width: "14em " },
  { key: "status", label: "status", type: "status" },
  { key: "blc", label: "balance", type: "money" },
  { key: "created_at", label: "created at", type: "status" },
  { key: "actions", label: "Actions", show: ["view", "edit", "delete"] },
];

function OpenThedrawer(item: any, action = "deposit") {
  automaticCreate.value = { actionSlot: action, ...item };
  showFooter.value = ["withdrawal", "deposit"].includes(action);
  //   showFooter.value = ["withdrawal", "deposit"].includes(action);
  drawerTitle.value = title?.[action];
  setTimeout(() => {
    drawer.value?.toggleDrawer();
  }, 100);
}

watch(
  () => drawer.value?.drawerOpen,
  (v) => {
    if (!v) {
      formData.value = {};
      // showFooter.value = false;
      automaticCreate.value = { actionSlot: null };
      drawerTitle.value = { title: 'Members Savings Account', width: 'w-2/3' };
    }
  }
);
</script>
