<script setup lang="ts">
import { ref, computed, onBeforeMount } from "vue";
import { toast } from "vue-sonner";
import { storeToRefs } from "pinia";
import {
  FileText, Wallet, Users, Landmark, Phone, Hash, Calendar, MapPin, ShieldCheck, User, Check, Copy, UserPlus,
} from "lucide-vue-next";
import { formatCurrency, getInitials, Drawer, getLocalValues } from "../../../../../Global/index";
import { tenantClient } from "../../../../apis/tenantClient";
import { useCurrencyStore } from "../../../../../stores/currency";
import { groupSavingsApi } from "../../../../apis/savings/group-savingsApi";
import {
  GroupMembersWithLoansTab,
  MemberAccountsTable,
  MemberTransactionsTab,
  MemberGroupList,
  MemberSidebar,
} from "./index";
import { AddGroupTab } from "../index";
import DepositWithdrawDrawer from "../../../members/profile/DepositWithdrawDrawer.vue";
import NewAccountDrawer from "../../../members/profile/NewAccountDrawer.vue";
import CustomFeeDrawer from "./CustomFeeDrawer.vue";
const { getGroupProfileDetail, addNoneExistingMember } = groupSavingsApi();
const { currencyCode } = storeToRefs(useCurrencyStore());
const pageLoading = ref<any>(null);
const profileDetails = ref<any>(null);
const member = ref<any>({});
const uploadProcessing = ref(false);
const memberInitials = computed(() => getInitials(profileDetails.value?.details?.name || profileDetails.value?.details?.group_name || ""));

const details = computed<Record<string, any>>(() => profileDetails.value?.details ?? {});
const members = computed<any[]>(() => (Array.isArray(profileDetails.value?.members) ? profileDetails.value.members : []));

// ── Add member to this group ─────────────────────────────────────────────────
const groupId = computed<any>(() => getLocalValues("groupProfile" as any)?.id ?? details.value?.id);
const addMemberOpen = ref(false);
const addForm = ref<any>({});
const addSubmitting = ref(false);
async function submitAddMember() {
  addSubmitting.value = true;
  try {
    const res = await addNoneExistingMember(addForm.value, { id: groupId.value });
    if (res?.success !== false) {
      addMemberOpen.value = false;
      addForm.value = {};
      await initialize();
    }
  } finally {
    addSubmitting.value = false;
  }
}

async function initialize() {
  const res = await getGroupProfileDetail({});
  let data: Record<string, any> = {};
  if (res) {
    const { group_details, group_accounts, group_members } = res;
    for (const key in group_details) data[key] = group_details[key];
    profileDetails.value = { details: data, accounts: group_accounts, members: group_members };
  }
  pageLoading.value = false;
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
const activeTab = ref("profile");
onBeforeMount(() => initialize());

const tabs = computed(() => [
  { id: "profile", label: "group Profile", icon: User, count: null },
  { id: "members", label: "group members", icon: Users, count: members.value.length || null },
  { id: "transactions", label: "group Transactions", icon: FileText, count: (member.value as any)?.transactions?.length || 0 },
  { id: "loans", label: "group Member With Loans", icon: Wallet, count: (member.value as any)?.loans?.length || 0 },
]);

// ── Group profile sections (mirrors the member profile) ──────────────────────
function fieldValue(key: string): string | null {
  const v = details.value[key];
  if (v === null || v === undefined || v === "" || v === "—") return null;
  return String(v);
}

const copiedKey = ref<string | null>(null);
function copyField(key: string) {
  const v = fieldValue(key);
  if (!v) return;
  navigator.clipboard?.writeText(v).then(() => {
    copiedKey.value = key;
    setTimeout(() => (copiedKey.value = null), 1500);
  });
}

function badgeClass(value: string): string {
  const s = value.toLowerCase();
  if (["active", "approved", "verified"].includes(s)) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (["standard"].includes(s)) return "bg-teal-50 text-teal-700 ring-teal-600/20";
  if (["inactive", "suspended", "dormant", "rejected", "closed", "expired"].includes(s)) return "bg-rose-50 text-rose-700 ring-rose-600/20";
  if (["pending", "trial"].includes(s)) return "bg-amber-50 text-amber-700 ring-amber-600/20";
  return "bg-gray-100 text-gray-600 ring-gray-500/20";
}

interface ProfileField { key: string; label: string; icon: any; type?: "date" | "currency" | "badge" | "copy" }
interface ProfileSection { title: string; icon: any; fields: ProfileField[] }

const profileSections = computed<ProfileSection[]>(() => [
  {
    title: "Group Information", icon: Landmark, fields: [
      { key: "group_name", label: "Group Name", icon: Landmark },
      { key: "group_code", label: "Group Code", icon: Hash, type: "copy" },
      { key: "location", label: "Location", icon: MapPin },
      { key: "description", label: "Description", icon: FileText },
      { key: "created_at", label: "Opened", icon: Calendar, type: "date" },
    ],
  },
  {
    title: "Contact", icon: Phone, fields: [
      { key: "phone", label: "Primary Contact", icon: Phone },
      { key: "phone2", label: "Other Contact", icon: Phone },
    ],
  },
  {
    title: "Membership", icon: ShieldCheck, fields: [
      { key: "status", label: "Status", icon: ShieldCheck, type: "badge" },
      { key: "created_by", label: "Registered By", icon: User },
      { key: "created_at", label: "Created At", icon: Calendar, type: "date" },
    ],
  },
  {
    title: "Financial", icon: Wallet, fields: [
      { key: "available_balance", label: "Pooled Savings", icon: Wallet, type: "currency" },
      { key: "opening_balance", label: "Opening Balance", icon: Wallet, type: "currency" },
      { key: "initial_deposit", label: "Initial Deposit", icon: Wallet, type: "currency" },
    ],
  },
]);

// ── Drawer refs ──────────────────────────────────────────────────────────────
const depositDrawer = ref<InstanceType<typeof DepositWithdrawDrawer> | null>(null);
const newAccountDrawer = ref<InstanceType<typeof NewAccountDrawer> | null>(null);
const customFeeDrawer = ref<InstanceType<typeof CustomFeeDrawer> | null>(null);

// ── Transaction reversal ─────────────────────────────────────────────────────
const showTxnDeleteDialog = ref(false);
const txnToDelete = ref<any>(null);
const isDeletingTxn = ref(false);

const executeDeleteTxn = async () => {
  if (!txnToDelete.value) return;
  isDeletingTxn.value = true;
  try {
    await tenantClient.post(`/transactions/${txnToDelete.value.id}/reverse`);
    toast.success("Transaction reversed successfully.");
    showTxnDeleteDialog.value = false;
    txnToDelete.value = null;
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
  return new Date(dateString).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const formatDateTime = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });
};
</script>

<template>
  <!-- Loading -->
  <div v-if="pageLoading" class="flex items-center justify-center min-h-[60vh]">
    <div class="flex flex-col items-center gap-3">
      <div class="relative h-12 w-12">
        <div class="absolute inset-0 rounded-full border-4 border-[#cda434]/20"></div>
        <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#cda434] border-r-[#cda434] animate-spin"></div>
        <div class="absolute inset-2 rounded-full bg-[#cda434]/10"></div>
      </div>
      <div class="text-[12px] font-bold uppercase tracking-widest text-[#cda434]">Loading Group Data</div>
    </div>
  </div>

  <!-- Main -->
  <div v-else>
    <div class="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <div class="relative z-10 p-5 flex flex-col lg:flex-row gap-5 max-w-full overflow-hidden">
        <!-- Sidebar -->
        <MemberSidebar class="w-full lg:w-[300px] shrink-0" :data="details" :computed-age="''"
          :format-date="formatDate" :member-initials="memberInitials" :upload-processing="uploadProcessing" />

        <!-- Main content -->
        <div class="flex-1 flex flex-col gap-5 min-w-0">
          <!-- Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="truncate text-lg font-black tracking-tight text-gray-900">{{ details.group_name || details.name || 'Group profile' }}</h2>
              <p class="text-xs font-medium text-gray-400">{{ members.length }} member{{ members.length === 1 ? '' : 's' }} · savings group</p>
            </div>
            <button type="button" @click="addMemberOpen = true"
              class="inline-flex items-center gap-2 rounded-xl bg-[#cda434] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#b8932e]">
              <UserPlus :size="16" /> Add Member
            </button>
          </div>

          <!-- Accounts -->
          <div v-if="profileDetails?.accounts" class="w-full overflow-x-auto">
            <MemberAccountsTable @reload="initialize" :member="details"
              :accounts="Array.isArray(profileDetails.accounts) ? profileDetails.accounts : []"
              :currency-code="currencyCode" :format-currency="formatCurrency"
              @new-account="newAccountDrawer?.openDrawer()"
              @custom-fee="(account) => customFeeDrawer?.openDrawer(account)" />
          </div>

          <!-- Tabs -->
          <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div class="flex overflow-x-auto border-b border-gray-100 px-4 whitespace-nowrap">
              <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
                'relative flex items-center gap-2 px-4 py-4 text-[13px] font-bold transition-colors whitespace-nowrap capitalize',
                activeTab === tab.id ? 'text-[#cda434]' : 'text-[#788896] hover:text-gray-900',
              ]">
                <component :is="tab.icon" :size="16" />
                {{ tab.label }}
                <span v-if="tab.count !== null"
                  class="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-md text-[11px] font-bold font-mono bg-gray-100 text-[#788896]">
                  {{ tab.count }}
                </span>
                <div v-if="activeTab === tab.id" class="absolute bottom-0 left-4 right-4 h-[3px] bg-[#cda434] rounded-t-full"></div>
              </button>
            </div>

            <!-- Group profile -->
            <div v-show="activeTab === 'profile'" class="p-4 bg-gray-50/40">
              <div class="columns-1 md:columns-2 xl:columns-3 gap-4">
                <section v-for="section in profileSections" :key="section.title"
                  class="break-inside-avoid mb-4 rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                  <div class="flex items-center gap-2 px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/50">
                    <div class="size-6 rounded-md bg-[#cda434]/10 flex items-center justify-center shrink-0">
                      <component :is="section.icon" :size="13" class="text-[#cda434]" />
                    </div>
                    <h3 class="text-[11px] font-bold text-gray-800 uppercase tracking-wide">{{ section.title }}</h3>
                  </div>
                  <div class="divide-y divide-gray-50">
                    <div v-for="f in section.fields" :key="f.key" class="flex items-start justify-between gap-3 px-3.5 py-2">
                      <span class="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 shrink-0 pt-px">
                        <component :is="f.icon" :size="12" class="shrink-0" />
                        {{ f.label }}
                      </span>
                      <div class="min-w-0 text-right">
                        <template v-if="f.type === 'badge'">
                          <span v-if="fieldValue(f.key)"
                            :class="['inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ring-1 ring-inset', badgeClass(fieldValue(f.key)!)]">
                            {{ fieldValue(f.key) }}
                          </span>
                          <span v-else class="text-[13px] text-gray-300">—</span>
                        </template>
                        <div v-else-if="f.type === 'copy'" class="flex items-center justify-end gap-1.5">
                          <span class="text-[12px] font-bold text-gray-900 font-mono truncate">{{ fieldValue(f.key) ?? '—' }}</span>
                          <button v-if="fieldValue(f.key)" @click="copyField(f.key)"
                            class="shrink-0 text-gray-400 hover:text-[#cda434] transition-colors" title="Copy">
                            <component :is="copiedKey === f.key ? Check : Copy" :size="13" :class="copiedKey === f.key ? 'text-emerald-500' : ''" />
                          </button>
                        </div>
                        <span v-else-if="f.type === 'currency'" class="text-[13px] font-bold text-gray-900">
                          <template v-if="fieldValue(f.key) !== null">{{ currencyCode }} {{ formatCurrency(fieldValue(f.key)!) }}</template>
                          <span v-else class="text-gray-300">—</span>
                        </span>
                        <span v-else-if="f.type === 'date'" class="text-[13px] font-bold text-gray-900">
                          {{ fieldValue(f.key) ? formatDate(fieldValue(f.key)!) : '—' }}
                        </span>
                        <span v-else class="text-[13px] font-bold text-gray-900 break-words">
                          <template v-if="fieldValue(f.key)">{{ fieldValue(f.key) }}</template>
                          <span v-else class="text-gray-300">—</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <!-- Members -->
            <div v-show="activeTab === 'members'" class="w-full overflow-x-auto">
              <MemberGroupList @reload="initialize" :member="profileDetails?.members ?? {}" :accounts="members"
                :currency-code="currencyCode" :format-currency="formatCurrency"
                @new-account="newAccountDrawer?.openDrawer()" />
            </div>

            <!-- Transactions -->
            <div v-show="activeTab === 'transactions'" class="w-full overflow-x-auto">
              <MemberTransactionsTab :transactions="member?.transactions" mode="all" action-color="bg-[#cda434]"
                :format-date="formatDate" :format-date-time="formatDateTime" :format-currency="formatCurrency"
                @print="printReceipt" />
            </div>

            <!-- Loans -->
            <div v-show="activeTab === 'loans'" class="w-full overflow-x-auto">
              <GroupMembersWithLoansTab mode="all" action-color="bg-[#cda434]" :format-date="formatDate"
                :format-date-time="formatDateTime" :format-currency="formatCurrency" @print="printReceipt" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add member to group -->
    <Drawer v-model:open="addMemberOpen" width="w-2/3" title="Add member to group">
      <template #body>
        <AddGroupTab :data="{ ...details, id: groupId }" v-model:form="addForm" />
      </template>
      <template #actions>
        <button type="button" @click="submitAddMember" :disabled="addSubmitting"
          class="inline-flex items-center gap-2 rounded-xl bg-[#cda434] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b8932e] disabled:opacity-60">
          {{ addSubmitting ? 'Adding…' : 'Add member' }}
        </button>
      </template>
    </Drawer>
  </div>
</template>

<style>
@media print {
  body.receipt-print * { visibility: hidden !important; }
  body.receipt-print .print-only,
  body.receipt-print .print-only * { visibility: visible !important; }
  body.receipt-print .print-only {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
  }
  body.receipt-print .no-print { display: none !important; }
  @page { margin: 0.5cm; size: auto; }
}
.print-only { display: none; }
</style>
