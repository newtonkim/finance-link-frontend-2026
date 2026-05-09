<template>
  <TableDrawer ref="drawer"
  :exportItems="exportItems"
   :drawerShowFooter="false" :importDefaults="['id', 'branch_id', 'dob']" drawerWidth=" w-4/5"
    :url="tableUrl" state="LoanApplicationslist" :drawerTitle="drawerTitle" :columns="columns" @save="saveUser"
    :showTableAction="true">
    <template #sub-header>
      <LoanApplicationSummaryCards :list="(Store as any)?.LoanApplicationslist?.payload?.count_status"
        :active-status="statusFilter" @filter="statusFilter = $event" />
    </template>
    <template #header-action>
      <div class="space-y-3">
        <PainPageHeader title="Loan Applications list" dec=" Manage and track member loan applications" />
      </div>
    </template>
    <template #application_code="{ item }">
      <CopyData :show="item?.application_code" :copy="item?.application_code">
        <template #text>
          <button @click="() => navigateToMoreLoanDetails(item)"
            class=" font-semibold text-nfuko-action text-sm dark:text-white  cursor-pointer">
            <span>{{ item?.application_code }}</span>-
          </button>
        </template>
      </CopyData>
    </template>
    <template #submitted_date="{ item }">
      <div class="  rounded-full  px-2 py-0.5 font-medium w-full" :class="daysPendingClass(item?.submitted_date)">{{
        (item.submitted_date > 0 ? item.submitted_date + " days" :
          '-') }}
      </div>
    </template>
    <template #action="{ item }">
      <div class="flex items-center justify-end gap-1">
        <template v-if="item.status === 'recommended'">
          <TabelActionButtons title="" color="success" icon="ThumbsUp" @action="() => emit('approve', item)" />
          <TabelActionButtons title="" color="danger" icon="ThumbsDown" @action="() => emit('decline', item)" />
        </template>
        <TabelActionButtons v-if="item.status === 'draft'" title="Edit" color="secondary" icon="Pencil"
          @action="() => navigateToMoreLoanEdit(item)" />
        <TabelActionButtons v-if="item.status === 'cancelled'" title="Edit" color="secondary" icon="RotateCcw"
          @action="() => emit('reopen', item.id!)" />
      </div>
    </template>
    <template #searchSideAction>
      <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
    </template>
    <template #drawer="{ action, data }">
      <LoanApplicationCreate v-if="['add', 'edit'].includes(action)" :action="action" :data="data" @close="closeDrawer"
        from="drawer" />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router';
import LoanApplicationCreate from './LoanApplicationCreate.vue';
import { pomPinia } from 'septor-store';
import LoanApplicationSummaryCards from '../components/LoanApplicationSummaryCards.vue';
const Store = pomPinia();
const router = useRouter();
const route = useRoute();
const statusFilter = ref((route.query.status as string) || 'all'),
 drawer = ref<any>(null),
 automaticCreate = ref<any>({}),
  drawerTitle = ref('Create Tenant'), filters = ['all', 'Submitted', 'Draft', 'Disbursed', 'Approved', 'committee_voting'],
  closeDrawer = () => drawer.value?.toggleDrawer(),
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
}>()
const columns = [
  { key: 'application_code', label: 'Application Code', sticky: 'left', width: '14em', copy: true },
  { key: 'member_name', label: 'Name', },
  { key: 'amount', label: 'Amount', type: 'money' },
  { key: 'submitted_date', label: 'days', onSearch: { type: 'date-range', } },
  { key: 'status', label: 'Status', 'width': '9em', type: "status" },
  { key: 'created_at', label: 'created at', sticky: 'left', type: 'date', onSearch: { type: 'date-range', } },
  { key: 'action', label: 'action', },
]
watch(statusFilter, (val) => {
  router.replace({ query: val !== 'all' ? { status: val } : {} })
})

function navigateToMoreLoanDetails(item: any) {
  router.push(`loan-applications/${item.id}`)
}
function navigateToMoreLoanEdit(item: any) {
  router.push(`loan-applications/${item.id}/edit`)
}
function daysPendingClass(days: number) {
  if (days >= 15) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (days >= 8) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  if (days >= 4) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'text-neutral-500 dark:text-neutral-400'
}
const  exportItems = ref([
    {
      label: "Download Loan Template",
      action: (vl) => {
        automaticCreate.value = {
          actionSlot: "download-loan-application-template",
          item: vl,
        };
        OpenThedrawer(vl, "download-loan-application-template");
      },
    },
  ]);
function OpenThedrawer(item: any, action = "deposit") {
  automaticCreate.value = { actionSlot: action, ...item };
  // showFooter.value = ["withdrawal", "deposit"].includes(action);
  //   showFooter.value = ["withdrawal", "deposit"].includes(action);
  // drawerTitle.value = title?.[action];
  setTimeout(() => {
    drawer.value.toggleDrawer();
  }, 100);
}

</script>
