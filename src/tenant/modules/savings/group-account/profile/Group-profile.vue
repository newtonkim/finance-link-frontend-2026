<script setup lang="ts">
import { ref, computed, onBeforeMount } from "vue";
import { toast } from "vue-sonner";
import { storeToRefs } from "pinia";
import { FileText, Wallet, Users, Landmark, Wallet2, Check, Copy } from "lucide-vue-next";
import { formatMoneyValue, formatCurrency, getInitials } from "../../../../../Global/index";
import { tenantClient } from "../../../../apis/tenantClient";
import { useCurrencyStore } from "../../../../../stores/currency";
import { groupSavingsApi } from "../../../../apis/savings/group-savingsApi";
import {
  GroupMembersWithLoansTab,
  MemberAccountsTable,
  MemberTransactionsTab,
  MemberGroupList,
} from "./index";
import DepositWithdrawDrawer from "../../../members/profile/DepositWithdrawDrawer.vue";
import NewAccountDrawer from "../../../members/profile/NewAccountDrawer.vue";
import CustomFeeDrawer from "./CustomFeeDrawer.vue";
import { pomPinia } from "septor-store";
const { getGroupProfileDetail } = groupSavingsApi();
const { currencyCode } = storeToRefs(useCurrencyStore());
const pageLoading = ref<any>(null);
const profileDetails = ref<any>(null);
const member = ref<any>({});

// ── Derived group figures ─────────────────────────────────────────────────────
const g = computed<any>(() => profileDetails.value?.details ?? {});
const accounts = computed<any[]>(() =>
  Array.isArray(profileDetails.value?.accounts) ? profileDetails.value.accounts : [],
);
const members = computed<any[]>(() =>
  Array.isArray(profileDetails.value?.members) ? profileDetails.value.members : [],
);
const groupName = computed(() => g.value?.group_name || g.value?.name || "Unnamed group");
const groupImage = computed(() => {
  const raw = g.value?.group_image;
  return raw ? String(raw).replace("/public/", "/storage/") : "";
});
const pooledSavings = computed(() => {
  const stated = g.value?.available_balance;
  if (stated != null && stated !== "" && !isNaN(Number(stated))) return Number(stated);
  return accounts.value.reduce((sum, a) => sum + Number(a?.balance ?? 0), 0);
});
const activeAccounts = computed(
  () => accounts.value.filter((a) => String(a?.status ?? "").toLowerCase() === "active").length,
);
const avgPerMember = computed(() =>
  members.value.length ? pooledSavings.value / members.value.length : 0,
);
const kpis = computed(() => [
  { label: "Members", value: String(members.value.length), sub: "In this group", icon: Users },
  { label: "Savings accounts", value: String(accounts.value.length), sub: `${activeAccounts.value} active`, icon: Landmark },
  { label: "Average per member", value: `${currencyCode.value} ${formatMoneyValue(avgPerMember.value)}`, sub: "Pooled ÷ members", icon: Wallet2 },
  { label: "Pooled savings", value: `${currencyCode.value} ${formatMoneyValue(pooledSavings.value)}`, sub: "Across all accounts", icon: Wallet, accent: true },
]);

function groupStatusPill(status?: string) {
  const v = String(status ?? "").toLowerCase();
  if (v === "active") return "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30";
  if (["suspended", "expired", "closed"].includes(v)) return "bg-rose-400/15 text-rose-200 ring-rose-300/30";
  if (["trial", "pending", "dormant"].includes(v)) return "bg-amber-400/15 text-amber-100 ring-amber-300/30";
  return "bg-white/10 text-white/80 ring-white/20";
}

const codeCopied = ref(false);
function copyGroupCode() {
  const code = g.value?.group_code;
  if (!code) return;
  navigator.clipboard?.writeText(String(code)).then(() => {
    codeCopied.value = true;
    setTimeout(() => (codeCopied.value = false), 1500);
  });
}

async function initialize() {
  const details = await getGroupProfileDetail({});
  let data = {};

  if (details) {
    const { group_details, group_accounts, group_members } = details;
    for (const key in group_details) {
      const element = group_details[key];
      data[key] = element;
    }
    profileDetails.value = {
      details: data,
      accounts: group_accounts,
      members: group_members,
    };
  }
  pageLoading.value = false;
}

// ── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref("members");
onBeforeMount(() => {
  // profileDetails.value = null
  initialize();
  // fetchMember()
});

const tabs = computed(() => [
  { id: "members", label: "group members", icon: Users, count: null },
  {
    id: "transactions",
    label: "group Transactions",
    icon: FileText,
    count: (member.value as any)?.transactions?.length || 0,
  },
  //   { id: "Gurrantors", label: "Gurrantors", icon: Wallet, count:null },
  { id: "loans", label: "group Member With Loans", icon: Wallet, count: (member.value as any)?.loans?.length || 0 },
]);

// ── Drawer refs ──────────────────────────────────────────────────────────────
const depositDrawer = ref<InstanceType<typeof DepositWithdrawDrawer> | null>(null);
const newAccountDrawer = ref<InstanceType<typeof NewAccountDrawer> | null>(null);
const customFeeDrawer = ref<InstanceType<typeof CustomFeeDrawer> | null>(null);

// ── Transaction reversal ────────────────────────────────────────────────────
const showTxnDeleteDialog = ref(false);
const txnToDelete = ref<any>(null);
const isDeletingTxn = ref(false);

const confirmDeleteTxn = (txn: any) => {
  if (txn.is_reversed || txn.type === "reversal" || txn.is_reversible === false) return;
  txnToDelete.value = txn;
  showTxnDeleteDialog.value = true;
};

const executeDeleteTxn = async () => {
  if (!txnToDelete.value) return;
  isDeletingTxn.value = true;
  try {
    await tenantClient.post(`/transactions/${txnToDelete.value.id}/reverse`);
    toast.success("Transaction reversed successfully.");
    showTxnDeleteDialog.value = false;
    txnToDelete.value = null;
    // Refresh member data so balances and the full transaction list are up to date
    // fetchMember(true);
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to reverse transaction.");
  } finally {
    isDeletingTxn.value = false;
  }
};

// ── Receipt printing ─────────────────────────────────────────────────────────
const printingTxn = ref<any>(null);

const printReceipt = (txn: any) => {
  printingTxn.value = txn;
  setTimeout(() => {
    document.body.classList.add("receipt-print");
    window.print();
    printingTxn.value = null;
    document.body.classList.remove("receipt-print");
  }, 100);
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

</script>

<template>
  <!-- Loading state -->
  <!-- Loading -->
  <div v-if="pageLoading" class="flex items-center justify-center min-h-[60vh]">
    <div class="flex flex-col items-center gap-3">
      <div class="relative h-12 w-12">
        <div class="absolute inset-0 rounded-full border-4 border-[#cda434]/20"></div>
        <div
          class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#cda434] border-r-[#cda434] animate-spin">
        </div>
        <div class="absolute inset-2 rounded-full bg-[#cda434]/10"></div>
      </div>
      <div class="text-[12px] font-bold uppercase tracking-widest text-[#cda434]">
        Loading Member Data
      </div>
    </div>
  </div>

  <!-- Main -->
  <div v-else class="min-h-screen bg-[#f6f7f9] dark:bg-neutral-950">
    <div class="mx-auto flex max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <!-- ───────────── Ledger cover ───────────── -->
      <section
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f1b2d] via-[#182538] to-[#1e3252] p-6 shadow-lg shadow-[#0f1b2d]/20 sm:p-8">
        <div class="pointer-events-none absolute inset-0 opacity-[0.06]" :style="{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 36px)',
        }" />
        <div class="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[#cda434]/15 blur-3xl" />

        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <!-- identity -->
          <div class="flex min-w-0 items-center gap-5">
            <div
              class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-2 ring-[#cda434]/50">
              <img v-if="groupImage" :src="groupImage" :alt="groupName" class="size-full object-cover" />
              <span v-else class="text-2xl font-black text-[#cda434]">{{ getInitials(groupName) }}</span>
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#cda434]">Savings group</span>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset"
                  :class="groupStatusPill(g.status)">
                  <span class="size-1.5 rounded-full bg-current opacity-70" />{{ g.status || "unknown" }}
                </span>
              </div>
              <h1 class="mt-1 truncate text-2xl font-black tracking-tight text-white sm:text-3xl">{{ groupName }}</h1>
              <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
                <button type="button" @click="copyGroupCode"
                  class="inline-flex items-center gap-1 font-mono text-[#cda434] transition-colors hover:text-[#e0c063]">
                  {{ g.group_code || "—" }}
                  <Check v-if="codeCopied" :size="12" class="text-emerald-300" />
                  <Copy v-else :size="12" class="opacity-60" />
                </button>
                <span class="text-white/25">·</span>
                <span>Opened {{ formatDate(g.created_at) }}</span>
                <template v-if="g.created_by"><span class="text-white/25">·</span><span>by {{ g.created_by }}</span></template>
                <template v-if="g.phone"><span class="text-white/25">·</span><span class="font-mono">{{ g.phone }}</span></template>
              </div>
            </div>
          </div>

          <!-- pooled savings hero -->
          <div class="shrink-0 rounded-2xl bg-white/[0.06] px-5 py-4 ring-1 ring-white/10 lg:text-right">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-[#cda434]/80">Pooled savings</p>
            <p class="mt-1 text-3xl font-black tabular-nums tracking-tight text-white sm:text-[2.25rem]">
              <span class="text-base font-bold text-white/50">{{ currencyCode }}</span>
              {{ formatMoneyValue(pooledSavings) }}
            </p>
            <div class="mt-1.5 flex gap-4 text-xs text-white/55 lg:justify-end">
              <span><b class="text-white">{{ members.length }}</b> members</span>
              <span><b class="text-white">{{ accounts.length }}</b> accounts</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ───────────── KPI strip ───────────── -->
      <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="k in kpis" :key="k.label"
          class="rounded-2xl border bg-white p-4 shadow-sm dark:bg-neutral-900"
          :class="k.accent ? 'border-[#cda434]/40 bg-[#faf6ea] dark:bg-[#cda434]/5' : 'border-neutral-200 dark:border-neutral-800'">
          <div class="flex items-start justify-between">
            <span class="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">{{ k.label }}</span>
            <span class="flex size-8 items-center justify-center rounded-lg"
              :class="k.accent ? 'bg-[#cda434]/15 text-[#cda434]' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'">
              <component :is="k.icon" :size="16" />
            </span>
          </div>
          <p class="mt-2.5 truncate text-xl font-black tracking-tight text-neutral-900 dark:text-white">{{ k.value }}</p>
          <p class="mt-0.5 text-xs font-medium text-neutral-400">{{ k.sub }}</p>
        </div>
      </section>

      <!-- ───────────── Group savings accounts ───────────── -->
      <section v-if="accounts.length" class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header class="flex items-center gap-2 border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
          <Landmark :size="16" class="text-[#cda434]" />
          <h2 class="text-sm font-bold text-neutral-800 dark:text-neutral-100">Group savings accounts</h2>
        </header>
        <div class="w-full overflow-x-auto">
          <MemberAccountsTable @reload="initialize" :member="g" :accounts="accounts"
            :currency-code="currencyCode" :format-currency="formatCurrency"
            @new-account="newAccountDrawer?.openDrawer()"
            @custom-fee="(account) => customFeeDrawer?.openDrawer(account)" />
        </div>
      </section>

      <!-- ───────────── Tabs ───────────── -->
      <section class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex gap-1 overflow-x-auto border-b border-neutral-100 px-3 dark:border-neutral-800">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
            'relative flex items-center gap-2 whitespace-nowrap px-4 py-3.5 text-[13px] font-bold capitalize transition-colors',
            activeTab === tab.id ? 'text-[#182538] dark:text-white' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
          ]">
            <component :is="tab.icon" :size="16" />
            {{ tab.label }}
            <span v-if="tab.count !== null"
              class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md bg-neutral-100 px-1.5 font-mono text-[11px] font-bold text-neutral-500 dark:bg-neutral-800">
              {{ tab.count }}
            </span>
            <span v-if="activeTab === tab.id" class="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-[#cda434]" />
          </button>
        </div>

        <div v-if="activeTab === 'members'" class="w-full overflow-x-auto">
          <MemberGroupList @reload="initialize" :member="profileDetails?.members ?? {}" :accounts="members"
            :currency-code="currencyCode" :format-currency="formatCurrency"
            @new-account="newAccountDrawer?.openDrawer()" />
        </div>
        <div v-else-if="activeTab === 'transactions'" class="w-full overflow-x-auto">
          <MemberTransactionsTab :transactions="member?.transactions" mode="all" action-color="bg-[#cda434]"
            :format-date="formatDate" :format-date-time="formatDateTime" :format-currency="formatCurrency"
            @print="printReceipt" />
        </div>
        <div v-else-if="activeTab === 'loans'" class="w-full overflow-x-auto">
          <GroupMembersWithLoansTab mode="all" action-color="bg-[#cda434]" :format-date="formatDate"
            :format-date-time="formatDateTime" :format-currency="formatCurrency" @print="printReceipt" />
        </div>
      </section>
    </div>
  </div>
</template>

<style>
@media print {
  body.receipt-print * {
    visibility: hidden !important;
  }

  body.receipt-print .print-only,
  body.receipt-print .print-only * {
    visibility: visible !important;
  }

  body.receipt-print .print-only {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
  }

  body.receipt-print .no-print {
    display: none !important;
  }

  @page {
    margin: 0.5cm;
    size: auto;
  }
}

.print-only {
  display: none;
}
</style>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
