<template>
  <TableDrawer ref="drawer" :exportItems="exportItems" :drawerShowFooter="false" drawerWidth=" w-4/5" :url="tableUrl"
    state="LoanApplicationslist" :drawerTitle="drawerTitle" :columns="columns" @save="saveUser" 
    :showTableAction="['migrate']">
    <template #sub-header>
      <SummaryCards :list="Store?.LoanApplicationslist?.payload?.count_status" />
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
      <div class="  rounded-full  px-2 py-0.5 font-medium w-full" :class="daysPendingClass(item?.submitted_date)">
        {{ (item.submitted_date > 0 ? item.submitted_date + " days" : '-') }}
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
      <uploadTemplateColumData upload-trick="row" v-if="['upload-loan-application-template',].includes(automaticCreate.actionSlot)
      " :title="automaticCreate?.actionSlot" :url="`/loan-applications/${automaticCreate?.actionSlot}`"
        :submit-url="automaticCreate.actionSlot" />

      <ApplicationTemplateDrawer v-else-if="automaticCreate?.actionSlot === 'download-loan-application-template'"
        :action="action" :data="data" from="drawer" />
      <Create v-else :action="action" :data="data" from="drawer" />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router';
import { Create, SummaryCards, ApplicationTemplateDrawer } from './';
import { pomPinia } from 'septor-store';
import { uploadTemplateColumData } from '@/Global';
const Store = pomPinia();
const router = useRouter();
const statusFilter = ref('all'),
  drawer = ref('all'),
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
  { key: 'application_code', label: 'Application Code', sticky: 'left', width: '14em', copy: true },
  { key: 'member_name', label: 'Name', },
  { key: 'amount', label: 'Amount', type: 'money' },
  { key: 'submitted_date', label: 'days', onSearch: { type: 'date-range', } },
  { key: 'status', label: 'Status', 'width': '9em', type: "status" },
  { key: 'created_at', label: 'created at', sticky: 'left', type: 'date', onSearch: { type: 'date-range', } },
  { key: 'action', label: 'action', },
]
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
const exportItems = ref([
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
  {
    label: "Upload Loan Template",
    action: (vl) => {
      automaticCreate.value = {
        actionSlot: "upload-loan-application-template",
        item: vl,
      };
      OpenThedrawer(vl, "upload-loan-application-template");
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
