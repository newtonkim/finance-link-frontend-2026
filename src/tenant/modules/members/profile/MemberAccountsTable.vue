<template>
  <!-- {{ member.id }} -->
  <TableDrawer ref="drawer" :data="accounts" :columns="columns" :drawerTitle="drawerTitle?.title"
    :drawerWidth="drawerTitle?.width" :drawerShowFooter="showFooter" :drawerRemount="drawerRemount"
    :automaticCreate="drawerTitle?.automaticCreate" :showTableAction="false" :showSearchbar="false"
    tableDetaultHeight="" @save="handleSave" :addButtonText="{ text: 'New Account', icon: Plus }" :outerpathlinks="{
      create: '/members-account/create',
    }
      ">

    <!-- Account number — icon + monospace code + copy -->
    <template #code="{ item }">
      <div class="flex items-center gap-3 py-1">
        <button type="button" @click="openAccountView(item)" title="Open account"
          class="size-9 rounded-xl bg-[#cda434]/10 flex items-center justify-center shrink-0 transition-colors hover:bg-[#cda434]/20">
          <Landmark :size="16" class="text-[#cda434]" />
        </button>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <button type="button" @click="openAccountView(item)" title="Open account for full view"
              class="font-mono font-bold text-[13px] text-gray-900 truncate underline-offset-2 transition-colors hover:text-[#cda434] hover:underline">
              {{ item.code }}
            </button>
            <button @click="copyCode(item.code)" class="shrink-0 text-gray-300 hover:text-[#cda434] transition-colors" title="Copy account number">
              <component :is="copiedCode === item.code ? Check : Copy" :size="13" :class="copiedCode === item.code ? 'text-emerald-500' : ''" />
            </button>
          </div>
          <span class="text-[11px] font-medium text-gray-400">Savings Account</span>
        </div>
      </div>
    </template>

    <!-- Account type — product chip -->
    <template #account_type="{ item }">
      <span class="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1 text-[12px] font-semibold text-gray-700 capitalize">
        <Wallet :size="13" class="text-gray-400 shrink-0" />
        {{ item.account_type || '—' }}
      </span>
    </template>

    <!-- Balance — prominent -->
    <template #balance="{ item }">
      <div class="flex flex-col">
        <span class="text-[15px] font-black text-gray-900 tabular-nums leading-tight">{{ currencyCode }} {{ formatCurrency(item.balance) }}</span>
        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-300">Available balance</span>
      </div>
    </template>

    <!-- Status — refined pill -->
    <template #status="{ item }">
      <span :class="['inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold capitalize ring-1 ring-inset', statusPill(item.status)]">
        <span class="size-1.5 rounded-full" :class="statusDot(item.status)" />
        {{ item.status || '—' }}
      </span>
    </template>

    <template #actions="{ item }">
      <div class="flex items-center justify-end gap-2">
        <!-- FD Details button — only for fixed deposit accounts -->
        <button v-if="item.account_type === 'fixed'" @click="viewDrawer?.openDrawer({ id: item.id })"
          class="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
          Fixed Deposit
        </button>

        <button @click="openDrawer(item, 'withdrawal')"
          class="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors">
          <CircleMinus :size="14" /> Withdraw
        </button>
        <button @click="openDrawer(item, 'deposit')"
          class="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold rounded-lg text-white bg-[#cda434] hover:bg-[#b8932e] shadow-sm transition-colors">
          <CircleDollarSign :size="14" /> Deposit
        </button>
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
import { Plus, Landmark, Wallet, Copy, Check, CircleMinus, CircleDollarSign } from "lucide-vue-next";
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

// Open the full savings-account view (balance, product, and — for fixed
// deposits — maturity/interest) when a member clicks the account number.
function openAccountView(account: any) {
  viewDrawer.value?.openDrawer({ id: account.id });
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

// ── Cell presentation helpers ────────────────────────────────────────────────
const copiedCode = ref<string | null>(null);
function copyCode(code: string) {
  if (!code) return;
  navigator.clipboard?.writeText(code).then(() => {
    copiedCode.value = code;
    setTimeout(() => (copiedCode.value = null), 1500);
  });
}

function statusPill(s?: string): string {
  const v = String(s ?? '').toLowerCase();
  if (v === 'active') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  if (v === 'matured') return 'bg-rose-50 text-rose-700 ring-rose-600/20';
  if (['dormant', 'inactive', 'closed'].includes(v)) return 'bg-amber-50 text-amber-700 ring-amber-600/20';
  return 'bg-gray-100 text-gray-500 ring-gray-500/20';
}
function statusDot(s?: string): string {
  const v = String(s ?? '').toLowerCase();
  if (v === 'active') return 'bg-emerald-500';
  if (v === 'matured') return 'bg-rose-500';
  if (['dormant', 'inactive', 'closed'].includes(v)) return 'bg-amber-500';
  return 'bg-gray-400';
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
