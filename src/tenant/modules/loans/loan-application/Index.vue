<template>
  <TableDrawer ref="drawer" :exportItems="exportItems" :drawerShowFooter="false" drawerWidth=" w-4/5" :url="tableUrl"
    state="LoanApplicationslist" :drawerTitle="drawerTitle" :columns="columns" @save="saveUser"
    :showTableAction="['migrate']">

    <template #header-action>
      <div class="flex items-center gap-3">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#052659]/10 text-[#052659] dark:bg-white/10 dark:text-white">
          <FileText :size="20" />
        </span>
        <div class="min-w-0">
          <h1 class="text-2xl font-black leading-tight tracking-tight text-[#06265a] dark:text-white">Loan applications</h1>
          <p class="mt-0.5 text-sm font-medium text-slate-500 dark:text-neutral-400">Review, appraise and decide member loan requests.</p>
        </div>
      </div>
    </template>

    <!-- Portfolio KPIs -->
    <template #sub-header>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="k in kpis" :key="k.label"
          class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ k.label }}</p>
              <p class="mt-1.5 truncate font-mono text-xl font-black leading-none tracking-tight text-slate-900 dark:text-white">{{ k.value }}</p>
              <p class="mt-1.5 text-[11px] font-medium text-slate-400">{{ k.sub }}</p>
            </div>
            <div class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="k.tintBg">
              <component :is="k.icon" class="size-5" :class="k.tintText" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #searchSideAction>
      <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
    </template>

    <!-- Bespoke applications table -->
    <template #table="{ rows, loading }">
      <table class="w-full min-w-260 border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-slate-200 dark:border-neutral-800">
            <th class="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Application</th>
            <th class="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Member</th>
            <th class="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Product</th>
            <th class="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Amount</th>
            <th class="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Status</th>
            <th class="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Aging</th>
            <th class="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-800">
          <template v-if="loading">
            <tr v-for="i in 6" :key="`s${i}`" class="animate-pulse">
              <td class="px-5 py-4"><div class="h-3.5 w-28 rounded bg-slate-100 dark:bg-neutral-800" /><div class="mt-2 h-2.5 w-16 rounded bg-slate-100 dark:bg-neutral-800" /></td>
              <td class="px-5 py-4"><div class="flex items-center gap-3"><div class="size-9 rounded-full bg-slate-100 dark:bg-neutral-800" /><div class="h-3.5 w-24 rounded bg-slate-100 dark:bg-neutral-800" /></div></td>
              <td class="px-5 py-4"><div class="h-3.5 w-24 rounded bg-slate-100 dark:bg-neutral-800" /></td>
              <td class="px-5 py-4"><div class="ml-auto h-4 w-24 rounded bg-slate-100 dark:bg-neutral-800" /></td>
              <td class="px-5 py-4"><div class="h-5 w-20 rounded-full bg-slate-100 dark:bg-neutral-800" /></td>
              <td class="px-5 py-4"><div class="h-3.5 w-14 rounded bg-slate-100 dark:bg-neutral-800" /></td>
              <td class="px-5 py-4"><div class="ml-auto h-7 w-16 rounded bg-slate-100 dark:bg-neutral-800" /></td>
            </tr>
          </template>

          <tr v-else-if="!rows.length">
            <td colspan="7" class="px-5 py-20 text-center">
              <div class="mx-auto flex max-w-xs flex-col items-center">
                <span class="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-neutral-800">
                  <FileText :size="22" />
                </span>
                <p class="text-sm font-bold text-slate-700 dark:text-neutral-200">No applications here</p>
                <p class="mt-1 text-xs text-slate-400">Applications in this stage will show up here.</p>
              </div>
            </td>
          </tr>

          <tr v-else v-for="item in rows" :key="item.id"
            class="group transition-colors hover:bg-[#052659]/2.5 dark:hover:bg-neutral-800/40">
            <!-- Application -->
            <td class="px-5 py-4 align-top">
              <CopyData :copy="item.application_code">
                <template #text>
                  <button type="button" @click="navigateToMoreLoanDetails(item)"
                    class="block max-w-44 truncate text-left font-mono text-[13px] font-bold text-[#052659] transition-colors hover:underline dark:text-white">
                    {{ item.application_code }}
                  </button>
                </template>
              </CopyData>
              <div class="mt-1 text-[11px] font-medium text-slate-400">{{ fmtDate(item.submitted_at || item.created_at) }}</div>
            </td>

            <!-- Member -->
            <td class="px-5 py-4 align-top">
              <div class="flex items-center gap-3">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#052659]/10 text-[11px] font-black uppercase text-[#052659] ring-1 ring-[#052659]/10 dark:bg-white/10 dark:text-white dark:ring-white/10">
                  {{ initials(item.member_name) }}
                </span>
                <div class="min-w-0">
                  <div class="truncate text-sm font-bold text-slate-900 dark:text-white">{{ item.member_name?.trim() || '—' }}</div>
                  <div class="truncate font-mono text-[11px] text-slate-400">{{ item.member_code || '—' }}</div>
                </div>
              </div>
            </td>

            <!-- Product -->
            <td class="px-5 py-4 align-top">
              <div class="truncate text-[13px] font-semibold text-slate-700 dark:text-neutral-200">{{ item.product_name || '—' }}</div>
              <div class="truncate text-[11px] font-medium text-slate-400">
                {{ item.interest_rate ? Number(item.interest_rate) + '%' : '' }}<span v-if="item.interest_rate && termMonths(item)"> · </span>{{ termMonths(item) ? termMonths(item) + ' mo' : '' }}
              </div>
            </td>

            <!-- Amount trail -->
            <td class="px-5 py-4 text-right align-top">
              <div class="font-mono text-[14px] font-black tracking-tight text-slate-900 dark:text-white">{{ fmtMoney(item.amount) }}</div>
              <div v-if="approvedDiffers(item)" class="mt-0.5 font-mono text-[11px] font-bold text-emerald-600">&rarr; {{ fmtMoney(item.approved_amount) }}</div>
              <div v-else class="mt-0.5 text-[11px] font-medium text-slate-400">requested</div>
            </td>

            <!-- Status -->
            <td class="px-5 py-4 align-top">
              <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize leading-none ring-1 ring-inset"
                :class="statusPill(item.status)">
                <span class="size-1.5 rounded-full bg-current"></span>
                {{ statusLabel(item.status) }}
              </span>
            </td>

            <!-- Aging -->
            <td class="px-5 py-4 align-top">
              <span class="inline-flex rounded-md px-2 py-0.5 text-[12px] font-bold" :class="daysPendingClass(item.submitted_date)">
                {{ item.submitted_date > 0 ? item.submitted_date + 'd' : '—' }}
              </span>
            </td>

            <!-- Action -->
            <td class="px-5 py-4 text-right align-top">
              <div class="flex items-center justify-end gap-1">
                <template v-if="item.status === 'recommended'">
                  <TabelActionButtons title="" color="success" icon="ThumbsUp" @action="() => emit('approve', item)" />
                  <TabelActionButtons title="" color="danger" icon="ThumbsDown" @action="() => emit('decline', item)" />
                </template>
                <TabelActionButtons v-if="item.status === 'draft'" title="Edit" color="secondary" icon="Pencil"
                  @action="() => navigateToMoreLoanEdit(item)" />
                <TabelActionButtons v-if="item.status === 'cancelled'" title="Reopen" color="secondary" icon="RotateCcw"
                  @action="() => emit('reopen', item.id!)" />
                <button type="button" @click="navigateToMoreLoanDetails(item)" title="View application"
                  class="flex size-8 items-center justify-center rounded-lg text-[#052659] transition hover:bg-[#052659] hover:text-white dark:text-white">
                  <Eye class="size-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </template>

    <template #drawer="{ action, data }">
      <uploadTemplateColumData upload-trick="row" v-if="['upload-loan-application-template','upload-loan-repayment-template','upload-loan-transaction-template'].includes(automaticCreate.actionSlot)
      " :title="automaticCreate?.actionSlot" :url="`/loan-applications/${automaticCreate?.actionSlot}`"
        :submit-url="automaticCreate.actionSlot" :submit="() => {}" />

      <ApplicationTemplateDrawer v-else-if="automaticCreate?.actionSlot === 'download-loan-application-template'"
        :action="action" :data="data" from="drawer" />
      <LoanRepaymentTemplate v-else-if="automaticCreate?.actionSlot === 'Download-loan-repayment-template'"
        :action="action" :data="data" from="drawer" />
      <LoanTransactionTemplate v-else-if="automaticCreate?.actionSlot === 'loan-transactions-template'"
        :action="action" :data="data" from="drawer" />
      <Create v-else :action="action" :data="data" from="drawer" />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router';
import { FileText, HandCoins, Banknote, Layers, Activity, Eye } from 'lucide-vue-next'
import { Create, ApplicationTemplateDrawer, LoanRepaymentTemplate, LoanTransactionTemplate } from './';
import { pomPinia } from 'septor-store';
import { uploadTemplateColumData, formatMoneyValue } from '@/Global';
const Store = pomPinia();
const router = useRouter();
const statusFilter = ref('all'),
  drawer = ref<any>(null),
  automaticCreate = ref<any>({}),
  drawerTitle = ref('Create Tenant'), filters = ['all', 'Submitted', 'Draft', 'Disbursed', 'Approved', 'committee_voting'],
  tableUrl = computed(() => `/loan-applications/list?status=${statusFilter.value}`),
  title: Record<string, string> = {
    "add": "Create member application ",
  }
function saveUser(type: string, data: any) {
  if (title?.[type]) drawerTitle.value = title?.[type]
}
const emit = defineEmits<{
  view: [app: any]
  edit: [app: any]
  approve: [app: any]
  decline: [app: any]
  reopen: [id: number]
}>();

const columns = [
  { key: 'application_code', label: 'Application Code', sticky: 'left', width: '16em', copy: true },
  { key: 'member_name', label: 'Name', },
  { key: 'amount', label: 'Amount', type: 'money' },
  { key: 'submitted_date', label: 'days', onSearch: { type: 'date-range', } },
  { key: 'status', label: 'Status', 'width': '9em', type: "status" },
  { key: 'created_at', label: 'created at', sticky: 'left', type: 'date', onSearch: { type: 'date-range', } },
  { key: 'action', label: 'action' },
]

// ── Portfolio KPIs from the status roll-up (count + summed value per stage) ────
const countStatus = computed<any[]>(() => (Store as any)?.LoanApplicationslist?.payload?.count_status ?? [])
const countMap = computed<Record<string, { total: number; total_amount: number }>>(() => {
  const map: Record<string, { total: number; total_amount: number }> = {}
  for (const r of countStatus.value) {
    map[String(r?.status ?? '').toLowerCase()] = { total: Number(r?.total ?? 0), total_amount: Number(r?.total_amount ?? 0) }
  }
  return map
})
const IN_REVIEW = ['submitted', 'under_review', 'awaiting_documents', 'recommended', 'committee_voting']
const sumOf = (keys: string[], field: 'total' | 'total_amount') =>
  keys.reduce((s, k) => s + (countMap.value[k]?.[field] ?? 0), 0)

const kpis = computed(() => [
  {
    label: 'Pipeline value', value: fmtMoney(sumOf(IN_REVIEW, 'total_amount')),
    sub: `${sumOf(IN_REVIEW, 'total')} in review`, icon: Layers,
    tintBg: 'bg-[#052659]/10 dark:bg-white/10', tintText: 'text-[#052659] dark:text-white',
  },
  {
    label: 'Approved', value: fmtMoney(countMap.value['approved']?.total_amount ?? 0),
    sub: `${countMap.value['approved']?.total ?? 0} awaiting disbursement`, icon: HandCoins,
    tintBg: 'bg-emerald-50 dark:bg-emerald-500/15', tintText: 'text-emerald-600',
  },
  {
    label: 'Disbursed', value: fmtMoney(countMap.value['disbursed']?.total_amount ?? 0),
    sub: `${countMap.value['disbursed']?.total ?? 0} loans`, icon: Banknote,
    tintBg: 'bg-[#cda434]/10', tintText: 'text-[#cda434]',
  },
  {
    label: 'Active loans', value: String(countMap.value['active']?.total ?? 0),
    sub: 'currently running', icon: Activity,
    tintBg: 'bg-slate-100 dark:bg-white/10', tintText: 'text-slate-500',
  },
])

// ── Row helpers ───────────────────────────────────────────────────────────────
function fmtMoney(v?: string | number): string {
  return formatMoneyValue(v ?? 0)
}
function fmtDate(d?: string): string {
  if (!d) return '—'
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function initials(name?: string): string {
  return String(name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '—'
}
function termMonths(item: any): number {
  return Number(item?.approved_term || item?.requested_term || 0)
}
function approvedDiffers(item: any): boolean {
  const approved = Number(item?.approved_amount ?? 0)
  return approved > 0 && approved !== Number(item?.amount ?? 0)
}
function statusLabel(status?: string): string {
  return String(status ?? '').replace(/_/g, ' ')
}
function statusPill(status?: string): string {
  const s = String(status ?? '').toLowerCase()
  if (['approved', 'disbursed', 'active'].includes(s)) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  if (['rejected', 'declined', 'cancelled'].includes(s)) return 'bg-rose-50 text-rose-600 ring-rose-600/20'
  if (['draft'].includes(s)) return 'bg-slate-100 text-slate-600 ring-slate-500/20'
  return 'bg-amber-50 text-amber-700 ring-amber-600/20'
}

function navigateToMoreLoanDetails(item: any) {
  router.push(`loan-applications/${item.id}`)
}
function navigateToMoreLoanEdit(item: any) {
  router.push(`loan-applications/${item.id}/edit`)
}
function daysPendingClass(days: number) {
  if (days >= 15) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
  if (days >= 8) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  if (days >= 4) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400'
}
const exportItems = ref([
  {
    label: "Loan Template",
    action: (vl) => {
      automaticCreate.value = { actionSlot: "download-loan-application-template", item: vl };
      OpenThedrawer(vl, "download-loan-application-template");
    },
  },
  {
    label: "loan transaction Template",
    action: (vl) => {
      automaticCreate.value = { actionSlot: "loan-transaction-template", item: vl };
      OpenThedrawer(vl, "loan-transactions-template");
    },
  },
  {
    label: "Loan Repayment Template",
    action: (vl) => {
      automaticCreate.value = { actionSlot: "Download-loan-repayment-template", item: vl };
      OpenThedrawer(vl, "Download-loan-repayment-template");
    },
  },
  {
    label: "Upload Loan Template",
    action: (vl) => {
      automaticCreate.value = { actionSlot: "upload-loan-application-template", item: vl };
      OpenThedrawer(vl, "upload-loan-application-template");
    },
  },
  {
    label: "uplaod loan transaction",
    action: (vl) => {
      automaticCreate.value = { actionSlot: "upload-loan-transaction-template", item: vl };
      OpenThedrawer(vl, "upload-loan-transactions-template");
    },
  },
  {
    label: "upload Loan Repayment Template",
    action: (vl) => {
      automaticCreate.value = { actionSlot: "upload-loan-repayment-template", item: vl };
      OpenThedrawer(vl, "upload-loan-repayment-template");
    },
  },
]);
function OpenThedrawer(item: any, action = "") {
  automaticCreate.value = { actionSlot: action, ...item };
  drawerTitle.value = item?.label;
  setTimeout(() => {
    drawer.value.toggleDrawer();
  }, 100);
}
watch(
  () => drawer.value?.drawerOpen,
  (v) => {
    if (!v) {
      automaticCreate.value = {};
    }
  }
);
</script>
