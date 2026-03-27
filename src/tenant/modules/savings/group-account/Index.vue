<template>
  <TableDrawer :permissions="{
    create: 'group-saving-create',
    view: 'group-saving-details',
    edit: 'group-saving-update',
    delete: 'group-saving-delete'
  }" :automaticCreate="automaticCreate.actionSlot != 'create-none-member'" :drawerWidth="drawerTitle?.width"
    :url="tableUrl" state="groupAccountList" :drawerTitle="drawerTitle?.title" :columns="columns" @save="saveUser"
    ref="drawer">
    <template #header-action>
      <div class="space-y-3">
        <PainPageHeader title="Group Savings"
          dec="Manage and monitor institutional savings groups, their membership tiers, and overall performance." />
      </div>
    </template>
    <template #sub-header>
      <AnalysisTile :data="stats" />
    </template>
    <template #actions="{ item }: { item: any }">
      <TabelActionButtons @action="() => OpenThedrawer(item)" title="add to group " color="primary" icon="CirclePile" />
    </template>
    <template #searchSideAction>
      <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
    </template>
    <template #drawer="{ action, data }">

      <CreateNoneMember v-if="automaticCreate.actionSlot == 'create-none-member'" :data="{ ...data, action }"
        v-model:form="formData" />
      <Create v-else-if="['add', 'edit'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
      <Details v-else-if="action === 'view'" :data="data" />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Create, Details, CreateNoneMember } from '.'
import { TableDrawer, StatusButtonsHorizontal, addNumberCommas, AnalysisTile, PainPageHeader, TabelActionButtons } from '@/Global'
import { groupSavingsApi } from '@/tenant/apis/savings/group-savingsApi';

const props = defineProps<{
  data?: any
}>(),
  automaticCreate = ref({ drawerActions: true, actionSlot: null, item: null }),
  drawer = ref(null),
  formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const drawerTitle = ref({
  title: 'Create Tenant',
  width: 'w-1/3'
})
const filters = ['all', 'active', 'suspended', 'expired', 'trial'],
  { addNoneExistingMember } = groupSavingsApi()
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
    width: " md:w-2/3 sm:w-full"
  }
}
const columns = [
  { key: 'group_code', label: 'group code', copy: true, sticky: 'left', width: '14em' },
  { key: 'group_name', label: 'name', sticky: 'left', width: '14em' },
  { key: 'phone', label: 'admin phone', sticky: 'left', width: '14em' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'total_in_group', label: 'total members', type: 'number', width: '10em' },
  { key: 'created_by', label: 'Created By', width: '10em' },
  { key: 'dcreated', label: 'joined', },
  { key: 'created_at', label: 'Created At', type: 'date', width: '9em' },
  { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
const stats = ref<any[]>([])
function setData() {
  stats.value = [
    {
      title: 'Total Group',
      value: addNumberCommas(props?.data?.tenants?.total_tenants ?? 45),
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
      value: addNumberCommas(props?.data?.revenue?.yearly ?? '1.00'),
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
  // alert()
  if (automaticCreate.value.actionSlot == 'create-none-member') {
    addNoneExistingMember(formData.value,automaticCreate.value.item)
    automaticCreate.value = { actionSlot: 'create-none-member',item:automaticCreate.value.item}
    return
  } else if (titleMap[type]) {
    drawerTitle.value = titleMap[type]
  }
}
function OpenThedrawer(item: any) {
  automaticCreate.value = { actionSlot: 'create-none-member', item }
  drawerTitle.value = { title: "add member to group", width: "w-2/4" }
  setTimeout(() => {
    drawer.value.toggleDrawer()
  }, 1000)
}
</script>