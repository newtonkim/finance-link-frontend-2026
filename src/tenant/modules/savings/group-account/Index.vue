<template>
  <TableDrawer   :drawerWidth="drawerTitle?.width"   :url="tableUrl"   state="groupAccountList"   :drawerTitle="drawerTitle?.title"   :columns="columns"   @save="saveUser" >
    <template #header-action>
      <div class="space-y-3">
 <nav class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400" >
   <a href="/tenant/dashboard" class="hover:text-[#0A2318] transition-colors">
     Dashboard
   </a>
   <svg
     xmlns="http://www.w3.org/2000/svg"
     class="h-3 w-3"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     stroke-width="2"
   >
     <path d="m9 18 6-6-6-6"></path>
   </svg>
   <span class="text-[#0A2318]">Group Savings</span>
 </nav>

 <PainPageHeader
   title="Group Savings"
   dec="Manage and monitor institutional savings groups, their membership tiers, and overall performance."
 />
      </div>
    </template>

    <template #sub-header>
      <AnalysisTile :data="stats" />
    </template>

    <template #searchSideAction>
      <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter"      />
    </template>

    <template #drawer="{ action, data }">
      <Create v-if="['add', 'edit'].includes(action)" :data="{ ...data, action }" v-model:form="formData"/>
      <Details v-if="action === 'view'" :data="data" />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch,onMounted } from 'vue'
import { Create, Details } from '.'
import {  TableDrawer,  StatusButtonsHorizontal,  addCommasCurrency,  AnalysisTile,  PainPageHeader} from '@/Global'
const props = defineProps<{
  data?: any
}>()
const formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const drawerTitle = ref({
  title: 'Create Tenant',
  width: 'w-1/3'
})
const filters = ['all', 'active', 'suspended', 'expired', 'trial']
const tableUrl = computed(() => {
  return `/group-account-savings/list?status=${statusFilter.value}`
})
const titleMap: Record<string, { title: string; width: string }> = {
  view: {
    title: "view group Savings account Details",
    width: "w-1/2"
  },
  edit: {
    title: "Edit Member Savings Account",
    width: "w-1/3"
  },
  add: {
    title: "Create a Group Savings",
    width: "w-2/3"
  }
}
const columns = [
  { key: 'group_name', label: 'name', sticky: 'left', width: '14em' },
  { key: 'phone', label: 'admin phone', sticky: 'left', width: '14em' },
  { key: 'group_code', label: 'code', sticky: 'left', width: '14em' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'total_in_group', label: 'total', type: 'number',width: '8em' },
  { key: 'dcreated', label: 'joined',   },
  { key: 'created_by', label: 'Created By',width: '10em' },
  { key: 'created_at', label: 'Created At', type: 'date',width: '9em'  },
  { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
const stats = ref<any[]>([])
function setData() {
  stats.value = [
    {
      title: 'Total Group',
      value: addCommasCurrency(props?.data?.tenants?.total_tenants ?? 0),
      trendColor: 'text-emerald-500',
      bgColor: 'bg-[#f0f9f6]',
      iconColor: 'text-[#2d9d78]'
    },
    {
      title: 'Active Portfolios',
      value: props?.data?.revenue?.monthly ?? '0.00',
      trendColor: 'text-neutral-400',
      bgColor: 'bg-[#f0f9f6]',
      iconColor: 'text-[#2d9d78]'
    },
    {
      title: 'Growth Rate',
      value: addCommasCurrency(props?.data?.revenue?.yearly ?? '0.00'),
      trendColor: 'text-neutral-400',
      bgColor: 'bg-[#f0f9f6]',
      iconColor: 'text-[#2d9d78]'
    }
  ]
}
onMounted(() => {
 setData()   
})
function saveUser(type: string, data: any) {
  if (titleMap[type]) {
    drawerTitle.value = titleMap[type]
  }
}
</script>